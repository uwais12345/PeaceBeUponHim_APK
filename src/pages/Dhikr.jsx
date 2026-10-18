import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Plus, Loader2 } from 'lucide-react';
import { fetchDhikrData, getDhikrBySession } from '../services/dhikr';
import { useLang } from '../context/AppContext';
import PageHero from '../components/PageHero';
import dhikrBanner from '../assets/dhikr-banner.svg';
import FriendlyError from '../components/ui/FriendlyError';
import { parseError } from '../utils/errorHandling';
import BackButton from '../components/ui/BackButton';
import './Dhikr.css';

export default function Dhikr() {
  const [session, setSession] = useState('after-prayer');
  const [dhikrs, setDhikrs] = useState([]);
  const [counts, setCounts] = useState({});
  const { t } = useLang();

  const [allDhikrs, setAllDhikrs] = useState(() => {
    try {
      return (fetchDhikrData && typeof fetchDhikrData === 'function') ? [] : [];
    } catch { return []; }
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load local storage counts
    try {
      const stored = JSON.parse(localStorage.getItem('dhikr_counts') || '{}');
      setCounts(stored);
    } catch { /* ignore */ }

    async function loadData() {
      if (allDhikrs.length === 0) setLoading(true);
      setError(null);
      try {
        const data = await fetchDhikrData();
        setAllDhikrs(data.dhikrList || []);
        setSessions(data.sessions || []);
      } catch (err) {
        setError(parseError(err, 'Dhikr'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (allDhikrs.length > 0) {
      setDhikrs(getDhikrBySession(allDhikrs, session));
    }
  }, [session, allDhikrs]);

  const updateCount = (id, increment) => {
    setCounts(prev => {
      const current = prev[id] || 0;
      const target = dhikrs.find(d => d.id === id)?.target || 0;
      
      let next = current;
      if (increment) {
        next = current < target ? current + 1 : current;
      } else {
        next = 0;
      }

      const updated = { ...prev, [id]: next };
      localStorage.setItem('dhikr_counts', JSON.stringify(updated));
      return updated;
    });
  };

  const resetAll = () => {
    const updated = { ...counts };
    dhikrs.forEach(d => { updated[d.id] = 0; });
    setCounts(updated);
    localStorage.setItem('dhikr_counts', JSON.stringify(updated));
  };

  const totalCompleted = dhikrs.filter(d => (counts[d.id] || 0) >= d.target).length;
  const isAllCompleted = dhikrs.length > 0 && totalCompleted === dhikrs.length;

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="app-top-nav">
          <BackButton fallback="/" label={t('back')} />
        </div>
        <PageHero
          image={dhikrBanner}
          title={t('dhikrCounter')}
          description={t('dhikrDesc')}
          className="dhikr-page-hero"
        />
        <div className="dhikr-hero-actions">
          <Link to="/after-salah" className="btn btn-primary dhikr-hero-action">
            {t('afterSalahDhikr')}
          </Link>
        </div>

        {loading ? (
          <div className="loader-container">
            <Loader2 className="spinner" size={32} />
            <p>{t('loadingDhikr')}</p>
          </div>
        ) : error ? (
          <div style={{ marginBottom: '2rem' }}>
            <FriendlyError 
              title={error.title} 
              message={error.message} 
              icon={error.icon} 
              onRetry={() => window.location.reload()} 
            />
          </div>
        ) : (
          <>
            {/* Sessions toggle */}
            <div className="dhikr-sessions">
              {sessions.map(s => (
                <button
                  key={s.id}
                  className={`dhikr-session-btn${session === s.id ? ' active' : ''}`}
                  onClick={() => setSession(s.id)}
                >
                  <span className="ds-name">{s.name}</span>
                  {s.tamil && <span className="ds-tamil tamil-text">{s.tamil}</span>}
                </button>
              ))}
            </div>

            <div className="dhikr-progress-bar">
              <div className="dhikr-progress-text">
                <span>{t('sessionProgress')}</span>
                <span>{totalCompleted} / {dhikrs.length} {t('completed')}</span>
              </div>
              <div className="dhikr-progress-track">
                <div 
                  className="dhikr-progress-fill" 
                  style={{ width: `${dhikrs.length ? (totalCompleted / dhikrs.length) * 100 : 0}%` }}
                />
              </div>
              {isAllCompleted && <p className="dhikr-completed-msg">{t('mashallah')}</p>}
              <button className="btn btn-ghost btn-sm" onClick={resetAll} style={{ marginTop: '1rem' }}>
                <RotateCcw size={14} /> {t('resetSession')}
              </button>
            </div>

            {/* Dhikr items */}
            <div className="dhikr-list">
              {dhikrs.map(dhikr => {
                const current = counts[dhikr.id] || 0;
                const isDone = current >= dhikr.target;
                
                return (
                  <div key={dhikr.id} className={`dhikr-item card${isDone ? ' done' : ''}`}>
                    <div className="dhikr-item-content">
                      <p className="dhikr-arabic arabic-text arabic-lg notranslate" dir="rtl" translate="no">{dhikr.arabic}</p>
                      <p className="dhikr-translit">{dhikr.transliteration}</p>
                      <p className="dhikr-tamil tamil-text">{dhikr.meaning_tamil}</p>
                      {dhikr.note && <p className="dhikr-note">{dhikr.note}</p>}
                    </div>

                    <div className="dhikr-counter-area">
                      <div className="dhikr-count-display">
                        <span className="current-count">{current}</span>
                        <span className="target-count">/ {dhikr.target}</span>
                      </div>
                      
                      <div className="dhikr-controls">
                        <button 
                          className={`dhikr-tap-btn${isDone ? ' done' : ''}`}
                          onClick={() => updateCount(dhikr.id, true)}
                          disabled={isDone}
                          aria-label={t('completed')}
                        >
                          {isDone ? t('completed') : <Plus size={32} />}
                        </button>
                        <button 
                          className="dhikr-reset-btn" 
                          onClick={() => updateCount(dhikr.id, false)}
                          aria-label={t('resetSession')}
                        >
                          <RotateCcw size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
