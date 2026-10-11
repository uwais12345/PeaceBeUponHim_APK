import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Bookmark, Copy, Share2, Filter, Heart, Loader2 } from 'lucide-react';
import { fetchDuasData, searchDuas } from '../services/dua';
import { useBookmarks } from '../context/AppContext';
import PageHero from '../components/PageHero';
import FriendlyError from '../components/ui/FriendlyError';
import { parseError } from '../utils/errorHandling';
import duaBanner from '../assets/dua-banner.svg';
import './Dua.css';

export default function Dua() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get('category') || 'all';
  const queryParam = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(queryParam);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const [duas, setDuas] = useState(() => {
    try {
      const persisted = localStorage.getItem('pbuh_duas_cache');
      return persisted ? JSON.parse(persisted).duas || [] : [];
    } catch {
      return [];
    }
  });
  const [categories, setCategories] = useState(() => {
    try {
      const persisted = localStorage.getItem('pbuh_duas_cache');
      return persisted ? JSON.parse(persisted).categories || [] : [];
    } catch {
      return [];
    }
  });
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem('pbuh_duas_cache');
    } catch {
      return true;
    }
  });
  const [error, setError] = useState(null);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    async function loadData() {
      if (!duas.length) setLoading(true);
      setError(null);
      try {
        const data = await fetchDuasData();
        setDuas(data.duas || []);
        setCategories(data.categories || []);
        hasFetched.current = true;
      } catch (err) {
        if (!duas.length) setError(parseError(err, 'Duas'));
      } finally {
        setLoading(false);
      }
    }
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once — data is from bundled static asset, no need to re-fetch

  // Filter logic
  const filteredDuas = useMemo(() => {
    let result = duas;
    if (query) {
      result = searchDuas(duas, query);
    }
    if (catParam !== 'all') {
      result = result.filter(d => d.category === catParam);
    }
    return result;
  }, [query, catParam, duas]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams(prev => {
      if (query) prev.set('q', query);
      else prev.delete('q');
      return prev;
    });
  };

  const setCategory = (catId) => {
    setSearchParams(prev => {
      if (catId === 'all') prev.delete('category');
      else prev.set('category', catId);
      return prev;
    });
  };

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        <PageHero
          image={duaBanner}
          title="Dua Library"
          description="அன்றாட வாழ்க்கைக்கு தேவையான துஆக்கள்"
          className="dua-page-hero"
        />

        {/* Categories Bar */}
        <div className="dua-categories-wrapper">
          <div className="dua-categories">
            <button
              className={`dua-cat-btn${catParam === 'all' ? ' active' : ''}`}
              onClick={() => setCategory('all')}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`dua-cat-btn${catParam === cat.id ? ' active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="dua-search-bar">
          <Search size={16} className="dua-search-icon" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search duas by title, meaning, or topic..."
            className="dua-search-input"
          />
          <button type="submit" className="btn btn-primary btn-sm">Search</button>
        </form>

        {loading ? (
          <div className="loader-container">
            <Loader2 className="spinner" size={32} />
            <p>Loading duas...</p>
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
          <div className="dua-list">
            {filteredDuas.length === 0 ? (
              <div className="empty-state">
                <Heart size={40} className="empty-state-icon" />
                <p className="empty-state-title">No duas found</p>
                <p className="empty-state-desc">Try searching with different words or categories.</p>
              </div>
            ) : (
              filteredDuas.map(dua => {
                const bk = isBookmarked('dua', dua.id);
                return (
                  <article key={dua.id} className="dua-card card">
                    <div className="dua-card-header">
                      <div className="dua-title-wrap">
                        <h2 className="dua-title">{dua.title}</h2>
                        <span className="dua-tamil-title tamil-text">{dua.tamil}</span>
                      </div>
                      <div className="dua-actions">
                        <button
                          className={`btn-icon${bk ? ' active' : ''}`}
                          onClick={() => toggleBookmark({
                            type: 'dua',
                            id: dua.id,
                            title: dua.title,
                            subtitle: dua.meaning_tamil,
                            href: `/dua?category=${dua.category}#${dua.id}`
                          })}
                        >
                          <Bookmark size={16} fill={bk ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>

                    <p className="dua-arabic arabic-text arabic-md notranslate" dir="rtl" translate="no">{dua.arabic}</p>
                    
                    {dua.transliteration && (
                      <div className="dua-translit">
                        <span className="trans-label">Transliteration</span>
                        <p>{dua.transliteration}</p>
                      </div>
                    )}

                    <div className="dua-meanings">
                      <div className="dua-meaning-tamil">
                        <span className="trans-label">பொருள்</span>
                        <p className="tamil-text">{dua.meaning_tamil}</p>
                      </div>
                      <div className="dua-meaning-english">
                        <span className="trans-label">Meaning</span>
                        <p>{dua.meaning_english}</p>
                      </div>
                    </div>

                    {(dua.note || dua.notes) && (
                      <div className="dua-note">
                        <strong>Note:</strong> {dua.note || dua.notes}
                      </div>
                    )}

                    <div className="dua-footer">
                      <span className="dua-ref">{dua.source || dua.reference}</span>
                      {dua.grade && (
                        <span className={`badge ${dua.grade.toLowerCase() === 'sahih' ? 'badge-sahih' : 'badge-unknown'}`}>
                          {dua.grade}
                        </span>
                      )}
                      {(dua.repeat ?? dua.count) > 1 && (
                        <span className="badge badge-primary">Repeat: {dua.repeat ?? dua.count}x</span>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
