import { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ArrowLeft, Bookmark, Share2, Copy, ChevronRight, BookOpen, AlertCircle } from 'lucide-react';
import { COLLECTIONS, HADITH_CATEGORIES, GRADES, COLLECTION_BOOKS, getCollection, getHadiths, getHadithsByBook, getHadith } from '../services/hadith';
import { useBookmarks } from '../context/AppContext';
import PageHero from '../components/PageHero';
import FriendlyError from '../components/ui/FriendlyError';
import { parseError } from '../utils/errorHandling';
import hadithBanner from '../assets/hadith-banner.svg';
import './Hadith.css';

//  Grade badge 
function GradeBadge({ grade }) {
  const g = grade?.toLowerCase();
  const cfg = GRADES[g] || GRADES.unknown;
  return <span className={`badge ${cfg.badge}`}>{cfg.label}</span>;
}

//  Collection list 
function CollectionList() {
  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        <PageHero
          image={hadithBanner}
          title="ஹதீஸ் தொகுப்புகள்"
          description="நம்பகமான ஹதீஸ் சேகரிப்புகள் — குத்துப் அஸ்-ஸித்தா"
          className="hadith-page-hero"
        />

        {/* Collections grid */}
        <div className="collections-grid">
          {COLLECTIONS.map(col => (
            <Link key={col.id} to={`/hadith/${col.id}`} className="collection-card card card-hover">
              <div className="collection-card-inner">
                <div className="collection-arabic arabic-text notranslate" dir="rtl" translate="no">{col.arabicName}</div>
                <h2 className="collection-name">{col.name}</h2>
                <p className="collection-author">{col.author}</p>
                <p className="collection-desc">{col.description}</p>
                <div className="collection-footer">
                  <GradeBadge grade={col.grade} />
                  <span className="collection-count">{col.total?.toLocaleString()} ஹதீஸ்கள்</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Category browse */}
        <div className="hadith-section-header">
          <h2 className="section-title tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>தலைப்பு வாரியாக படிக்க</h2>
          <p className="section-subtitle tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>எளிதாக கண்டறிய தமிழ் தலைப்புகள்</p>
        </div>
        <div className="categories-grid">
          {HADITH_CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              to={`/hadith/categories/${cat.id}`}
              className="category-card"
              style={{ '--cat-color': cat.color }}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-name">{cat.name}</span>
              <span className="category-tamil tamil-text">{cat.tamil}</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

//  Collection detail 
function CollectionDetail({ collectionId }) {
  const col = getCollection(collectionId);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const books = COLLECTION_BOOKS[collectionId] || [];
  const [activeTab, setActiveTab] = useState(books.length > 0 ? 'books' : 'hadiths'); // 'hadiths' | 'books'
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const copyHadith = (h) => { navigator.clipboard.writeText(`[${h.id}] \n${h.arab}\n\n${h.translation}`); };

  useEffect(() => {
    if (!col) return;
    if (activeTab === 'books') return; // Do not fetch full collection if just viewing books!
    
    setLoading(true);
    getHadiths(collectionId, { page, limit: 20 })
      .then(data => setHadiths(data.hadiths || []))
      .catch(e => setError(parseError(e, 'Hadiths')))
      .finally(() => setLoading(false));
  }, [collectionId, page, col, activeTab]);

  if (!col) return (
    <main className="page-wrapper"><div className="container">
      <div className="empty-state"><p className="empty-state-title">Collection not found</p></div>
    </div></main>
  );

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        <Link to="/hadith" className="back-link"><ArrowLeft size={16} /> Collections</Link>

        <div className="collection-detail-header">
          <div className="coll-detail-arabic arabic-text notranslate" dir="rtl" translate="no">{col.arabicName}</div>
          <h1 className="coll-detail-name">{col.name}</h1>
          <p className="coll-detail-author">{col.author}</p>
          <p className="coll-detail-desc">{col.description}</p>
          <div className="coll-detail-meta">
            <GradeBadge grade={col.grade} />
            <span className="badge badge-unknown">{col.total?.toLocaleString()} ஹதீஸ்கள்</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="hadith-tabs">
          <button
            className={`hadith-tab${activeTab === 'hadiths' ? ' active' : ''}`}
            onClick={() => setActiveTab('hadiths')}
          >ஹதீஸ்கள்</button>
          {books.length > 0 && (
            <button
              className={`hadith-tab${activeTab === 'books' ? ' active' : ''}`}
              onClick={() => setActiveTab('books')}
            >நூல்கள் ({books.length})</button>
          )}
        </div>

        {activeTab === 'books' && books.length > 0 && (
          <div className="books-list">
            {books.map(book => (
              <Link to={`/hadith/${collectionId}/book/${book.number}`} key={book.number} className="book-row card" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="book-number">{book.number}</div>
                <div className="book-info">
                  <div className="book-name">{book.name}</div>
                  <div className="book-arabic arabic-text notranslate" dir="rtl" translate="no">{book.arabicName}</div>
                </div>
                {book.count && <span className="book-count">{book.count} ஹதீஸ்கள்</span>}
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'hadiths' && (
          <>
            {error && (
              <div style={{ marginBottom: '1.5rem' }}>
                <FriendlyError 
                  title={error.title} 
                  message={error.message} 
                  icon={error.icon} 
                  onRetry={() => window.location.reload()} 
                />
              </div>
            )}

            {loading
              ? <div className="hadiths-list">{Array(5).fill(0).map((_, i) => <HadithSkeleton key={i} />)}</div>
              : (
                <div className="hadiths-list">
                  {hadiths.map((hadith, i) => {
                    const bk = isBookmarked('hadith', `${collectionId}-${hadith.number}`);
                    return (
                      <article key={hadith.number || i} className="hadith-card card">
                        <div className="hadith-card-top">
                          <div className="hadith-num-badge">
                            #{hadith.number}
                          </div>
                          <div className="hadith-card-actions">
                            <GradeBadge grade={col.grade === 'Sahih' ? 'sahih' : 'mixed'} />
                            <button
                              className={`btn-icon${bk ? ' active' : ''}`}
                              onClick={() => toggleBookmark({
                                type: 'hadith',
                                id: `${collectionId}-${hadith.number}`,
                                title: `${col.name} #${hadith.number}`,
                                subtitle: hadith.arab?.slice(0, 80),
                                href: `/hadith/${collectionId}/${hadith.number}`,
                              })}
                              aria-label={bk ? 'Remove bookmark' : 'Save hadith'}
                            >
                              <Bookmark size={15} fill={bk ? 'currentColor' : 'none'} />
                            </button>
                          </div>
                        </div>

                        {hadith.arab && (
                          <p className="hadith-arabic arabic-text arabic-md notranslate" dir="rtl" translate="no" lang="ar">
                            {hadith.arab}
                          </p>
                        )}

                        {hadith.translation && (
                          <p className="hadith-translation tamil-text" style={{ marginTop: '1rem', lineHeight: 1.6, fontFamily: 'var(--font-tamil)' }}>
                            {hadith.translation}
                          </p>
                        )}

                        <div className="hadith-ref">
                          <span>{col.name}</span>
                          <span className="dot">·</span>
                          <span>Hadith {hadith.number}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )
            }

            {/* Pagination */}
            {!error && hadiths.length > 0 && (
              <div className="pagination">
                <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹ முந்தையது</button>
                <span className="page-btn active">{page} பக்கம்</span>
                <button className="page-btn" onClick={() => setPage(p => p + 1)}>அடுத்தது ›</button>
              </div>
            )}
          </>
        )}

        <p className="hadith-attribution">
          Hadith data from open Islamic APIs. Source: {col.name} by {col.author}.
          Grade information reflects the collection's overall scholarly consensus.
        </p>
      </div>
    </main>
  );
}

function HadithSkeleton() {
  return (
    <div className="hadith-card card" style={{ opacity: 0.5 }}>
      <div className="skeleton" style={{ height: 14, width: '20%', marginBottom: 12, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 32, marginBottom: 10, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 4 }} />
    </div>
  );
}

//  Category detail 
function CategoryDetail({ categoryId }) {
  const cat = HADITH_CATEGORIES.find(c => c.id === categoryId);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const copyHadith = (h) => { navigator.clipboard.writeText(`[${h.id}] \n${h.arab}\n\n${h.translation}`); };

  useEffect(() => {
    if (!cat) return;
    setLoading(true);
    setError(null);
    // Fetch a large chunk of Bukhari to search through
    getHadiths('bukhari', { page: 1, limit: 2000 })
      .then(data => {
        // Map categories to search keywords for English translation
        const keywords = {
          'iman': ['faith', 'believe in allah'],
          'tawheed': ['worship allah', 'partner', 'alone'],
          'salah': ['prayer', 'pray', 'prostrate', 'rakat'],
          'quran': ['quran', 'recite', 'surah'],
          'youth': ['youth', 'young', 'boy', 'girl', 'children'],
          'parents': ['parents', 'mother', 'father', 'obey'],
          'family': ['family', 'wife', 'husband', 'children'],
          'marriage': ['marry', 'marriage', 'wife'],
          'character': ['character', 'manners', 'polite', 'good'],
          'tawbah': ['repent', 'forgive', 'sin'],
          'sabr': ['patient', 'patience', 'endure'],
          'ramadan': ['ramadan', 'fasting', 'fast'],
          'dua': ['supplicate', 'invoke', 'dua'],
          'rizq': ['provision', 'wealth', 'charity'],
          'akhirah': ['hereafter', 'day of resurrection', 'judgment'],
          'jannah': ['paradise', 'jannah', 'heaven'],
          'charity': ['charity', 'sadaqa', 'wealth'],
          'knowledge': ['knowledge', 'learn', 'scholar'],
          'death': ['death', 'die', 'grave'],
          'fasting': ['fasting', 'fast', 'ramadan'],
          'anger': ['anger', 'angry', 'temper'],
          'brotherhood': ['brother', 'muslim', 'help'],
          'business': ['buy', 'sell', 'business', 'trade'],
          'tawakkul': ['trust in allah', 'rely'],
        }[categoryId] || [cat.name.toLowerCase()];

        const results = (data.hadiths || []).filter(h => {
          const text = h.translation?.toLowerCase() || '';
          const engText = h.engTranslation?.toLowerCase() || '';
          return keywords.some(k => text.includes(k) || engText.includes(k));
        }).slice(0, 15); // Show top 15 matches

        setHadiths(results);
      })
      .catch(e => setError(parseError(e, 'Hadiths')))
      .finally(() => setLoading(false));
  }, [categoryId, cat]);

  if (!cat) return (
    <main className="page-wrapper"><div className="container">
      <div className="empty-state"><p className="empty-state-title">Category not found</p></div>
    </div></main>
  );

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        <Link to="/hadith" className="back-link"><ArrowLeft size={16} /> Hadith</Link>
        <div className="page-header">
          <div>
            <p className="category-page-icon">{cat.icon}</p>
            <h1 className="page-title">{cat.name}</h1>
            <p className="page-description tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>{cat.tamil}</p>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem' }}>
            <FriendlyError 
              title={error.title} 
              message={error.message} 
              icon={error.icon} 
              onRetry={() => window.location.reload()} 
            />
          </div>
        )}

        {loading ? (
          <div className="hadiths-list">{Array(3).fill(0).map((_, i) => <HadithSkeleton key={i} />)}</div>
        ) : !error && hadiths.length > 0 ? (
          <div className="hadiths-list">
            {hadiths.map((hadith, i) => {
              const bk = isBookmarked('hadith', `bukhari-${hadith.number}`);
              return (
                <article key={hadith.number || i} className="hadith-card card">
                  <div className="hadith-card-top">
                    <span className="hadith-num-badge">#{hadith.number}</span>
                    <div className="hadith-card-actions">
                      <GradeBadge grade="sahih" />
                      <button
                        className={`btn-icon${bk ? ' active' : ''}`}
                        onClick={() => toggleBookmark({
                          type: 'hadith',
                          id: `bukhari-${hadith.number}`,
                          title: `Sahih al-Bukhari #${hadith.number}`,
                          subtitle: hadith.arab?.slice(0, 80),
                          href: `/hadith/bukhari/${hadith.number}`,
                        })}
                        aria-label={bk ? 'Remove bookmark' : 'Save hadith'}
                      >
                        <Bookmark size={15} fill={bk ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>

                  {hadith.arab && (
                    <p className="hadith-arabic arabic-text arabic-md notranslate" dir="rtl" translate="no" lang="ar">
                      {hadith.arab}
                    </p>
                  )}

                  {hadith.translation && (
                    <p className="hadith-translation tamil-text" style={{ marginTop: '1rem', lineHeight: 1.6, fontFamily: 'var(--font-tamil)' }}>
                      {hadith.translation}
                    </p>
                  )}

                  <div className="hadith-ref">
                    <span>Sahih al-Bukhari</span>
                    <span className="dot">·</span>
                    <span>Hadith {hadith.number}</span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : !error ? (
          <div className="empty-state">
            <p className="empty-state-title">No specific hadiths found</p>
            <p className="empty-state-desc">Try browsing the main collections instead.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

//  Hadith Search 
function HadithSearch() {
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('bukhari');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);

  const doSearch = useCallback(async () => {
    if (!query.trim() || !collection) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const data = await getHadiths(collection, { page: 1, limit: 50 });
      const q = query.toLowerCase();
      const filtered = (data.hadiths || []).filter(h =>
        h.arab?.toLowerCase().includes(q) ||
        h.id?.toLowerCase().includes(q) ||
        String(h.number) === q ||
        h.translation?.toLowerCase().includes(q) ||
        h.engTranslation?.toLowerCase().includes(q)
      );
      setResults(filtered);
    } catch (e) {
      setResults([]);
      setError(parseError(e, 'Hadiths'));
    } finally {
      setLoading(false);
    }
  }, [query, collection]);

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>ஹதீஸ் தேட</h1>
          <p className="page-description tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>முக்கிய வார்த்தை, ராவி அல்லது ஹதீஸ் எண் மூலம் தேடுங்கள்</p>
        </div>

        <div className="hadith-search-bar">
          <div className="hadith-search-row">
            <select
              value={collection}
              onChange={e => setCollection(e.target.value)}
              className="hadith-collection-select"
              aria-label="Select collection"
            >
              {COLLECTIONS.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search hadiths..."
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              className="hadith-search-input"
              aria-label="Search query"
            />
            <button className="btn btn-primary" onClick={doSearch} disabled={loading}>
              {loading ? 'தேடுகிறது...' : <><Search size={16} /> தேட</>}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <FriendlyError 
              title={error.title} 
              message={error.message} 
              icon={error.icon} 
              onRetry={doSearch} 
            />
          </div>
        )}

        {searched && !loading && !error && (
          <p className="search-result-count">
            {results.length} result{results.length !== 1 ? 's' : ''} in {COLLECTIONS.find(c => c.id === collection)?.name}
          </p>
        )}

        <div className="hadiths-list">
          {results.map((h, i) => (
            <article key={i} className="hadith-card card">
              <div className="hadith-card-top">
                <span className="hadith-num-badge">#{h.number}</span>
                <GradeBadge grade="mixed" />
              </div>
              {h.arab && <p className="hadith-arabic arabic-text arabic-md notranslate" dir="rtl" translate="no">{h.arab}</p>}
              {h.translation && <p className="hadith-translation tamil-text" style={{ marginTop: '0.5rem', lineHeight: 1.5, fontSize: '0.95rem', fontFamily: 'var(--font-tamil)' }}>{h.translation.substring(0, 150)}...</p>}
              <div className="hadith-ref">
                <span>{COLLECTIONS.find(c => c.id === collection)?.name}</span>
                <span className="dot">·</span>
                <span>#{h.number}</span>
              </div>
            </article>
          ))}
        </div>

        {searched && results.length === 0 && !loading && !error && (
          <div className="empty-state">
            <Search size={40} className="empty-state-icon" />
            <p className="empty-state-title tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>முடிவுகள் எதுவும் இல்லை</p>
            <p className="empty-state-desc tamil-text" style={{ fontFamily: 'var(--font-tamil)' }}>வேறு வார்த்தைகளில் தேட முயற்சிக்கவும் அல்லது வேறு தொகுப்பை தேர்வு செய்யவும்</p>
          </div>
        )}
      </div>
    </main>
  );
}

//  Router exports 
export function HadithIndex() { return <CollectionList />; }
export function HadithCollection() {
  const { id } = useParams();
  return <CollectionDetail collectionId={id} />;
}
export function HadithCategoryDetail() {
  const { id } = useParams();
  return <CategoryDetail categoryId={id} />;
}
export function HadithSearchPage() { return <HadithSearch />; }

export function HadithBook() {
  const { id: collectionId, bookId } = useParams();
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookName, setBookName] = useState('');
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const copyHadith = (h) => { navigator.clipboard.writeText(`[${h.id}] \n${h.arab}\n\n${h.translation}`); };

  useEffect(() => {
    setLoading(true);
    getHadithsByBook(collectionId, bookId)
      .then(data => {
        setHadiths(data.hadiths || []);
        setBookName(data.bookName);
        if (data.error) setError(data.error);
      })
      .catch(e => setError(parseError(e, 'Hadiths')))
      .finally(() => setLoading(false));
  }, [collectionId, bookId]);

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        <Link to={`/hadith/${collectionId}`} className="back-link">
          <ArrowLeft size={16} /> Back to Collection
        </Link>

        <div className="page-header" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
          <h1 className="page-title">{bookName || `Book ${bookId}`}</h1>
          <p className="page-description" style={{ opacity: 0.7 }}>
            {hadiths.length} Hadiths
          </p>
        </div>

        {error && (
          <div style={{ marginBottom: '1.5rem' }}>
            <FriendlyError 
              title={error.title} 
              message={error.message} 
              icon={error.icon} 
              onRetry={() => window.location.reload()} 
            />
          </div>
        )}

        {loading ? (
          <div className="hadiths-list">
            {Array(5).fill(0).map((_, i) => <HadithSkeleton key={i} />)}
          </div>
        ) : (
          <div className="hadiths-list">
            {hadiths.map((hadith, i) => {
              const bk = isBookmarked('hadith', `${collectionId}-${hadith.number}`);
              return (
                <article key={hadith.number || i} className="hadith-card card">
                  <div className="hadith-card-top">
                    <div className="hadith-num-badge">
                      #{hadith.number}
                    </div>
                    <div className="hadith-card-actions">
                      <button
                        className={`btn-icon${bk ? ' active' : ''}`}
                        onClick={() => toggleBookmark({
                          type: 'hadith',
                          id: `${collectionId}-${hadith.number}`,
                          data: hadith,
                          collection: collectionId
                        })}
                        title="Save Hadith"
                      >
                        <Bookmark size={18} />
                      </button>
                      <button 
                        className="btn-icon"
                        onClick={() => copyHadith(hadith)}
                        title="Copy Hadith"
                      >
                        <Copy size={18} />
                      </button>
                    </div>
                  </div>
                  
                  {hadith.arab && (
                    <div className="hadith-arabic arabic-text notranslate" dir="rtl" translate="no">
                      {hadith.arab}
                    </div>
                  )}
                  
                  {hadith.translation && (
                    <div className="hadith-translation tamil-text">
                      {hadith.translation}
                    </div>
                  )}

                  {hadith.engTranslation && (
                    <div className="hadith-translation" style={{ marginTop: '1rem', color: 'var(--color-text-secondary)' }}>
                      {hadith.engTranslation}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
