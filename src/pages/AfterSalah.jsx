import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Bookmark, Loader2 } from 'lucide-react';
import { fetchAfterSalahData } from '../services/after-salah';
import { useBookmarks } from '../context/AppContext';
import { useState, useEffect } from 'react';
import { useAppBack } from '../hooks/useAppNavigation';
import '../styles/global.css';
import FriendlyError from '../components/ui/FriendlyError';
import { parseError } from '../utils/errorHandling';

export default function AfterSalah() {
  const handleBack = useAppBack('/dhikr');
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const [completed, setCompleted] = useState({});
  const [dhikrList, setDhikrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchAfterSalahData();
        setDhikrList(data);
      } catch (err) {
        setError(parseError(err, 'After Salah Duas'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleCompleted = (id) => {
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        <button type="button" onClick={handleBack} className="back-link">
          <ArrowLeft size={16} /> திக்ர் (Dhikr)
        </button>
        
        <div className="page-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}></div>
          <h1 className="page-title">After Salah</h1>
          <p className="page-description tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>
            தொழுகைக்குப் பிறகு ஓத வேண்டிய ஆதாரப்பூர்வமான திக்ர்கள் மற்றும் துஆக்கள்
          </p>
        </div>

        {loading ? (
          <div className="loader-container">
            <Loader2 className="spinner" size={32} />
            <p>Loading dhikr...</p>
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
          <div className="after-salah-list" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {dhikrList.map((item, index) => {
              const isDone = completed[item.id];
              
              return (
                <div 
                  key={item.id} 
                  className={`card ${isDone ? 'completed' : ''}`}
                  style={{ 
                    marginBottom: '1rem',
                    borderLeft: isDone ? '4px solid var(--primary)' : '4px solid transparent',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ 
                        background: 'var(--bg-secondary)', 
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: 'var(--text-secondary)'
                      }}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{item.title}</h3>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{ 
                        background: 'var(--primary-light)', 
                        color: 'var(--primary)',
                        padding: '0.25rem 0.75rem', 
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: '600'
                      }}>
                        × {item.count}
                      </span>
                      <button 
                        onClick={() => toggleCompleted(item.id)}
                        className="btn-icon" 
                        style={{ color: isDone ? 'var(--primary)' : 'var(--text-secondary)' }}
                        title="Mark as done"
                      >
                        <CheckCircle2 size={20} fill={isDone ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>

                  <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                    <p className="arabic-text notranslate" dir="rtl" translate="no" style={{ fontSize: '1.5rem', lineHeight: '2', marginBottom: '1rem' }}>
                      {item.arabic}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                      {item.transliteration}
                    </p>
                    <p className="tamil-text" style={{ fontFamily: 'var(--font-tamil)', lineHeight: '1.6' }}>
                      {item.tamil}
                    </p>
                    {item.note && (
                      <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {item.note}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    <span> {item.reference}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
