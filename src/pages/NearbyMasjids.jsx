import { useCallback, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import masjidBanner from '../assets/masjid-banner.svg';
import LocationPermission from '../components/masjid/LocationPermission';
import MasjidList from '../components/masjid/MasjidList';
import {
  findNearbyMasjids,
  findPlaceCoordinates,
  getGoogleMapsSearchUrl,
} from '../services/masjidService';
import { getUserLocation } from '../services/locationService';
import './NearbyMasjids.css';

const MAX_LOCATION_ACCURACY_METERS = 2000;
const SEARCH_RADIUS_KM = 6;

export default function NearbyMasjids() {
  const searchSequence = useRef(0);
  const [location, setLocation] = useState(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [masjids, setMasjids] = useState([]);
  const [requestingLocation, setRequestingLocation] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  const searchNearby = useCallback(async (coordinates, forceRefresh = false, label = '') => {
    const sequence = ++searchSequence.current;
    setLocation(coordinates);
    setLocationLabel(label);
    setMasjids([]);
    setSearchError('');
    setLoading(true);
    try {
      const results = await findNearbyMasjids(coordinates, {
        radiusKm: SEARCH_RADIUS_KM,
        forceRefresh,
      });
      if (sequence === searchSequence.current) setMasjids(results);
    } catch (error) {
      if (sequence === searchSequence.current) {
        setSearchError(error.message || 'Unable to search for nearby Masjids. Please try again.');
      }
    } finally {
      if (sequence === searchSequence.current) setLoading(false);
    }
  }, []);

  const requestLocation = async () => {
    searchSequence.current += 1;
    const sequence = searchSequence.current;
    setLocation(null);
    setLocationLabel('');
    setMasjids([]);
    setSearchError('');
    setLoading(false);
    setRequestingLocation(true);
    setLocationError('');
    setPermissionDenied(false);

    try {
      const loc = await getUserLocation({ allowIPFallback: true });
      if (sequence !== searchSequence.current) return;
      setRequestingLocation(false);

      // For IP-based locations the accuracy field may be undefined — allow it through
      const accuracyMeters = loc.accuracy;
      const acceptedAccuracyMeters = Math.min(SEARCH_RADIUS_KM * 1000, MAX_LOCATION_ACCURACY_METERS);
      if (loc.source !== 'ip' && Number.isFinite(accuracyMeters) && accuracyMeters > acceptedAccuracyMeters) {
        const approximateAccuracy = ` (about ${Math.round(accuracyMeters / 1000)} km accuracy)`;
        setLocationError(
          `Your device only provided an approximate location${approximateAccuracy}. Enable precise location or search by town or area below.`,
        );
        return;
      }

      searchNearby({ latitude: loc.latitude, longitude: loc.longitude }, false, loc.city || '');
    } catch (err) {
      if (sequence !== searchSequence.current) return;
      setRequestingLocation(false);
      console.error('NearbyMasjids location error:', err);
      if (err.code === 'PERMISSION_DENIED') {
        setPermissionDenied(true);
        setLocationError('');
      } else {
        setLocationError('We could not get your location. Please try again or search by town or area below.');
      }
    }
  };

  const requestPlaceSearch = async query => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;

    const sequence = ++searchSequence.current;
    setLocation(null);
    setLocationLabel('');
    setMasjids([]);
    setSearchError('');
    setLocationError('');
    setPermissionDenied(false);
    setLoading(true);
    try {
      const place = await findPlaceCoordinates(normalizedQuery);
      if (sequence === searchSequence.current) {
        await searchNearby(place.coordinates, false, place.label);
      }
    } catch (error) {
      if (sequence === searchSequence.current) {
        setSearchError(error.message || 'Unable to find that location. Please try another town or area.');
        setLoading(false);
      }
    }
  };

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container nearby-masjids-container">
        <section className="nearby-hero" aria-labelledby="nearby-page-title">
          <img src={masjidBanner} alt="" className="nearby-hero-image" />
          <div className="nearby-hero-shade" />
          <div className="nearby-hero-copy">
            <h1 id="nearby-page-title">Nearby Masjids</h1>
            <p>Find a place of prayer near you.</p>
          </div>
        </section>

        <LocationPermission
          onRequestLocation={requestLocation}
          requesting={requestingLocation}
          denied={permissionDenied}
          error={locationError}
          hasLocation={Boolean(location)}
          searching={loading}
          locationLabel={locationLabel}
          onPlaceSearch={requestPlaceSearch}
        />

        <section className="nearby-results" aria-label="Masjid search results">
          <div className="nearby-results-heading">
            <h2>Masjids near you</h2>
            <div className="nearby-results-meta">
              {!loading && !searchError && masjids.length > 0 && (
                <span>{masjids.length} found within {SEARCH_RADIUS_KM} km</span>
              )}
              {location && (
                <a
                  className="nearby-google-maps-link"
                  href={getGoogleMapsSearchUrl(location)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Search in Google Maps</span>
                  <ExternalLink size={13} aria-hidden="true" />
                </a>
              )}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
              >
                © OpenStreetMap contributors
              </a>
            </div>
          </div>
          <MasjidList
            masjids={masjids}
            origin={location}
            radiusKm={SEARCH_RADIUS_KM}
            loading={loading}
            error={searchError}
            searched={Boolean(location)}
            onRetry={() => location && searchNearby(location, true, locationLabel)}
          />
        </section>
      </div>
    </main>
  );
}
