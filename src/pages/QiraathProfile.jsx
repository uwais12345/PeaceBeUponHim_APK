import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Play, Pause, Shuffle, Heart,
  Search, Mic2, SkipBack, SkipForward, WifiOff, ChevronRight,
} from 'lucide-react';
import { QIRAATH_RECITERS, getReciterSurahs } from '../services/qiraath';
import { useQiraathPlayback } from '../context/QiraathContext';
import { useBookmarks } from '../context/AppContext';
import { useAppBack } from '../hooks/useAppNavigation';
import ReciterAvatar from '../components/qiraath/ReciterAvatar';
import './Qiraath.css';

const FILTER_OPTIONS = [
  { id: 'all',      label: 'All (114)' },
  { id: 'meccan',   label: 'Meccan (86) • மக்கி' },
  { id: 'medinan',  label: 'Medinan (28) • மதனி' },
];

function SurahRowSkeleton() {
  return (
    <div className="qiraath-surah-row" style={{ pointerEvents: 'none' }}>
      <div className="qiraath-skeleton-line" style={{ width: 36, height: 36, borderRadius: 10 }} />
      <div style={{ flex: 1 }}>
        <div className="qiraath-skeleton-line" style={{ width: '55%', marginBottom: 5 }} />
        <div className="qiraath-skeleton-line" style={{ width: '35%' }} />
      </div>
      <div className="qiraath-skeleton-line" style={{ width: 32, height: 32, borderRadius: '50%' }} />
    </div>
  );
}

export default function QiraathProfile() {
  const { reciterId } = useParams();
  const navigate = useNavigate();
  const handleBack = useAppBack('/qiraath');
  const { loadAndPlay, togglePlay, surah: activeSurah, reciter: activeReciter, playing } = useQiraathPlayback();
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();

  const reciterObj = QIRAATH_RECITERS.find(r => r.id === reciterId);
  const isFav = isBookmarked('qiraath_reciter', reciterId);

  const [surahs, setSurahs]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [query, setQuery]       = useState('');
  const [filter, setFilter]     = useState('all');

  const handleToggleFav = useCallback(() => {
    if (!reciterObj) return;
    toggleBookmark({
      type: 'qiraath_reciter',
      id: reciterId,
      title: reciterObj.name,
      subtitle: `${reciterObj.nameArabic || ''} · ${reciterObj.roleEn || ''}`,
      href: `/qiraath/${reciterId}`,
    });
  }, [reciterObj, reciterId, toggleBookmark]);

  // Load surah list
  useEffect(() => {
    if (!reciterObj) return;
    setLoading(true);
    setError(null);
    getReciterSurahs(reciterId)
      .then(data => setSurahs(data))
      .catch(err => setError(err.message || 'Unable to load surahs. Please check your connection.'))
      .finally(() => setLoading(false));
  }, [reciterId, reciterObj]);

  // Filtered + searched surah list
  const displaySurahs = useMemo(() => {
    let list = surahs;
    if (filter === 'meccan')  list = list.filter(s => s.revelationType?.toLowerCase() === 'makkah' || s.revelationType?.toLowerCase() === 'meccan');
    if (filter === 'medinan') list = list.filter(s => s.revelationType?.toLowerCase() === 'madinah' || s.revelationType?.toLowerCase() === 'medinan');
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(s =>
        s.name?.toLowerCase().includes(q) ||
        s.nameArabic?.includes(query) ||
        String(s.id) === query.trim()
      );
    }
    return list;
  }, [surahs, filter, query]);

  const handlePlaySurah = useCallback((s) => {
    if (!reciterObj) return;
    // If same surah already active — open the full player
    if (activeSurah?.id === s.id && activeReciter?.id === reciterId) {
      navigate(`/qiraath/${reciterId}/player`);
      return;
    }
    // Different surah — start playing
    loadAndPlay(reciterObj, s, surahs);
  }, [reciterObj, loadAndPlay, togglePlay, surahs, activeSurah, activeReciter, reciterId, navigate]);

  const handlePlayAll = useCallback(() => {
    if (!surahs.length || !reciterObj) return;
    loadAndPlay(reciterObj, surahs[0], surahs);
  }, [surahs, reciterObj, loadAndPlay]);

  const handleShuffle = useCallback(() => {
    if (!surahs.length || !reciterObj) return;
    const randomIdx = Math.floor(Math.random() * surahs.length);
    loadAndPlay(reciterObj, surahs[randomIdx], surahs);
  }, [surahs, reciterObj, loadAndPlay]);

  if (!reciterObj) {
    return (
      <main className="qiraath-profile-page" id="main-content">
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <p style={{ color: '#6b7f74' }}>Reciter not found.</p>
          <button className="qiraath-profile-back" onClick={handleBack}>
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </main>
    );
  }

  const isCurrentReciter = activeReciter?.id === reciterId;

  return (
    <main className="qiraath-profile-page" id="main-content">
      {/* ── Hero header ── */}
      <div className="qiraath-profile-hero">
        <div className="qiraath-profile-nav-top">
          <button className="qiraath-profile-back" onClick={handleBack} id="qiraath-profile-back">
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="qiraath-profile-sacred-badge">
          حفص عن عاصم • தலாவத் கஷிஃசே • قرآن
        </div>

        <div className="qiraath-profile-header">
          <ReciterAvatar
            src={reciterObj.photo}
            name={reciterObj.name}
            size={72}
            priority={true}
            className="qiraath-profile-photo"
          />
          <div className="qiraath-profile-info">
            <div className="qiraath-profile-name">{reciterObj.name}</div>
            <div className="qiraath-profile-name-ar">{reciterObj.nameArabic}</div>
            <div className="qiraath-profile-role">
              {reciterObj.roleEn}
            </div>
          </div>
        </div>

        <div className="qiraath-profile-actions">
          <button
            className="qiraath-profile-action-main"
            onClick={handlePlayAll}
            disabled={loading || !surahs.length}
            id="qiraath-play-all-btn"
          >
            <Play size={16} fill="currentColor" /> Play Full Quran
          </button>
          <button
            className="qiraath-profile-action-icon"
            onClick={handleShuffle}
            disabled={loading || !surahs.length}
            id="qiraath-shuffle-btn"
            aria-label="Shuffle"
          >
            <Shuffle size={16} />
          </button>
          <button
            className={`qiraath-profile-action-icon${isFav ? ' is-fav' : ''}`}
            onClick={handleToggleFav}
            aria-label={isFav ? 'Remove from Favourites' : 'Add to Favourites'}
            id="qiraath-fav-btn"
            title={isFav ? 'Remove from Favourites' : 'Add to Favourites'}
          >
            <Heart size={16} fill={isFav ? '#e74c3c' : 'none'} color={isFav ? '#e74c3c' : 'currentColor'} />
          </button>
        </div>
      </div>

      {/* ── Surah list ── */}
      <div className="qiraath-surah-section">
        {/* Search */}
        <div className="qiraath-search-bar">
          <Search size={14} color="#6b7f74" />
          <input
            className="qiraath-search-input"
            placeholder="Search Surah by name, number, or Tamil..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            id="qiraath-surah-search"
            aria-label="Search surahs"
          />
          <Mic2 size={14} color="#6b7f74" />
        </div>

        {/* Filters */}
        <div className="qiraath-surah-filters" role="group" aria-label="Filter by revelation type">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.id}
              className={`qiraath-surah-filter${filter === f.id ? ' active' : ''}`}
              onClick={() => setFilter(f.id)}
              id={`qiraath-surah-filter-${f.id}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="qiraath-surah-list-label">
          <div className="qiraath-surah-list-title">
            Surah Recitations <span style={{ fontSize: 11, color: '#c89500' }}>சூராக்கள் பட்டியல்</span>
          </div>
          <div className="qiraath-surah-list-count">{displaySurahs.length}</div>
        </div>

        {/* Error state */}
        {error && (
          <div style={{ padding: '24px 0', textAlign: 'center' }}>
            <WifiOff size={32} color="#6b7f74" style={{ margin: '0 auto 10px' }} />
            <p style={{ color: '#6b7f74', fontSize: 13, marginBottom: 12 }}>{error}</p>
            <button
              onClick={() => { setError(null); setLoading(true); getReciterSurahs(reciterId).then(setSurahs).catch(e => setError(e.message)).finally(() => setLoading(false)); }}
              style={{ background: '#0e5c3a', color: '#fff', border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: 13, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !error && (
          <>
            {[1, 2, 3, 4, 5, 6].map(i => <SurahRowSkeleton key={i} />)}
          </>
        )}

        {/* Surah rows */}
        {!loading && !error && displaySurahs.map(s => {
          const isPlaying = isCurrentReciter && activeSurah?.id === s.id && playing;
          const isActive  = isCurrentReciter && activeSurah?.id === s.id;
          return (
            <div
              key={s.id}
              className={`qiraath-surah-row${isPlaying ? ' playing' : isActive ? ' active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => handlePlaySurah(s)}
              onKeyDown={e => e.key === 'Enter' && handlePlaySurah(s)}
              id={`qiraath-surah-${s.id}`}
            >
              {/* Number */}
              <div className="qiraath-surah-num">
                {isPlaying
                  ? <Pause size={14} fill="white" />
                  : String(s.id).padStart(3, '0')}
              </div>

              {/* Info */}
              <div className="qiraath-surah-row-info">
                <div className="qiraath-surah-row-name">
                  {s.name}
                  <span className="qiraath-surah-row-name-ar">{s.nameArabic}</span>
                  {isPlaying && <span className="qiraath-playing-badge">PLAYING</span>}
                </div>
                <div className="qiraath-surah-row-meta">
                  {s.verseCount} Ayahs
                </div>
              </div>

              {/* Play button */}
              <div className="qiraath-surah-row-actions">
                <button
                  className="qiraath-surah-play-btn"
                  aria-label={isPlaying ? `Pause ${s.name}` : `Play ${s.name}`}
                  onClick={e => { e.stopPropagation(); handlePlaySurah(s); }}
                >
                  {isPlaying
                    ? <Pause size={13} fill="currentColor" />
                    : <Play size={13} fill="currentColor" />}
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty state after search */}
        {!loading && !error && displaySurahs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#6b7f74' }}>
            <Search size={28} style={{ margin: '0 auto 10px' }} />
            <p style={{ fontSize: 13 }}>No surahs found for "{query}"</p>
          </div>
        )}

        {/* Hadith quote */}
        <div className="qiraath-quote">
          <div className="qiraath-quote-stars">✦ ✦ ✦</div>
          <p className="qiraath-quote-text">
            "The best among you are those who learn the Quran and teach it."
          </p>
          <p className="qiraath-quote-source">Sahih Al-Bukhari 5027</p>
        </div>
      </div>
    </main>
  );
}
