import { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, MapPin } from 'lucide-react';
import FriendlyError from '../ui/FriendlyError';
import { parseError } from '../../utils/errorHandling';
import masjidBg from '../../assets/masjid-banner.svg';
import './PrayerTimes.css';

const DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
  'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai',
  'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni',
  'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupattur', 'Tiruppur', 'Tiruvallur',
  'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'
];

const PRAYERS = [
  { name: 'FAJR',    arabic: 'الفجر',  key: 'Fajr'    },
  { name: 'SUNRISE', arabic: 'الشروق', key: 'Sunrise'  },
  { name: 'DHUHR',   arabic: 'الظهر',  key: 'Dhuhr'   },
  { name: 'ASR',     arabic: 'العصر',  key: 'Asr'     },
  { name: 'MAGHRIB', arabic: 'المغرب', key: 'Maghrib'  },
  { name: 'ISHA',    arabic: 'العشاء', key: 'Isha'    },
];  

function formatTime(time24) {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  let h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

/** Returns index of the current/upcoming prayer (the one after last passed) */
function getActivePrayerIndex(timings) {
  if (!timings) return -1;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // Build array of [prayerIndex, totalMinutes]
  const times = PRAYERS.map((p, i) => {
    const t = timings[p.key];
    if (!t) return [i, 9999];
    const [h, m] = t.split(':').map(Number);
    return [i, h * 60 + m];
  });

  // Find last prayer whose time has passed
  let activeIdx = 0;
  for (let i = 0; i < times.length; i++) {
    if (times[i][1] <= nowMins) activeIdx = i;
  }
  return activeIdx;
}

export default function PrayerTimes() {
  const [district, setDistrict] = useState(
    () => localStorage.getItem('prayer-district') || 'Chennai'
  );
  const [timings, setTimings] = useState(() => {
    try {
      const savedDistrict = localStorage.getItem('prayer-district') || 'Chennai';
      const cached = localStorage.getItem(`prayer-timings-${savedDistrict}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      const savedDistrict = localStorage.getItem('prayer-district') || 'Chennai';
      return !localStorage.getItem(`prayer-timings-${savedDistrict}`);
    } catch {
      return true;
    }
  });
  const [error, setError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Stable ref so fetchPrayerTimes doesn't need `timings` in its deps
  const timingsRef = useRef(timings);
  useEffect(() => { timingsRef.current = timings; }, [timings]);

  // Stable fetch — only re-created when `district` changes, not when timings change
  const fetchPrayerTimes = useCallback(async (isRetry = false) => {
    if (!timingsRef.current) setLoading(true);
    if (!isRetry) setError(null);
    try {
      const res = await fetch(
        `https://api.aladhan.com/v1/timingsByCity?city=${district}&country=India&method=1`
      );
      if (!res.ok) throw new Error('Failed to fetch prayer times');
      const data = await res.json();
      if (data?.data?.timings) {
        setTimings(data.data.timings);
        setError(null);
        localStorage.setItem('prayer-district', district);
        try {
          localStorage.setItem(`prayer-timings-${district}`, JSON.stringify(data.data.timings));
        } catch {
          // ignore quota
        }
      }
    } catch (err) {
      if (!timingsRef.current) {
        setError(parseError(err, 'prayer times'));
      }
    } finally {
      setLoading(false);
    }
  }, [district]); // Only district — timings accessed via ref

  useEffect(() => {
    fetchPrayerTimes();
  }, [fetchPrayerTimes]);

  useEffect(() => {
    const closeDropdown = (e) => {
      if (!e.target.closest('.prayer-custom-select-container')) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, [dropdownOpen]);

  const activeIdx = getActivePrayerIndex(timings);

  return (
    <div className="prayer-times-widget">
      <img src={masjidBg} alt="" className="prayer-bg-img" aria-hidden="true" />
      {/* Header */}
      <div className="prayer-header">
        <div className="prayer-title-wrap">
          <Clock size={18} className="prayer-icon" />
          <h2 className="prayer-title">Prayer Times</h2>
        </div>

        {/* Location pill dropdown */}
        <div className="prayer-custom-select-container">
          <button
            className={`prayer-selector${dropdownOpen ? ' active' : ''}`}
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-label="Select District"
            aria-haspopup="listbox"
            aria-expanded={dropdownOpen}
          >
            <MapPin size={13} className="prayer-location-icon" />
            <span className="prayer-select-text">{district}, TN</span>
            <svg
              width="10" height="10" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: 0.6, transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {dropdownOpen && (
            <ul className="prayer-dropdown-list" role="listbox">
              {DISTRICTS.map(d => (
                <li
                  key={d}
                  role="option"
                  aria-selected={district === d}
                  className={`prayer-dropdown-item${district === d ? ' selected' : ''}`}
                  onClick={() => { setDistrict(d); setDropdownOpen(false); }}
                >
                  {d}, TN
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Reserve the timetable layout while data is loading to prevent layout shift. */}
      {loading && !error ? (
        <div className="prayer-grid" aria-busy="true" aria-label="Loading prayer times">
          {PRAYERS.map((prayer) => (
            <div key={prayer.key} className="prayer-card prayer-card-loading" aria-hidden="true">
              <span className="prayer-skeleton prayer-skeleton-label" />
              <span className="prayer-skeleton prayer-skeleton-time" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '0 16px 16px' }}>
          <FriendlyError 
            title={error.title} 
            message={error.message} 
            icon={error.icon} 
            onRetry={() => fetchPrayerTimes(true)} 
            isRetrying={loading}
          />
        </div>
      ) : (
        <div className="prayer-grid">
          {PRAYERS.map((prayer, i) => (
            <div
              key={prayer.key}
              className={`prayer-card${i === activeIdx ? ' prayer-card-active' : ''}`}
            >
              {/* Pulse dot on active prayer */}
              {i === activeIdx && <span className="prayer-active-dot" aria-hidden="true" />}

              <div className="prayer-name-row">
                <span className="prayer-name">{prayer.name}</span>
                <span className="prayer-arabic arabic-text" dir="rtl" translate="no">
                  {prayer.arabic}
                </span>
              </div>
              <span className="prayer-time">{formatTime(timings[prayer.key])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
