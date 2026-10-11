import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

const CACHE_KEY = 'peace_user_location';

/**
 * Get cached location if available
 */
export function getCachedLocation() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
      return data;
    }
  } catch {
    // Ignore JSON parse errors
  }
  return null;
}

/**
 * Save location to cache
 */
export function setCachedLocation(loc) {
  try {
    if (loc && Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)) {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          latitude: loc.latitude,
          longitude: loc.longitude,
          city: loc.city || '',
          source: loc.source || 'gps',
          timestamp: Date.now(),
        })
      );
    }
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fallback to IP-based location (Free & reliable without API keys)
 */
export async function getIPLocation() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('https://ipwho.is/', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('IP service returned status ' + res.status);
    const data = await res.json();

    if (data && data.success && Number.isFinite(data.latitude) && Number.isFinite(data.longitude)) {
      const loc = {
        latitude: data.latitude,
        longitude: data.longitude,
        city: data.city || data.region || data.country || '',
        country: data.country || '',
        source: 'ip',
      };
      setCachedLocation(loc);
      return loc;
    }
    throw new Error(data?.message || 'Could not determine location from IP');
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Helper to wrap navigator.geolocation.getCurrentPosition with timeout and retries
 */
function getBrowserPosition(enableHighAccuracy, timeoutMs) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported by browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (err) => reject(err),
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: enableHighAccuracy ? 30000 : 300000,
      }
    );
  });
}

/**
 * Get device location with robust native Capacitor support and fallback mechanisms
 */
export async function getUserLocation(options = {}) {
  const { allowIPFallback = true } = options;
  const isNative = Capacitor.isNativePlatform();

  // 1. Try Native Capacitor Geolocation
  if (isNative) {
    try {
      // Check and request permissions first
      let perm = await Geolocation.checkPermissions();
      if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
        perm = await Geolocation.requestPermissions();
      }

      if (perm.location === 'denied' && perm.coarseLocation === 'denied') {
        const error = new Error('Location permission denied by user');
        error.code = 'PERMISSION_DENIED';
        throw error;
      }

      // First attempt with high accuracy (GPS)
      try {
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 8000,
          maximumAge: 30000,
        });
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'native-gps',
        };
        setCachedLocation(loc);
        return loc;
      } catch (gpsError) {
        // High accuracy timed out or failed (e.g. indoors) — try low accuracy (Cell/Wi-Fi)
        console.warn('Native GPS timeout, trying low accuracy...', gpsError);
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 120000,
        });
        const loc = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: 'native-network',
        };
        setCachedLocation(loc);
        return loc;
      }
    } catch (err) {
      console.warn('Native geolocation failed:', err);
      if (err.code === 'PERMISSION_DENIED') {
        throw err;
      }
      // If native location failed for other reasons, proceed to fallbacks below
    }
  } else {
    // 2. Web browser navigator.geolocation
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      try {
        const coords = await getBrowserPosition(true, 8000);
        const loc = {
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          source: 'browser-gps',
        };
        setCachedLocation(loc);
        return loc;
      } catch (gpsErr) {
        if (gpsErr.code === 1) { // PERMISSION_DENIED
          const error = new Error('Permission denied');
          error.code = 'PERMISSION_DENIED';
          throw error;
        }
        // Try low accuracy
        try {
          const coords = await getBrowserPosition(false, 8000);
          const loc = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            source: 'browser-network',
          };
          setCachedLocation(loc);
          return loc;
        } catch {
          // Continue to fallback
        }
      }
    }
  }

  // 3. Fallback: IP-based location
  if (allowIPFallback) {
    try {
      const ipLoc = await getIPLocation();
      return ipLoc;
    } catch (ipErr) {
      console.warn('IP location fallback failed:', ipErr);
    }
  }

  // 4. Fallback: Cached location
  const cached = getCachedLocation();
  if (cached) {
    return { ...cached, source: 'cache' };
  }

  const finalError = new Error('Could not determine location from GPS or network.');
  finalError.code = 'POSITION_UNAVAILABLE';
  throw finalError;
}

/**
 * Watch user location updates
 */
export async function watchUserLocation(onSuccess, onError) {
  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    try {
      const watchId = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
        (position, err) => {
          if (err) {
            onError?.(err);
          } else if (position?.coords) {
            setCachedLocation(position.coords);
            onSuccess(position.coords);
          }
        }
      );
      return () => {
        try {
          Geolocation.clearWatch({ id: watchId });
        } catch (e) {
          console.warn('Failed to clear native watch', e);
        }
      };
    } catch (err) {
      onError?.(err);
      return () => {};
    }
  }

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCachedLocation(pos.coords);
        onSuccess(pos.coords);
      },
      onError,
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
    return () => {
      try {
        navigator.geolocation.clearWatch(watchId);
      } catch (e) {
        console.warn('Failed to clear browser watch', e);
      }
    };
  }

  return () => {};
}
