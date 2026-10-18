import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2, Compass, MapPin, Navigation, RefreshCw,
  ShieldCheck, TriangleAlert,
} from 'lucide-react';
import {
  calculateQiblaBearing, calculateTurnDirection, estimateMagneticDeclination,
  getAlignmentState, normalizeBearing, shortestAngleDifference, smoothHeading,
} from '../services/qiblaCalculator';
import { getUserLocation, watchUserLocation } from '../services/locationService';
import BackButton from '../components/ui/BackButton';
import './Qibla.css';

const ALIGN_ENTER_THRESHOLD = 5;
const ALIGN_EXIT_THRESHOLD = 8;
const SENSOR_TIMEOUT_MS = 4500;

const hasIOSPermissionGate =
  typeof DeviceOrientationEvent !== 'undefined' &&
  typeof DeviceOrientationEvent.requestPermission === 'function';

function headingFromEvent(event, declination = 0) {
  // 1. iOS Safari provides webkitCompassHeading (0-360 clockwise from North)
  if (Number.isFinite(event.webkitCompassHeading)) {
    return normalizeBearing(event.webkitCompassHeading);
  }

  // 2. Android Chrome & standards-compliant mobile browsers
  if (Number.isFinite(event.alpha)) {
    // Screen orientation angle (portrait = 0, landscape = 90 / 270)
    const screenAngle = window.screen?.orientation?.angle ?? window.orientation ?? 0;
    // W3C alpha is counter-clockwise [0, 360). Clockwise heading = 360 - alpha.
    let heading = 360 - event.alpha + screenAngle;
    // Apply true-north correction (magnetic declination)
    if (declination) {
      heading += declination;
    }
    return normalizeBearing(heading);
  }

  return null;
}

function CompassDial({ heading, qiblaBearing, alignment }) {
  const dialRotation = heading == null ? 0 : -heading;

  // Relative rotation from top marker (12 o'clock) to Qibla
  // When heading is known: shortest angle difference from heading to Qibla bearing
  // When heading is unknown: point to Qibla bearing on the stationary dial
  const targetAngle = (heading != null && qiblaBearing != null)
    ? shortestAngleDifference(heading, qiblaBearing)
    : (qiblaBearing ?? 0);

  // Smoothly unwrap rotation angle to prevent 360° flip across the ±180° boundary
  const prevAngleRef = useRef(targetAngle);
  const unwrappedAngleRef = useRef(targetAngle);

  const angleDiff = shortestAngleDifference(prevAngleRef.current, targetAngle);
  unwrappedAngleRef.current += angleDiff;
  prevAngleRef.current = targetAngle;

  const isAligned = alignment === 'aligned';

  return (
    <div className={`qibla-dial ${isAligned ? 'is-aligned' : ''}`} role="img" aria-label="Qibla compass">
      <div className="qibla-forward-marker" aria-hidden="true" />
      <svg className="qibla-dial-svg" viewBox="0 0 320 320" aria-hidden="true">
        <g style={{ transform: `rotate(${dialRotation}deg)`, transformOrigin: '160px 160px' }}>
          <circle cx="160" cy="160" r="157" className="qibla-dial-face" />
          <circle cx="160" cy="160" r="145" className="qibla-dial-inner" />
          {Array.from({ length: 72 }).map((_, index) => {
            const degrees = index * 5;
            const radians = (degrees * Math.PI) / 180;
            const major = index % 18 === 0;
            const medium = index % 6 === 0;
            const inner = major ? 119 : medium ? 129 : 137;
            return <line key={degrees}
              x1={160 + 145 * Math.sin(radians)} y1={160 - 145 * Math.cos(radians)}
              x2={160 + inner * Math.sin(radians)} y2={160 - inner * Math.cos(radians)}
              className={`qibla-tick${major ? ' major' : medium ? ' medium' : ''}`} />;
          })}
          {[['N', 0], ['E', 90], ['S', 180], ['W', 270]].map(([label, degrees]) => {
            const radians = (degrees * Math.PI) / 180;
            return <text key={label} x={160 + 116 * Math.sin(radians)} y={166 - 116 * Math.cos(radians)}
              textAnchor="middle" className={`qibla-cardinal ${label === 'N' ? 'north' : ''}`}>{label}</text>;
          })}
        </g>
      </svg>
      {qiblaBearing != null && <div className="qibla-pointer" aria-hidden="true"
        style={{ transform: `translateX(-50%) rotate(${unwrappedAngleRef.current}deg)` }}>
        <svg viewBox="0 0 32 118" className="qibla-pointer-svg">
          <path d="M16 5 26 101 16 114 6 101Z" className="qibla-pointer-body" />
          <circle cx="16" cy="12" r="7" className="qibla-pointer-tip" />
          <path d="M16 19 19 91 16 98 13 91Z" className="qibla-pointer-shine" />
        </svg>
      </div>}
      <div className="qibla-dial-center" aria-hidden="true">
        <img src="/channels4_profile.jpg" alt="" draggable="false" />
        {isAligned && <span className="qibla-aligned-check"><CheckCircle2 size={20} /></span>}
      </div>
    </div>
  );
}

export default function QiblaPage() {
  const isDesktop = !(/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent));

  const [locationState, setLocationState] = useState('idle');
  const [qiblaBearing, setQiblaBearing] = useState(null);
  const [compassState, setCompassState] = useState('idle');
  const [heading, setHeading] = useState(null);
  const [alignment, setAlignment] = useState('unknown');

  const cleanupRef = useRef(null);
  const smoothRef = useRef(null);
  const alignedRef = useRef(false);
  const declinationRef = useRef(0);
  const watchIdRef = useRef(null);

  const stopCompass = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const startCompass = useCallback(async (skipPermission = false) => {
    stopCompass();
    smoothRef.current = null;
    alignedRef.current = false;
    setHeading(null);
    setAlignment('unknown');

    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setCompassState('unavailable');
      return;
    }

    setCompassState('requesting');
    if (hasIOSPermissionGate && !skipPermission) {
      try {
        if (await DeviceOrientationEvent.requestPermission() !== 'granted') {
          setCompassState('denied');
          return;
        }
      } catch {
        setCompassState('denied');
        return;
      }
    }

    let received = false;
    const onOrientation = (event) => {
      const rawHeading = headingFromEvent(event, declinationRef.current);
      if (rawHeading == null) return;
      received = true;

      if (smoothRef.current === null) {
        smoothRef.current = rawHeading;
        setHeading(rawHeading);
      } else {
        const diff = Math.abs(shortestAngleDifference(smoothRef.current, rawHeading));
        // Deadband filter: ignore micro-jitters (< 0.6°) from handheld sensor noise
        if (diff < 0.6) return;

        // Dynamic smoothing: if user is turning quickly, respond faster; if holding still, dampen shakes
        const alpha = diff > 8 ? 0.35 : 0.12;
        smoothRef.current = smoothHeading(smoothRef.current, rawHeading, alpha);
        setHeading(smoothRef.current);
      }
      setCompassState('active');
    };

    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);

    const timeout = window.setTimeout(() => {
      if (!received) {
        stopCompass();
        setCompassState('unavailable');
      }
    }, SENSOR_TIMEOUT_MS);

    cleanupRef.current = () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation, true);
      window.removeEventListener('deviceorientation', onOrientation, true);
      window.clearTimeout(timeout);
    };
  }, [stopCompass]);

  const requestLocation = useCallback(async () => {
    let compassPerm = 'unknown';
    if (hasIOSPermissionGate) {
      try {
        compassPerm = await DeviceOrientationEvent.requestPermission();
      } catch {
        compassPerm = 'denied';
      }
    }

    setLocationState('requesting');

    const handleCoords = (coords) => {
      const dec = estimateMagneticDeclination(coords.latitude, coords.longitude);
      declinationRef.current = dec;
      setQiblaBearing(calculateQiblaBearing(coords.latitude, coords.longitude));
      setLocationState('granted');
      if (compassPerm !== 'denied') {
        startCompass(true);
      } else {
        setCompassState('denied');
      }
    };

    try {
      const loc = await getUserLocation({ allowIPFallback: true });
      handleCoords(loc);

      // Continuous watch for position updates
      if (watchIdRef.current != null) {
        watchIdRef.current(); // call the returned cleanup function
        watchIdRef.current = null;
      }
      watchUserLocation(
        (coords) => {
          const dec = estimateMagneticDeclination(coords.latitude, coords.longitude);
          declinationRef.current = dec;
          setQiblaBearing(calculateQiblaBearing(coords.latitude, coords.longitude));
        },
        null,
      ).then((cleanup) => {
        watchIdRef.current = cleanup;
      });
    } catch (err) {
      console.error('Qibla location error:', err);
      if (err.code === 'PERMISSION_DENIED') {
        setLocationState('denied');
      } else {
        setLocationState('error');
      }
    }
  }, [startCompass]);

  const liveCompass = compassState === 'active' && heading != null;
  const displayBearing = qiblaBearing != null ? normalizeBearing(Math.round(qiblaBearing)) : null;
  const displayHeading = liveCompass ? normalizeBearing(Math.round(heading)) : null;

  // Turn guidance and consistency
  const turnInfo = useMemo(() => {
    if (displayHeading == null || displayBearing == null) return null;
    return calculateTurnDirection(displayHeading, displayBearing, ALIGN_ENTER_THRESHOLD);
  }, [displayHeading, displayBearing]);

  const angularDifference = useMemo(() => (
    heading != null && qiblaBearing != null ? Math.abs(shortestAngleDifference(heading, qiblaBearing)) : null
  ), [heading, qiblaBearing]);

  useEffect(() => {
    if (angularDifference == null) return;
    const next = getAlignmentState(angularDifference, alignedRef.current, ALIGN_ENTER_THRESHOLD, ALIGN_EXIT_THRESHOLD);
    const enteringAlignment = next === 'aligned' && !alignedRef.current;
    alignedRef.current = next === 'aligned';
    setAlignment(next);
    if (enteringAlignment && navigator.vibrate) navigator.vibrate(45);
  }, [angularDifference]);

  useEffect(() => {
    return () => {
      stopCompass();
      if (typeof watchIdRef.current === 'function') {
        watchIdRef.current();
        watchIdRef.current = null;
      }
    };
  }, [stopCompass]);

  if (isDesktop) {
    return (
      <main className="qibla-page qibla-centered-layout" id="main-content">
        <BackButton fallback="/" label="Back" style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }} />
        <section className="qibla-error-card">
          <div className="qibla-welcome-icon icon-error" aria-hidden="true">
            <Compass size={34} />
          </div>
          <h1 className="qibla-welcome-title">Mobile Only</h1>
          <p className="qibla-welcome-body">
            The Qibla compass requires device orientation sensors that are only available on mobile devices. Please open this app on your phone to find the Qibla direction.
          </p>
        </section>
      </main>
    );
  }

  if (locationState !== 'granted') {
    const hasLocationIssue = ['denied', 'error', 'unsupported'].includes(locationState);
    return (
      <main className="qibla-page qibla-centered-layout" id="main-content">
        <BackButton fallback="/" label="Back" style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }} />
        <section className={hasLocationIssue ? 'qibla-error-card' : 'qibla-welcome'}>
          <div className={`qibla-welcome-icon${hasLocationIssue ? ' icon-error' : ''}`} aria-hidden="true">
            {hasLocationIssue ? <TriangleAlert size={34} /> : <Navigation size={40} />}
          </div>
          <h1 className="qibla-welcome-title">{hasLocationIssue ? 'Location needed' : 'Find your Qibla'}</h1>
          <p className="qibla-welcome-body">
            {locationState === 'denied' ? 'Allow location access in browser settings, then try again. It is used only to calculate direction to Makkah.'
              : locationState === 'unsupported' ? 'This browser cannot provide location, so a personal Qibla bearing cannot be calculated.'
                : locationState === 'error' ? 'We could not get a reliable location. Check GPS or network access and try again.'
                  : 'Use your location to calculate the accurate direction to the Kaaba in Makkah. Your precise coordinates are not displayed.'}
          </p>
          <button className="btn btn-primary btn-lg" onClick={requestLocation} disabled={locationState === 'requesting'}>
            <MapPin size={18} />{locationState === 'requesting' ? 'Finding location…' : hasLocationIssue ? 'Try again' : 'Use my location'}
          </button>
        </section>
      </main>
    );
  }


  return (
    <main className="qibla-page qibla-app-layout" id="main-content" aria-label="Qibla direction">
      <BackButton fallback="/" label="Back" style={{ position: 'absolute', top: 16, left: 16, zIndex: 10 }} />
      <CompassDial heading={liveCompass ? heading : null} qiblaBearing={qiblaBearing} alignment={alignment} />
      {!liveCompass && <section className="qibla-sensor-card">
        <ShieldCheck size={19} aria-hidden="true" /><div>
          <h2>{compassState === 'unavailable' ? 'Live compass unavailable' : compassState === 'denied' ? 'Compass permission denied' : 'Enable live compass'}</h2>
          <p>{compassState === 'unavailable'
            ? 'This browser did not provide a verified compass heading. Use a physical compass; we will not guess your direction.'
            : 'For live guidance, keep your phone flat and allow motion and orientation access.'}</p>
          <button className={`btn ${compassState === 'unavailable' ? 'btn-secondary' : 'btn-primary'}`} onClick={startCompass}>
            {compassState === 'unavailable' ? <RefreshCw size={16} /> : <Compass size={16} />}{compassState === 'unavailable' ? 'Try compass again' : 'Enable compass'}
          </button>
        </div>
      </section>}
    </main>
  );
}
