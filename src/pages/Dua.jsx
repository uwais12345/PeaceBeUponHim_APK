import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Bookmark, Loader2, Heart, X } from 'lucide-react';
import { fetchDuasData, searchDuas } from '../services/dua';
import { useBookmarks, useLang } from '../context/AppContext';
import FriendlyError from '../components/ui/FriendlyError';
import { parseError } from '../utils/errorHandling';
import BackButton from '../components/ui/BackButton';
import './Settings.css';
import './Dua.css';

export default function Dua() {
  const [searchParams, setSearchParams] = useSearchParams();
  const catParam = searchParams.get('category') || 'all';
  const queryParam = searchParams.get('q') || '';

  const [query, setQuery] = useState(queryParam);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { t, lang } = useLang();

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
  }, []);

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
    <main className="page-wrapper settings-page dua-page" id="main-content">
      <div className="settings-shell">
        {/* Top Navigation */}
        <div className="settings-top-nav">
          <BackButton fallback="/" label={t('back')} />
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">{t('duaLibrary')}</h1>

        {/* ── iOS-Style Search Bar ── */}
        <form onSubmit={handleSearch} className="dua-ios-search-form" role="search">
          <div className="dua-ios-search-field">
            <Search size={17} className="dua-ios-search-icon" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('duaSearch')}
              className="dua-ios-search-input"
              aria-label="Search duas"
            />
            {query && (
              <button
                type="button"
                className="dua-ios-clear-btn"
                onClick={() => {
                  setQuery('');
                  setSearchParams(prev => {
                    prev.delete('q');
                    return prev;
                  });
                }}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </form>

        {/* ── Category Filter Pills Bar ── */}
        <div className="dua-pill-scroll" role="tablist" aria-label="Dua categories">
          <button
            type="button"
            role="tab"
            aria-selected={catParam === 'all'}
            className={`dua-filter-pill${catParam === 'all' ? ' is-active' : ''}`}
            onClick={() => setCategory('all')}
          >
            {t('all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={catParam === cat.id}
              className={`dua-filter-pill${catParam === cat.id ? ' is-active' : ''}`}
              onClick={() => setCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* ── Dua Content List ── */}
        {loading ? (
          <div className="dua-loading-box">
            <Loader2 className="spinner" size={28} />
            <span className="settings-row-subtext">{t('loadingDuas')}</span>
          </div>
        ) : error ? (
          <div style={{ margin: '1rem 0 2rem' }}>
            <FriendlyError
              title={error.title}
              message={error.message}
              icon={error.icon}
              onRetry={() => window.location.reload()}
            />
          </div>
        ) : (
          <div className="dua-items-wrap">
            {filteredDuas.length === 0 ? (
              <div className="settings-card-group dua-empty-card">
                <Heart size={36} className="dua-empty-icon" aria-hidden="true" />
                <h3 className="dua-empty-title">{t('noDuasFound')}</h3>
                <p className="settings-row-subtext">{t('noDuasDesc')}</p>
              </div>
            ) : (
              filteredDuas.map(dua => {
                const bk = isBookmarked('dua', dua.id);
                const repeatCount = dua.repeat ?? dua.count;

                return (
                  <article key={dua.id} className="settings-group-wrap" id={`dua-${dua.id}`}>
                    <div className="settings-card-group dua-card-inset">
                      {/* 1. Header Row (Title & Bookmark Action) */}
                      <div className="dua-card-header-row">
                        <div className="dua-card-title-group">
                          <h2 className="dua-card-title">{dua.title}</h2>
                          {dua.tamil && <span className="dua-card-tamil-title tamil-text">{dua.tamil}</span>}
                        </div>
                        <div className="dua-card-header-actions">
                          {repeatCount > 1 && (
                            <span className="dua-repeat-pill">
                              {repeatCount}x
                            </span>
                          )}
                          <button
                            type="button"
                            className={`dua-bookmark-btn${bk ? ' is-bookmarked' : ''}`}
                            onClick={() => toggleBookmark({
                              type: 'dua',
                              id: dua.id,
                              title: dua.title,
                              subtitle: dua.meaning_tamil,
                              href: `/dua?category=${dua.category}#${dua.id}`
                            })}
                            aria-label={t('bookmark')}
                          >
                            <Bookmark size={18} fill={bk ? 'currentColor' : 'none'} strokeWidth={2.2} />
                          </button>
                        </div>
                      </div>

                      {/* 2. Arabic Scripture Container */}
                      <div className="dua-arabic-block">
                        <p className="dua-arabic-text arabic-text notranslate" dir="rtl" translate="no">
                          {dua.arabic}
                        </p>
                      </div>

                      {/* 3. Transliteration (Pronunciation Guide) */}
                      {dua.transliteration && (
                        <div className="dua-section-divider">
                          <div className="dua-info-section translit">
                            <span className="dua-label-muted">{t('transliteration')}</span>
                            <p className="dua-text-translit">{dua.transliteration}</p>
                          </div>
                        </div>
                      )}

                      {/* 4. Meanings (Tamil & English) */}
                      {(dua.meaning_tamil || dua.meaning_english) && (
                        <div className="dua-section-divider">
                          <div className="dua-meanings-grid">
                            {dua.meaning_tamil && (
                              <div className="dua-info-section">
                                <span className="dua-label-muted">{lang === 'ta' ? 'பொருள்' : 'Tamil'}</span>
                                <p className="dua-text-body tamil-text">{dua.meaning_tamil}</p>
                              </div>
                            )}
                            {dua.meaning_english && (
                              <div className="dua-info-section">
                                <span className="dua-label-muted">{t('meaning')}</span>
                                <p className="dua-text-body">{dua.meaning_english}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 5. Notes / Benefit Callout */}
                      {(dua.note || dua.notes) && (
                        <div className="dua-card-note-box">
                          <span className="dua-note-badge">{t('note')}</span>
                          <span className="dua-note-content">{dua.note || dua.notes}</span>
                        </div>
                      )}

                      {/* 6. Card Footer (Reference & Grade) */}
                      <div className="dua-card-footer-row">
                        <span className="dua-reference-text">{dua.source || dua.reference}</span>
                        {dua.grade && (
                          <span className={`dua-grade-tag ${dua.grade.toLowerCase() === 'sahih' ? 'sahih' : 'normal'}`}>
                            {dua.grade}
                          </span>
                        )}
                      </div>
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
