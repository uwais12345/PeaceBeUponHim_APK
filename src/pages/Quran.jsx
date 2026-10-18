import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, ArrowLeft, Bookmark, Camera, Copy, Play, DownloadCloud, CheckCircle, Trash2, XCircle, RefreshCw } from 'lucide-react';
import { getSurahs, getSurah, getAyahs, getSurahAyahAudio, QURAN_RECITERS } from '../services/quran';
import { downloadSurah, deleteSurahDownload, getSurahDownloadStatus, subscribeToDownloadProgress, getCachedAudioUrl } from '../services/quranDownload';
import { useBookmarks, useQuranAudioSettings } from '../context/AppContext';
import ReciterPicker from '../components/quran/ReciterPicker';
import PageHero from '../components/PageHero';
import quranBanner from '../assets/quran-banner.svg';
import tamilSurahs from '../data/tamil_surahs.json';
import FriendlyError from '../components/ui/FriendlyError';
import { parseError, getFriendlyAudioErrorMessage } from '../utils/errorHandling';
import './Quran.css';

//  Skeleton 
function SurahSkeleton() {
  return (
    <div className="surah-row skeleton-row">
      <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 6, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 12, width: '30%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

function AyahSkeleton() {
  return (
    <div className="ayah-card" style={{ opacity: 0.5 }}>
      <div className="skeleton" style={{ height: 40, marginBottom: 12, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8, borderRadius: 4 }} />
      <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 4 }} />
    </div>
  );
}

//  Surah List 
function SurahList() {
  const [surahs, setSurahs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getSurahs()
      .then(data => { setSurahs(data); setFiltered(data); })
      .catch(e => setError(parseError(e, 'Quran Surahs')))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!query.trim()) { setFiltered(surahs); return; }
    const q = query.toLowerCase();
    setFiltered(surahs.filter(s =>
      s.name_simple?.toLowerCase().includes(q) ||
      s.name_arabic?.includes(query) ||
      tamilSurahs[s.id]?.toLowerCase().includes(q) ||
      s.translated_name?.name?.toLowerCase().includes(q) ||
      String(s.id) === query.trim()
    ));
  }, [query, surahs]);

  if (error) return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container" style={{ paddingTop: '2rem' }}>
        <FriendlyError 
          title={error.title} 
          message={error.message} 
          icon={error.icon} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    </main>
  );

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        <PageHero
          image={quranBanner}
          title="القرآن الكريم"
          description="The Holy Quran · 114 Surahs · Tamil & English Translations"
          className="quran-page-hero"
        >
          <div className="quran-revelation-types">
            <span className="badge badge-primary">Makki</span>
            <span className="badge badge-gold">Madani</span>
          </div>
        </PageHero>

        {/* Search */}
        <div className="quran-search-wrap">
          <Search size={16} className="quran-search-icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Surah by name or number..."
            className="quran-search"
            aria-label="Search Surahs"
          />
        </div>

        {/* Surah list */}
        <div className="surah-list" role="list" aria-label="List of Surahs">
          {loading
            ? Array(20).fill(0).map((_, i) => <SurahSkeleton key={i} />)
            : filtered.length === 0
            ? <p className="empty-state-title" style={{ padding: '2rem 0' }}>No Surah found</p>
            : filtered.map(surah => (
              <Link
                key={surah.id}
                to={`/quran/${surah.id}`}
                className="surah-row"
                role="listitem"
                aria-label={`Surah ${surah.name_simple}`}
              >
                <div className="surah-number">
                  <span>{surah.id}</span>
                </div>
                <div className="surah-info">
                  <div className="surah-name-row">
                    <span className="surah-name-en">{surah.name_simple}</span>
                  </div>
                  <div className="surah-meta-row">
                    <span className="surah-meaning">{tamilSurahs[surah.id] || surah.translated_name?.name}</span>
                  </div>
                </div>
                <span className="surah-arabic arabic-text notranslate" dir="rtl" translate="no">{surah.name_arabic}</span>
                <ChevronRight size={16} className="surah-arrow" aria-hidden="true" />
              </Link>
            ))
          }
        </div>

        <p className="quran-attribution">
          Arabic text and translations provided by <a href="https://quran.com" target="_blank" rel="noopener noreferrer">Quran.com</a>. Tamil translation: Abdul Hameed Baqavi.
        </p>
      </div>
    </main>
  );
}

//  Surah Detail 
function SurahDetail({ surahId }) {
  const [surah, setSurah] = useState(null);
  const [ayahs, setAyahs] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTracks, setAudioTracks] = useState([]);
  const [playingIndex, setPlayingIndex] = useState(-1);
  const [audioLoading, setAudioLoading] = useState(true);
  const [audioError, setAudioError] = useState('');
  const { reciterId: selectedReciterId, setReciterId: setSelectedReciterId } = useQuranAudioSettings();
  const [screenshottingVerse, setScreenshottingVerse] = useState('');
  const [screenshotError, setScreenshotError] = useState('');
  const [downloadState, setDownloadState] = useState({ status: 'none', progress: 0 });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    setDownloadState(getSurahDownloadStatus(surahId, selectedReciterId));
    const unsubscribe = subscribeToDownloadProgress((sId, rId, prog, stat, err) => {
      if (String(sId) === String(surahId) && String(rId) === String(selectedReciterId)) {
        setDownloadState({ status: stat, progress: prog, error: err });
      }
    });
    return unsubscribe;
  }, [surahId, selectedReciterId]);

  const handleDownload = () => {
    downloadSurah(surahId, selectedReciterId).catch(console.error);
  };
  
  const handleDeleteDownload = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    deleteSurahDownload(surahId, selectedReciterId);
    setShowDeleteConfirm(false);
  };

  const [isChangingPage, setIsChangingPage] = useState(false);

  useEffect(() => {
    let active = true;
    // If we already have ayahs, keep them visible and show a subtle indicator instead of clearing to blank
    if (ayahs.length > 0) {
      setIsChangingPage(true);
    } else {
      setLoading(true);
    }

    Promise.all([getSurah(surahId), getAyahs(surahId, { page })])
      .then(([s, { verses, pagination: pg }]) => {
        if (!active) return;
        setSurah(s);
        setAyahs(verses);
        setPagination(pg);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      })
      .catch(e => {
        if (!active) return;
        setError(parseError(e, 'Quran Verses'));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setIsChangingPage(false);
      });

    return () => { active = false; };
  }, [surahId, page]);

  useEffect(() => {
    let cancelled = false;
    setAudioTracks([]);
    setPlayingIndex(-1);
    setIsPlaying(false);
    setAudioError('');
    setAudioLoading(true);
    const audioEl = audioRef.current;
    audioEl?.pause();
    getSurahAyahAudio(surahId, selectedReciterId)
      .then(tracks => { if (!cancelled) setAudioTracks(tracks); })
      .catch(e => {
        if (!cancelled) setAudioError(getFriendlyAudioErrorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setAudioLoading(false);
      });

    return () => {
      cancelled = true;
      audioEl?.pause();
    };
  }, [surahId, selectedReciterId]);

  const copyAyah = (ayah) => {
    const text = ayah.translations?.find(t => t.resource_id === 819)?.text ||
                 ayah.translations?.[0]?.text || '';
    navigator.clipboard.writeText(`${ayah.verse_key} — ${text}`);
  };

  const saveAyahImage = async (ayah) => {
    const card = document.getElementById(`ayah-${ayah.verse_number}`);
    if (!card) {
      setScreenshotError(`Unable to find Ayah ${ayah.verse_key} to save.`);
      return;
    }

    setScreenshottingVerse(ayah.verse_key);
    setScreenshotError('');
    try {
      await document.fonts.ready;
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(card, {
        backgroundColor: getComputedStyle(card).backgroundColor,
        ignoreElements: element => element.classList.contains('ayah-actions'),
        scale: 2,
        useCORS: true,
      });
      const image = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('The browser could not create the image.'));
        }, 'image/png');
      });
      const imageUrl = URL.createObjectURL(image);
      const download = document.createElement('a');
      download.href = imageUrl;
      download.download = `quran-${ayah.verse_key.replace(':', '-')}.png`;
      download.click();
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
    } catch (error) {
      setScreenshotError(`Unable to save Ayah image: ${error.message}`);
    } finally {
      setScreenshottingVerse('');
    }
  };

  const playAudioAt = async (index) => {
    const track = audioTracks[index];
    const audio = audioRef.current;
    if (!track || !audio) return;
    const ayahNumber = Number(track.verseKey.split(':')[1]);
    const trackPage = Math.floor((ayahNumber - 1) / 10) + 1;
    if (trackPage !== page) setPage(trackPage);
    setPlayingIndex(index);
    setAudioError('');
    try {
      if (audio.src && audio.src.startsWith('blob:')) {
        URL.revokeObjectURL(audio.src);
      }
      const url = await getCachedAudioUrl(track.url);
      audio.src = url;
      await audio.play();
    } catch(e) {
      if (e.name !== 'AbortError') {
        setAudioError(getFriendlyAudioErrorMessage(e));
      }
      setIsPlaying(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || audioLoading || audioTracks.length === 0) return;
    if (isPlaying) {
      audioRef.current.pause();
      return;
    }
    playAudioAt(playingIndex < 0 ? 0 : playingIndex);
  };

  const handleAudioEnded = () => {
    if (playingIndex + 1 < audioTracks.length) playAudioAt(playingIndex + 1);
    else {
      setPlayingIndex(-1);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (playingIndex < 0) return;
    const track = audioTracks[playingIndex];
    if (track?.isSurahAudio) return;
    const verseKey = track?.verseKey;
    const ayahNumber = Number(verseKey?.split(':')[1]);
    const activePage = Math.floor((ayahNumber - 1) / 10) + 1;
    const activeAyah = ayahs.find(ayah => ayah.verse_key === verseKey);
    if (activeAyah) {
      document.getElementById(`ayah-${activeAyah.verse_number}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (verseKey && !ayahs.some(ayah => ayah.verse_key === verseKey) && page !== activePage) {
      setPage(activePage);
    }
  }, [playingIndex, audioTracks, ayahs, page]);

  if (error) return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container" style={{ paddingTop: '2rem' }}>
        <FriendlyError 
          title={error.title} 
          message={error.message} 
          icon={error.icon} 
          onRetry={() => window.location.reload()} 
        />
      </div>
    </main>
  );

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container">
        {/* iOS Confirm Modal */}
        {showDeleteConfirm && (
          <div className="ios-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
            <div className="ios-confirm-dialog" onClick={e => e.stopPropagation()}>
              <div className="ios-confirm-content">
                <h4>Remove Download</h4>
                <p>Are you sure you want to remove downloaded audio and text for this Surah?</p>
              </div>
              <div className="ios-confirm-actions">
                <button className="ios-confirm-btn ios-btn-delete" onClick={confirmDelete}>Remove</button>
                <button className="ios-confirm-btn ios-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Back */}
        <Link to="/quran" className="back-link">
          <ArrowLeft size={16} /> All Surahs
        </Link>

        {/* Surah header / Surah Info Card */}
        {surah && (
          <div className="surah-detail-header">
            {/* Quran recitation audio player & Surah Info Card */}
            <div className="surah-audio-player">
              <div className="surah-info-card" id="surah-info-card">
                <div className="surah-info-card-top">
                  <div className="surah-info-badges">
                    <span className="badge badge-primary">Surah {surah.id}</span>
                    <span className="badge badge-unknown">{surah.verses_count} Ayahs</span>
                    {surah.revelation_place && (
                      <span className={`badge ${surah.revelation_place === 'makkah' ? 'badge-gold' : 'badge-primary'}`}>
                        {surah.revelation_place === 'makkah' ? 'Makki' : 'Madani'}
                      </span>
                    )}
                  </div>
                  <h1 className="surah-info-arabic arabic-text notranslate" dir="rtl" translate="no" lang="ar">
                    {surah.name_arabic}
                  </h1>
                  <p className="surah-info-names">
                    <span className="surah-info-name-en">{surah.name_simple}</span>
                    {(tamilSurahs[surah.id] || surah.translated_name?.name) && (
                      <span className="surah-info-name-ta">
                        &nbsp;·&nbsp;{tamilSurahs[surah.id] || surah.translated_name?.name}
                      </span>
                    )}
                  </p>
                </div>
                <div className="surah-info-card-bottom">
                  <div className="surah-info-reciter-row">
                    <span className="surah-info-reciter-label">Reciter</span>
                    <ReciterPicker
                      reciters={QURAN_RECITERS}
                      value={selectedReciterId}
                      onChange={setSelectedReciterId}
                      label="Choose Quran reciter"
                    />
                  </div>
                  <p className="surah-audio-status">
                    {audioLoading
                      ? 'Loading recitation...'
                      : playingIndex >= 0
                        ? audioTracks[playingIndex]?.isSurahAudio
                          ? `Playing Surah ${surahId}`
                          : `Playing Ayah ${audioTracks[playingIndex]?.verseKey}`
                        : audioTracks[0]?.isSurahAudio ? 'Full-Surah Recitation' : 'Ayah-by-Ayah Recitation'}
                  </p>
                  <div className="surah-audio-download" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {downloadState.status === 'none' || downloadState.status === 'error' ? (
                      <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownload} title="Download Surah text and audio for offline reading">
                        <DownloadCloud size={14} style={{ marginRight: 4 }} /> Download Offline
                      </button>
                    ) : downloadState.status === 'downloading' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="spinning" style={{ display: 'inline-block' }}><RefreshCw size={14} /></span> 
                        Downloading {downloadState.progress}%
                      </div>
                    ) : downloadState.status === 'downloaded' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <CheckCircle size={14} color="var(--color-primary)" /> Available Offline
                        <button type="button" className="btn-icon btn-icon-danger btn-sm" onClick={handleDeleteDownload} title="Delete download" aria-label="Delete download" style={{ marginLeft: 4 }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : null}
                    {downloadState.status === 'error' && <span style={{ color: '#e88080' }}>Failed. Try again.</span>}
                  </div>
                </div>
              </div>
              {/* Play/Pause button */}
              <button
                className="btn btn-primary surah-play-btn"
                onClick={togglePlay}
                disabled={audioTracks.length === 0 || audioLoading}
                aria-label={isPlaying ? 'Pause recitation' : 'Play recitation'}
              >
                {isPlaying ? (
                   <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                  <Play fill="currentColor" size={24} />
                )}
              </button>
            </div>
            {audioError && <p className="error-detail" role="alert">{audioError}</p>}
            
            {/* Hidden audio element */}
            <audio 
              ref={audioRef}
              onEnded={handleAudioEnded}
              onPause={() => setIsPlaying(false)}
              onPlay={() => {
                setIsPlaying(true);
                setAudioError('');
              }}
              onError={() => {
                setAudioError('Audio recitation could not be loaded. Please check your connection and try again.');
                setIsPlaying(false);
              }}
              preload="none"
            />

            {/* Bismillah (not for Al-Fatiha or At-Tawbah) */}
            {surah.id !== 1 && surah.id !== 9 && (
              <p className="bismillah arabic-text notranslate" dir="rtl" translate="no">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
            )}
          </div>
        )}

        {/* Ayahs */}
        <div className="ayahs-list" style={{ opacity: isChangingPage ? 0.6 : 1, transition: 'opacity 0.2s ease', position: 'relative' }}>
          {loading
            ? Array(5).fill(0).map((_, i) => <AyahSkeleton key={i} />)
            : ayahs.map(ayah => {
              const tamilTrans = ayah.translations?.find(t => t.resource_id === 133);
              const englishTrans = ayah.translations?.find(t => t.resource_id === 20);
              const bk = isBookmarked('ayah', ayah.verse_key);
              const isAyahPlaying = !audioTracks[playingIndex]?.isSurahAudio &&
                audioTracks[playingIndex]?.verseKey === ayah.verse_key;

              return (
                <article 
                  key={ayah.verse_key} 
                  className={`ayah-card ${isAyahPlaying ? 'playing-highlight' : ''}`}
                  id={`ayah-${ayah.verse_number}`}
                  style={isAyahPlaying ? { borderColor: 'var(--color-primary)', boxShadow: '0 4px 12px rgba(26, 107, 58, 0.15)', transform: 'scale(1.02)', transition: 'all 0.3s ease' } : { transition: 'all 0.3s ease' }}
                >
                  <div className="ayah-top">
                    <span className="ayah-number" aria-label={`Ayah ${ayah.verse_number}`}>
                      {ayah.verse_number}
                    </span>
                    <div className="ayah-actions">
                      <button
                        className={`btn-icon${bk ? ' active' : ''}`}
                        onClick={() => toggleBookmark({
                          type: 'ayah', id: ayah.verse_key,
                          title: `Quran ${ayah.verse_key}`,
                          subtitle: englishTrans?.text?.slice(0, 80),
                          href: `/quran/${surahId}#ayah-${ayah.verse_number}`,
                        })}
                        aria-label={bk ? 'Remove bookmark' : 'Bookmark ayah'}
                        title={bk ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <Bookmark size={15} fill={bk ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => copyAyah(ayah)}
                        aria-label="Copy ayah"
                        title="Copy"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => saveAyahImage(ayah)}
                        disabled={screenshottingVerse === ayah.verse_key}
                        aria-label={`Save Ayah ${ayah.verse_key} as image`}
                        title="Save as image"
                      >
                        <Camera size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Arabic */}
                  <p className="ayah-arabic arabic-text arabic-xl notranslate" dir="rtl" translate="no" lang="ar">
                    {ayah.text_uthmani}
                  </p>

                  {/* Tamil translation */}
                  {tamilTrans && (
                    <div className="ayah-translation ayah-tamil">
                      <span className="trans-label">தமிழ்</span>
                      <p
                        className="tamil-text"
                        dangerouslySetInnerHTML={{ __html: tamilTrans.text }}
                        lang="ta"
                      />
                    </div>
                  )}

                  {/* English translation */}
                  {englishTrans && (
                    <div className="ayah-translation ayah-english">
                      <span className="trans-label">English</span>
                      <p dangerouslySetInnerHTML={{ __html: englishTrans.text }} lang="en" />
                    </div>
                  )}

                  <p className="ayah-ref">Quran {ayah.verse_key}</p>
                </article>
              );
            })
          }
        </div>
        {screenshotError && <p className="quran-error" role="alert">{screenshotError}</p>}

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <nav className="pagination" aria-label="Surah pages">
            <button
              className="page-btn"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              aria-label="Previous page"
            ><ChevronLeft size={18} strokeWidth={2.5} /></button>
            <span className="pagination-current" aria-live="polite">
              {page} <span aria-hidden="true">/</span> {pagination.total_pages}
            </span>
            <button
              className="page-btn"
              disabled={page >= pagination.total_pages}
              onClick={() => setPage(p => p + 1)}
              aria-label="Next page"
            ><ChevronRight size={18} strokeWidth={2.5} /></button>
          </nav>
        )}

        <p className="quran-attribution">
          Arabic text and translations from <a href="https://quran.com" target="_blank" rel="noopener noreferrer">Quran.com</a>. Tamil: Abdul Hameed Baqavi. English: Saheeh International.
        </p>
      </div>
    </main>
  );
}

//  Router 
export function QuranIndex() { return <SurahList />; }
export function QuranSurah() {
  const { id } = useParams();
  return <SurahDetail surahId={id} />;
}
