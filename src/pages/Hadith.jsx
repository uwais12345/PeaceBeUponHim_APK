import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Bookmark, Copy, ChevronRight, BookOpen, AlertCircle, Check, BookMarked, Sparkles } from 'lucide-react';
import { COLLECTIONS, HADITH_CATEGORIES, GRADES, COLLECTION_BOOKS, getCollection, getHadiths, getHadithsByBook } from '../services/hadith';
import { useBookmarks } from '../context/AppContext';
import { useAutoRefresh } from '../context/NetworkContext';
import FriendlyError from '../components/ui/FriendlyError';
import { parseError } from '../utils/errorHandling';
import BackButton from '../components/ui/BackButton';
import './Settings.css';
import './Hadith.css';

// Grade badge (iOS Pill Style)
function GradeBadge({ grade }) {
  const g = grade?.toLowerCase();
  const cfg = GRADES[g] || GRADES.unknown;
  const isSahih = g === 'sahih';
  return (
    <span className={`hadith-grade-pill ${isSahih ? 'is-sahih' : 'is-mixed'}`}>
      {cfg.label}
    </span>
  );
}

// Copy helper
async function copyHadithText(hadith, colName) {
  const num = hadith.number || hadith.id || '';
  const ref = colName ? `${colName} #${num}` : `ஹதீஸ் #${num}`;
  const text = `[${ref}]\n\n${hadith.arab ? hadith.arab + '\n\n' : ''}${hadith.translation || hadith.engTranslation || ''}\n\n— Peace Be Upon Him`;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

// Minimal iOS Toast Indicator
function HadithToast({ msg }) {
  if (!msg) return null;
  return (
    <div className="hadith-toast-wrap" role="status" aria-live="polite">
      <div className="hadith-toast-indicator">
        <Check size={15} />
        <span>{msg}</span>
      </div>
    </div>
  );
}

// Unified Inset Hadith Card (Settings Card Group Pattern)
function HadithCard({
  hadith,
  collectionName,
  grade,
  isBookmarked,
  onToggleBookmark,
  onCopy,
}) {
  const hasContent = !!(
    (hadith?.arab && hadith.arab.trim().length > 0) ||
    (hadith?.translation && hadith.translation.trim().length > 0) ||
    (hadith?.engTranslation && hadith.engTranslation.trim().length > 0)
  );

  if (!hasContent) return null;

  return (
    <div className="settings-group-wrap">
      <article className="settings-card-group hadith-card-inset">
        {/* Top Header Row */}
        <div className="hadith-card-top-row">
          <div className="hadith-card-meta-left">
            <span className="hadith-num-pill">#{hadith.number}</span>
            {grade && <GradeBadge grade={grade} />}
          </div>
          <button
            type="button"
            className={`hadith-bookmark-btn ${isBookmarked ? 'is-active' : ''}`}
            onClick={onToggleBookmark}
            aria-label={isBookmarked ? 'சேமிப்பிலிருந்து நீக்குக' : 'சேமிக்க'}
            title={isBookmarked ? 'சேமிக்கப்பட்டது' : 'சேமிக்க'}
          >
            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Arabic Scripture */}
        {hadith.arab && (
          <div className="hadith-card-arabic arabic-text notranslate" dir="rtl" translate="no" lang="ar">
            {hadith.arab}
          </div>
        )}

        {/* Tamil Translation */}
        {hadith.translation && (
          <p className="hadith-card-translation tamil-text">
            {hadith.translation}
          </p>
        )}

        {/* Fallback English Translation */}
        {hadith.engTranslation && !hadith.translation && (
          <p className="hadith-card-translation hadith-eng-fallback">
            {hadith.engTranslation}
          </p>
        )}

        {/* Card Footer Actions & Reference */}
        <div className="hadith-card-footer-row">
          <div className="hadith-card-ref">
            <span className="hadith-card-ref-name">{collectionName || 'ஹதீஸ்'}</span>
            <span className="hadith-ref-dot">·</span>
            <span className="hadith-card-ref-num">#{hadith.number}</span>
          </div>

          <div className="hadith-card-actions">
            <button
              type="button"
              className="hadith-action-pill"
              onClick={onCopy}
              title="நகலெடு"
              aria-label="நகலெடு"
            >
              <Copy size={13} aria-hidden="true" />
              <span>நகலெடு</span>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}

function HadithSkeleton() {
  return (
    <div className="settings-group-wrap">
      <div className="settings-card-group hadith-card-inset hadith-skeleton-card">
        <div className="hadith-skel-line" style={{ width: '25%', height: 16 }} />
        <div className="hadith-skel-line" style={{ width: '92%', height: 36, margin: '8px 0' }} />
        <div className="hadith-skel-line" style={{ width: '85%', height: 16 }} />
        <div className="hadith-skel-line" style={{ width: '60%', height: 14 }} />
      </div>
    </div>
  );
}

// ── View 1: Collection list (/hadith) ──
function CollectionList() {
  return (
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Back Navigation */}
        <div className="settings-top-nav">
          <BackButton fallback="/" label="Back" />
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">ஹதீஸ் · Hadith</h1>

        {/* iOS-Style Quick Search Bar Row */}
        <div className="settings-group-wrap">
          <Link to="/hadith/search" className="hadith-ios-search-field-btn" aria-label="Search Hadiths">
            <Search size={16} className="hadith-ios-search-icon" />
            <span className="hadith-ios-search-placeholder">ஹதீஸ்களைத் தேடுங்கள் · Search Hadiths...</span>
          </Link>
        </div>

        {/* Section 1: Canonical Collections (Kutub al-Sittah) */}
        <div className="settings-group-wrap">
          <h2 className="settings-group-heading">குத்துப் அஸ்-ஸித்தா · Canonical Collections</h2>
          <div className="settings-card-group">
            {COLLECTIONS.map((col) => (
              <Link
                key={col.id}
                to={`/hadith/${col.id}`}
                className="settings-card-row hadith-row-item"
              >
                <div className="hadith-row-left">
                  <span className="hadith-col-icon-squircle" aria-hidden="true">
                    <BookOpen size={18} />
                  </span>
                  <div className="settings-row-text-group">
                    <div className="hadith-row-title-line">
                      <span className="settings-row-label">{col.name}</span>
                    </div>
                    <span className="settings-row-subtext tamil-text">{col.author}</span>
                    <span className="hadith-row-arabic arabic-text notranslate" dir="rtl">{col.arabicName}</span>
                  </div>
                </div>
                <div className="hadith-row-right">
                  <div className="hadith-row-pills">
                    <span className="hadith-count-tag">{col.total?.toLocaleString()}</span>
                    <GradeBadge grade={col.grade} />
                  </div>
                  <ChevronRight size={19} className="settings-row-chevron" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Section 2: Browse by Topics */}
        <div className="settings-group-wrap">
          <h2 className="settings-group-heading">தலைப்பு வாரியாக · Hadith Topics</h2>
          <div className="settings-card-group">
            {HADITH_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                to={`/hadith/categories/${cat.id}`}
                className="settings-card-row hadith-row-item"
              >
                <div className="hadith-row-left">
                  <span className="hadith-topic-icon-squircle" aria-hidden="true">
                    {cat.icon}
                  </span>
                  <div className="settings-row-text-group">
                    <span className="settings-row-label">{cat.name}</span>
                    <span className="settings-row-subtext tamil-text">{cat.tamil}</span>
                  </div>
                </div>
                <ChevronRight size={19} className="settings-row-chevron" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

// ── View 2: Collection detail (/hadith/:id) ──
function CollectionDetail({ collectionId }) {
  const col = getCollection(collectionId);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);
  const books = COLLECTION_BOOKS[collectionId] || [];
  const [activeTab, setActiveTab] = useState(books.length > 0 ? 'books' : 'hadiths');
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2200);
  };

  const loadCollectionHadiths = useCallback(async () => {
    if (!col || activeTab === 'books') return;
    setLoading(true);
    try {
      const data = await getHadiths(collectionId, { page, limit: 20 });
      setHadiths(data.hadiths || []);
      setError(null);
    } catch (e) {
      setError(parseError(e, 'Hadiths'));
    } finally {
      setLoading(false);
    }
  }, [col, activeTab, collectionId, page]);

  useEffect(() => {
    loadCollectionHadiths();
  }, [loadCollectionHadiths]);

  useAutoRefresh(`hadith-col-${collectionId}-${page}`, loadCollectionHadiths, {
    enabled: activeTab === 'hadiths' && (!!error || !hadiths.length),
    deps: [collectionId, page, activeTab, !!error, hadiths.length],
  });

  if (!col) {
    return (
      <main className="page-wrapper settings-page" id="main-content">
        <div className="settings-shell">
          <div className="settings-top-nav">
            <BackButton fallback="/hadith" label="Hadith" />
          </div>
          <div className="settings-group-wrap">
            <div className="settings-card-group hadith-empty-card">
              <AlertCircle size={32} className="hadith-empty-icon" />
              <p className="hadith-empty-title">Collection not found</p>
              <Link to="/hadith" className="hadith-btn-pill">Back to Hadith</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Back Navigation */}
        <div className="settings-top-nav">
          <BackButton fallback="/hadith" label="Collections" />
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">{col.name}</h1>

        {/* Inset Collection Summary Card */}
        <div className="settings-group-wrap">
          <div className="settings-card-group hadith-col-summary-card">
            <div className="hadith-col-summary-arabic arabic-text notranslate" dir="rtl">{col.arabicName}</div>
            <div className="hadith-col-summary-author tamil-text">{col.author}</div>
            <p className="hadith-col-summary-desc">{col.description}</p>
            <div className="hadith-col-summary-footer">
              <GradeBadge grade={col.grade} />
              <span className="hadith-total-pill">{col.total?.toLocaleString()} ஹதீஸ்கள்</span>
            </div>
          </div>
        </div>

        {/* iOS-Style Segmented Tabs */}
        <div className="hadith-segmented-wrap">
          <div className="hadith-segmented-control">
            <button
              type="button"
              className={`hadith-segment-btn ${activeTab === 'hadiths' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('hadiths')}
            >
              ஹதீஸ்கள்
            </button>
            {books.length > 0 && (
              <button
                type="button"
                className={`hadith-segment-btn ${activeTab === 'books' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('books')}
              >
                நூல்கள் ({books.length})
              </button>
            )}
          </div>
        </div>

        {/* Books List Tab */}
        {activeTab === 'books' && books.length > 0 && (
          <div className="settings-group-wrap">
            <h2 className="settings-group-heading">நூல்கள் · Chapters ({books.length})</h2>
            <div className="settings-card-group">
              {books.map((book) => (
                <Link
                  key={book.number}
                  to={`/hadith/${collectionId}/book/${book.number}`}
                  className="settings-card-row hadith-row-item"
                >
                  <div className="hadith-row-left">
                    <span className="hadith-book-num-badge">{book.number}</span>
                    <div className="settings-row-text-group">
                      <span className="settings-row-label">{book.name}</span>
                      <span className="hadith-row-arabic arabic-text notranslate" dir="rtl">{book.arabicName}</span>
                    </div>
                  </div>
                  <div className="hadith-row-right">
                    {book.count && <span className="hadith-count-tag">{book.count}</span>}
                    <ChevronRight size={19} className="settings-row-chevron" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Hadiths List Tab */}
        {activeTab === 'hadiths' && (
          <>
            {error && (
              <div className="settings-group-wrap">
                <FriendlyError
                  title={error.title}
                  message={error.message}
                  icon={error.icon}
                  onRetry={loadCollectionHadiths}
                />
              </div>
            )}

            {loading ? (
              <div className="hadiths-stack">
                {Array(4).fill(0).map((_, i) => (
                  <HadithSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="hadiths-stack">
                {hadiths.map((hadith, i) => {
                  const bk = isBookmarked('hadith', `${collectionId}-${hadith.number}`);
                  return (
                    <HadithCard
                      key={hadith.number || i}
                      hadith={hadith}
                      collectionName={col.name}
                      grade={col.grade === 'Sahih' ? 'sahih' : 'mixed'}
                      isBookmarked={bk}
                      onToggleBookmark={() =>
                        toggleBookmark({
                          type: 'hadith',
                          id: `${collectionId}-${hadith.number}`,
                          title: `${col.name} #${hadith.number}`,
                          subtitle: hadith.arab?.slice(0, 80),
                          href: `/hadith/${collectionId}/${hadith.number}`,
                        })
                      }
                      onCopy={() =>
                        copyHadithText(hadith, col.name).then((ok) => ok && showToast('ஹதீஸ் நகலெடுக்கப்பட்டது'))
                      }
                    />
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {!error && hadiths.length > 0 && (
              <div className="hadith-pagination-bar">
                <button
                  type="button"
                  className="hadith-page-nav-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ‹ முந்தையது
                </button>
                <span className="hadith-page-indicator">{page} பக்கம்</span>
                <button
                  type="button"
                  className="hadith-page-nav-btn"
                  onClick={() => setPage((p) => p + 1)}
                >
                  அடுத்தது ›
                </button>
              </div>
            )}
          </>
        )}

        <p className="hadith-attribution-note">
          Hadith text and data compiled from canonical open editions. Source: {col.name}.
        </p>
      </div>

      <HadithToast msg={toastMsg} />
    </main>
  );
}

// ── View 3: Category detail (/hadith/categories/:id) ──
function CategoryDetail({ categoryId }) {
  const cat = HADITH_CATEGORIES.find((c) => c.id === categoryId);
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2200);
  };

  const loadCategoryHadiths = useCallback(async () => {
    if (!cat) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getHadiths('bukhari', { page: 1, limit: 2000 });
      const keywords = {
        iman: ['faith', 'believe in allah'],
        tawheed: ['worship allah', 'partner', 'alone'],
        salah: ['prayer', 'pray', 'prostrate', 'rakat'],
        quran: ['quran', 'recite', 'surah'],
        youth: ['youth', 'young', 'boy', 'girl', 'children'],
        parents: ['parents', 'mother', 'father', 'obey'],
        family: ['family', 'wife', 'husband', 'children'],
        marriage: ['marry', 'marriage', 'wife'],
        character: ['character', 'manners', 'polite', 'good'],
        tawbah: ['repent', 'forgive', 'sin'],
        sabr: ['patient', 'patience', 'endure'],
        ramadan: ['ramadan', 'fasting', 'fast'],
        dua: ['supplicate', 'invoke', 'dua'],
        rizq: ['provision', 'wealth', 'charity'],
        akhirah: ['hereafter', 'day of resurrection', 'judgment'],
        jannah: ['paradise', 'jannah', 'heaven'],
        charity: ['charity', 'sadaqa', 'wealth'],
        knowledge: ['knowledge', 'learn', 'scholar'],
        death: ['death', 'die', 'grave'],
        fasting: ['fasting', 'fast', 'ramadan'],
        anger: ['anger', 'angry', 'temper'],
        brotherhood: ['brother', 'muslim', 'help'],
        business: ['buy', 'sell', 'business', 'trade'],
        tawakkul: ['trust in allah', 'rely'],
      }[categoryId] || [cat.name.toLowerCase()];

      const results = (data.hadiths || [])
        .filter((h) => {
          const text = h.translation?.toLowerCase() || '';
          const engText = h.engTranslation?.toLowerCase() || '';
          return keywords.some((k) => text.includes(k) || engText.includes(k));
        })
        .slice(0, 15);

      setHadiths(results);
    } catch (e) {
      setError(parseError(e, 'Hadiths'));
    } finally {
      setLoading(false);
    }
  }, [categoryId, cat]);

  useEffect(() => {
    loadCategoryHadiths();
  }, [loadCategoryHadiths]);

  useAutoRefresh(`hadith-cat-${categoryId}`, loadCategoryHadiths, {
    enabled: !!error || !hadiths.length,
    deps: [categoryId, !!error, hadiths.length],
  });

  if (!cat) {
    return (
      <main className="page-wrapper settings-page" id="main-content">
        <div className="settings-shell">
          <div className="settings-top-nav">
            <BackButton fallback="/hadith" label="Hadith" />
          </div>
          <div className="settings-group-wrap">
            <div className="settings-card-group hadith-empty-card">
              <AlertCircle size={32} className="hadith-empty-icon" />
              <p className="hadith-empty-title">Category not found</p>
              <Link to="/hadith" className="hadith-btn-pill">Back to Hadith</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Back Navigation */}
        <div className="settings-top-nav">
          <BackButton fallback="/hadith" label="Categories" />
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">{cat.name}</h1>

        {/* Category Summary Inset Card */}
        <div className="settings-group-wrap">
          <div className="settings-card-group hadith-cat-summary-card">
            <span className="hadith-cat-summary-icon" aria-hidden="true">{cat.icon}</span>
            <div className="hadith-cat-summary-info">
              <h2 className="hadith-cat-summary-ta tamil-text">{cat.tamil}</h2>
              <span className="hadith-cat-summary-sub">ஸஹீஹ் அல்-புகாரி தேர்ந்தெடுக்கப்பட்ட ஹதீஸ்கள்</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="settings-group-wrap">
            <FriendlyError
              title={error.title}
              message={error.message}
              icon={error.icon}
              onRetry={loadCategoryHadiths}
            />
          </div>
        )}

        {loading ? (
          <div className="hadiths-stack">
            {Array(3).fill(0).map((_, i) => (
              <HadithSkeleton key={i} />
            ))}
          </div>
        ) : !error && hadiths.length > 0 ? (
          <div className="hadiths-stack">
            {hadiths.map((hadith, i) => {
              const bk = isBookmarked('hadith', `bukhari-${hadith.number}`);
              return (
                <HadithCard
                  key={hadith.number || i}
                  hadith={hadith}
                  collectionName="Sahih al-Bukhari"
                  grade="sahih"
                  isBookmarked={bk}
                  onToggleBookmark={() =>
                    toggleBookmark({
                      type: 'hadith',
                      id: `bukhari-${hadith.number}`,
                      title: `Sahih al-Bukhari #${hadith.number}`,
                      subtitle: hadith.arab?.slice(0, 80),
                      href: `/hadith/bukhari/${hadith.number}`,
                    })
                  }
                  onCopy={() =>
                    copyHadithText(hadith, 'Sahih al-Bukhari').then((ok) => ok && showToast('ஹதீஸ் நகலெடுக்கப்பட்டது'))
                  }
                />
              );
            })}
          </div>
        ) : !error ? (
          <div className="settings-group-wrap">
            <div className="settings-card-group hadith-empty-card">
              <BookMarked size={32} className="hadith-empty-icon" />
              <p className="hadith-empty-title">ஹதீஸ்கள் காணப்படவில்லை</p>
              <p className="hadith-empty-sub">முக்கிய தொகுப்புகளிலிருந்து படிக்கவும்</p>
              <Link to="/hadith" className="hadith-btn-pill">ஹதீஸ் தொகுப்புகள்</Link>
            </div>
          </div>
        ) : null}
      </div>

      <HadithToast msg={toastMsg} />
    </main>
  );
}

// ── View 4: Hadith Search (/hadith/search) ──
function HadithSearch() {
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState('bukhari');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2200);
  };

  const doSearch = useCallback(async () => {
    if (!query.trim() || !collection) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      const data = await getHadiths(collection, { page: 1, limit: 50 });
      const q = query.toLowerCase();
      const filtered = (data.hadiths || []).filter(
        (h) =>
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
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Back Navigation */}
        <div className="settings-top-nav">
          <BackButton fallback="/hadith" label="Hadith" />
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">ஹதீஸ் தேடல்</h1>

        {/* Inset Search Controls Group */}
        <div className="settings-group-wrap">
          <div className="settings-card-group hadith-search-panel">
            <div className="hadith-search-control-row">
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="hadith-search-select"
                aria-label="Select collection"
              >
                {COLLECTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hadith-search-input-row">
              <Search size={16} className="hadith-ios-search-icon" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="எண், வார்த்தை, வாசகம்..."
                onKeyDown={(e) => e.key === 'Enter' && doSearch()}
                className="hadith-search-input-field"
                aria-label="Search query"
              />
              <button
                type="button"
                className="hadith-search-submit-btn"
                onClick={doSearch}
                disabled={loading || !query.trim()}
              >
                {loading ? '...' : 'தேட'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="settings-group-wrap">
            <FriendlyError
              title={error.title}
              message={error.message}
              icon={error.icon}
              onRetry={doSearch}
            />
          </div>
        )}

        {searched && !loading && !error && (
          <p className="hadith-search-count-header">
            {results.length} முடிவுகள் · {COLLECTIONS.find((c) => c.id === collection)?.name}
          </p>
        )}

        <div className="hadiths-stack">
          {results.map((h, i) => {
            const colName = COLLECTIONS.find((c) => c.id === collection)?.name;
            const bk = isBookmarked('hadith', `${collection}-${h.number}`);
            return (
              <HadithCard
                key={h.number || i}
                hadith={h}
                collectionName={colName}
                grade="mixed"
                isBookmarked={bk}
                onToggleBookmark={() =>
                  toggleBookmark({
                    type: 'hadith',
                    id: `${collection}-${h.number}`,
                    title: `${colName} #${h.number}`,
                    subtitle: h.arab?.slice(0, 80),
                    href: `/hadith/${collection}/${h.number}`,
                  })
                }
                onCopy={() =>
                  copyHadithText(h, colName).then((ok) => ok && showToast('ஹதீஸ் நகலெடுக்கப்பட்டது'))
                }
              />
            );
          })}
        </div>

        {searched && results.length === 0 && !loading && !error && (
          <div className="settings-group-wrap">
            <div className="settings-card-group hadith-empty-card">
              <Search size={32} className="hadith-empty-icon" />
              <p className="hadith-empty-title">முடிவுகள் எதுவும் இல்லை</p>
              <p className="hadith-empty-sub">வேறு வார்த்தைகளில் அல்லது வேறு தொகுப்பை தேர்வு செய்யவும்</p>
            </div>
          </div>
        )}
      </div>

      <HadithToast msg={toastMsg} />
    </main>
  );
}

// ── View 5: Hadith Book Detail (/hadith/:id/book/:bookId) ──
export function HadithBook() {
  const { id: collectionId, bookId } = useParams();
  const [hadiths, setHadiths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bookName, setBookName] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2200);
  };

  const loadBookHadiths = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getHadithsByBook(collectionId, bookId);
      setHadiths(data.hadiths || []);
      setBookName(data.bookName);
      if (data.error) {
        setError(parseError(data.error, 'Hadiths'));
      } else {
        setError(null);
      }
    } catch (e) {
      setError(parseError(e, 'Hadiths'));
    } finally {
      setLoading(false);
    }
  }, [collectionId, bookId]);

  useEffect(() => {
    loadBookHadiths();
  }, [loadBookHadiths]);

  useAutoRefresh(`hadith-book-${collectionId}-${bookId}`, loadBookHadiths, {
    enabled: !!error || !hadiths.length,
    deps: [collectionId, bookId, !!error, hadiths.length],
  });

  return (
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Back Navigation */}
        <div className="settings-top-nav">
          <BackButton fallback={`/hadith/${collectionId}`} label="Collection" />
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">{bookName || `Book ${bookId}`}</h1>

        {/* Book Overview Inset Card */}
        <div className="settings-group-wrap">
          <div className="settings-card-group hadith-col-summary-card">
            <span className="hadith-total-pill">
              {hadiths.length} ஹதீஸ்கள் · Book #{bookId}
            </span>
          </div>
        </div>

        {error && (
          <div className="settings-group-wrap">
            <FriendlyError
              title={error.title}
              message={error.message}
              icon={error.icon}
              onRetry={loadBookHadiths}
            />
          </div>
        )}

        {loading ? (
          <div className="hadiths-stack">
            {Array(4).fill(0).map((_, i) => (
              <HadithSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="hadiths-stack">
            {hadiths.map((hadith, i) => {
              const bk = isBookmarked('hadith', `${collectionId}-${hadith.number}`);
              return (
                <HadithCard
                  key={hadith.number || i}
                  hadith={hadith}
                  collectionName={bookName || `Book ${bookId}`}
                  grade="sahih"
                  isBookmarked={bk}
                  onToggleBookmark={() =>
                    toggleBookmark({
                      type: 'hadith',
                      id: `${collectionId}-${hadith.number}`,
                      data: hadith,
                      collection: collectionId,
                      title: `${bookName || 'Hadith'} #${hadith.number}`,
                      subtitle: hadith.arab?.slice(0, 80),
                      href: `/hadith/${collectionId}/book/${bookId}`,
                    })
                  }
                  onCopy={() =>
                    copyHadithText(hadith, bookName || `Book ${bookId}`).then(
                      (ok) => ok && showToast('ஹதீஸ் நகலெடுக்கப்பட்டது')
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <HadithToast msg={toastMsg} />
    </main>
  );
}

// Router Exports
export function HadithIndex() {
  return <CollectionList />;
}
export function HadithCollection() {
  const { id } = useParams();
  return <CollectionDetail collectionId={id} />;
}
export function HadithCategoryDetail() {
  const { id } = useParams();
  return <CategoryDetail categoryId={id} />;
}
export function HadithSearchPage() {
  return <HadithSearch />;
}
