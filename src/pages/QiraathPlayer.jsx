import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, ChevronDown, List,
  Play, Pause, AlertCircle, SkipForward as NextIcon,
  Loader2, Mic2, Search, X, Check,
  Download, CheckCircle2, Moon,
} from 'lucide-react';
import { QIRAATH_RECITERS, getSurahAudioUrl } from '../services/qiraath';
import {
  downloadSurahAudio,
  cancelSurahAudioDownload,
  deleteSurahAudioDownload,
  getSurahDownloadStatus,
  getDownloadedSurahIdsForReciter,
  subscribeToQiraathDownload,
  formatBytes,
} from '../services/qiraathDownload';
import { useQiraath } from '../context/QiraathContext';
import tamilSurahs from '../data/tamil_surahs.json';
import './QiraathPlayer.css';

/** Format seconds → mm:ss */
function fmt(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function QiraathPlayer() {
  const navigate = useNavigate();
  const { reciterId } = useParams();
  const {
    reciter, surah, surahList,
    playing, loading, buffering, error,
    currentTime, duration, progress,
    hasTrack,
    sleepTimer,
    startSleepTimer,
    cancelSleepTimer,
    loadAndPlay,
    togglePlay, seekTo,
    playNext, playPrev, retryPlay,
  } = useQiraath();

  const [showSleepModal, setShowSleepModal] = useState(false);

  const [showQueue, setShowQueue] = useState(false);
  const [queueSearch, setQueueSearch] = useState('');
  const seekRef = useRef(null);

  // Active reciter from URL param (fallback to current playing reciter)
  const activeReciter = reciter || QIRAATH_RECITERS.find(r => r.id === reciterId);

  // Download state & downloaded set
  const [downloadInfo, setDownloadInfo] = useState(() =>
    getSurahDownloadStatus(activeReciter?.id, surah?.id)
  );
  const [downloadedSet, setDownloadedSet] = useState(() =>
    getDownloadedSurahIdsForReciter(activeReciter?.id)
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync download status whenever activeReciter or surah changes
  useEffect(() => {
    if (activeReciter?.id && surah?.id) {
      setDownloadInfo(getSurahDownloadStatus(activeReciter.id, surah.id));
      setDownloadedSet(getDownloadedSurahIdsForReciter(activeReciter.id));
    }
  }, [activeReciter?.id, surah?.id]);

  // Subscribe to live download progress events
  useEffect(() => {
    const currentKey = activeReciter?.id && surah?.id ? `${activeReciter.id}_${surah.id}` : null;
    const unsubscribe = subscribeToQiraathDownload((data) => {
      if (data.key === currentKey) {
        setDownloadInfo(prev => ({
          ...prev,
          status: data.status,
          progress: data.progress ?? prev.progress,
          fileSize: data.fileSize ?? data.totalBytes ?? prev.fileSize,
          formattedSize: data.formattedSize ?? prev.formattedSize,
          error: data.error,
        }));
      }
      if (activeReciter?.id) {
        setDownloadedSet(getDownloadedSurahIdsForReciter(activeReciter.id));
      }
    });
    return unsubscribe;
  }, [activeReciter?.id, surah?.id]);

  // Dismiss sleep modal on Android back button/gesture
  useEffect(() => {
    if (!showSleepModal) return undefined;
    const onBack = (e) => {
      e.preventDefault();
      setShowSleepModal(false);
    };
    window.addEventListener('pbuh:back', onBack);
    return () => window.removeEventListener('pbuh:back', onBack);
  }, [showSleepModal]);

  // Dismiss delete confirmation dialog on Android back button/gesture
  useEffect(() => {
    if (!showDeleteConfirm) return undefined;
    const onBack = (e) => {
      e.preventDefault();
      setShowDeleteConfirm(false);
    };
    window.addEventListener('pbuh:back', onBack);
    return () => window.removeEventListener('pbuh:back', onBack);
  }, [showDeleteConfirm]);

  const handleDownloadClick = async () => {
    if (!activeReciter || !surah) return;
    const status = downloadInfo.status;
    if (status === 'downloading') {
      if (window.confirm('Cancel current download?')) {
        await cancelSurahAudioDownload(activeReciter.id, surah.id);
      }
      return;
    }
    if (status === 'downloaded') {
      setShowDeleteConfirm(true);
      return;
    }
    try {
      await downloadSurahAudio(activeReciter, surah);
    } catch (err) {
      console.warn('[QiraathPlayer] Download error:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!activeReciter || !surah) return;
    setShowDeleteConfirm(false);
    await deleteSurahAudioDownload(activeReciter.id, surah.id);
  };

  // Next surah in list
  const currentIdx = surahList.findIndex(s => s?.id === surah?.id);
  const nextSurah  = currentIdx >= 0 && currentIdx < surahList.length - 1
    ? surahList[currentIdx + 1]
    : null;
  const prevSurah  = currentIdx > 0
    ? surahList[currentIdx - 1]
    : null;

  const handleSelectSurahFromQueue = useCallback((selectedSurah) => {
    if (!activeReciter || !selectedSurah) return;
    loadAndPlay(activeReciter, selectedSurah, surahList);
    setShowQueue(false);
  }, [activeReciter, surahList, loadAndPlay]);

  const filteredQueueSurahs = useMemo(() => {
    if (!queueSearch.trim()) return surahList;
    const q = queueSearch.toLowerCase();
    return surahList.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.nameArabic?.includes(queueSearch) ||
      String(s.id) === queueSearch.trim()
    );
  }, [surahList, queueSearch]);

  // Dismiss queue drawer on Android back button/gesture
  useEffect(() => {
    if (!showQueue) return undefined;
    const onBack = (e) => {
      e.preventDefault();
      setShowQueue(false);
    };
    window.addEventListener('pbuh:back', onBack);
    return () => window.removeEventListener('pbuh:back', onBack);
  }, [showQueue]);

  const handleSeek = useCallback((e) => {
    seekTo(Number(e.target.value));
  }, [seekTo]);

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else if (activeReciter?.id) {
      navigate(`/qiraath/${activeReciter.id}`);
    } else {
      navigate('/qiraath', { replace: true });
    }
  };

  // If no track loaded, show empty state with browse CTA
  if (!hasTrack) {
    return (
      <div className="qp-page" id="main-content">
        <div className="qp-header">
          <button className="qp-header-back" onClick={handleBack} aria-label="Back">
            <ArrowLeft size={18} />
          </button>
          <div className="qp-header-title-box">
            <span className="qp-header-title">Active Audio Player</span>
          </div>
          <button
            className="qp-header-action-btn"
            onClick={() => navigate('/qiraath')}
            title="All Reciters"
            aria-label="All Reciters"
          >
            <Mic2 size={20} />
          </button>
        </div>
        <div className="qp-no-track">
          <div className="qp-no-track-icon">🎧</div>
          <div className="qp-no-track-title">Nothing is playing yet</div>
          <div className="qp-no-track-sub">Choose a reciter and surah to start listening</div>
          <button
            className="qp-no-track-btn"
            onClick={() => navigate('/qiraath')}
            id="qp-browse-btn"
          >
            Browse Reciters
          </button>
        </div>
      </div>
    );
  }

  const isLoading = loading || buffering;

  const tamilName = surah?.id ? tamilSurahs[surah.id] : null;
  const rawRev = (surah?.revelationType || surah?.revelation_place || '').toLowerCase();
  const isMakki = rawRev === 'makkah' || rawRev === 'meccan';
  const isMadani = rawRev === 'madinah' || rawRev === 'medinan';
  const revelationLabel = isMakki ? 'Makki' : isMadani ? 'Madani' : (rawRev ? rawRev.charAt(0).toUpperCase() + rawRev.slice(1) : null);
  const ayahCount = surah?.verseCount || surah?.verses_count || null;

  return (
    <div className="qp-page" id="main-content">
      {/* ── Top header — Minimal & Editorial ── */}
      <div className="qp-header">
        <button className="qp-header-back" onClick={handleBack} aria-label="Go back" id="qp-back-btn">
          <ArrowLeft size={20} />
        </button>
        <div className="qp-header-title-box">
          <span className="qp-header-title">Active Audio Player</span>
          <span className="qp-header-sub">{activeReciter?.name}</span>
        </div>
        <div className="qp-header-actions">
          <button
            className="qp-header-action-btn"
            onClick={() => setShowQueue(true)}
            title="Surahs Queue"
            id="qp-queue-btn"
            aria-label="Surahs Queue"
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* ── Now reciting bar ── */}
      <div className="qp-now-bar">
        <button
          className="qp-now-collapse"
          onClick={() => navigate(`/qiraath/${activeReciter?.id}`)}
          aria-label="Back to surah list"
          title="Back to surah list"
        >
          <ChevronDown size={16} />
        </button>
        <div className="qp-now-info">
          <div className="qp-now-label">NOW RECITING</div>
          <div className="qp-now-surah">{surah?.name || '—'} • {surah?.nameArabic || ''}</div>
        </div>
        <button
          className="qp-now-queue"
          onClick={() => setShowQueue(true)}
          aria-label="Open surahs list"
          title="Switch Surah"
        >
          <List size={14} />
        </button>
      </div>


      {/* ── Quran Surah Info Card (Replaces reciter portrait) ── */}
      <div className="qp-surah-card" id="qp-surah-card">
        {/* Card Header: Metadata Badges */}
        <div className="qp-card-meta-row">
          <span className="qp-card-badge qp-badge-number">
            Surah {surah?.id}
          </span>
          {ayahCount && (
            <span className="qp-card-badge qp-badge-ayahs">
              {ayahCount} Ayahs
            </span>
          )}
          {revelationLabel && (
            <span className={`qp-card-badge ${isMakki ? 'qp-badge-gold' : 'qp-badge-emerald'}`}>
              🕌 {revelationLabel}
            </span>
          )}
          {downloadInfo.status === 'downloaded' && (
            <span className="qp-card-badge qp-badge-offline" title="Offline ready">
              ✓ Offline
            </span>
          )}
        </div>

        {/* Arabic Surah Name */}
        <div className="qp-card-arabic arabic-text notranslate" dir="rtl" translate="no" lang="ar">
          {surah?.nameArabic || '—'}
        </div>

        {/* English and Tamil Surah Names */}
        <div className="qp-card-names-row">
          <h2 className="qp-card-name-en">{surah?.name || '—'}</h2>
          {tamilName && (
            <span className="qp-card-name-ta" lang="ta">
              · {tamilName}
            </span>
          )}
        </div>

        {/* Reciter and Audio Quality indicator */}
        <div className="qp-card-footer-row">
          <div className="qp-card-reciter-info">
            <span className="qp-card-reciter-tag">RECITING</span>
            <span className="qp-card-reciter-name">
              {activeReciter?.name}
              {activeReciter?.nameTamil && (
                <span className="qp-card-reciter-ta"> · {activeReciter.nameTamil}</span>
              )}
            </span>
          </div>

          <div className="qp-card-audio-pill">
            <div className={`qp-card-audio-dot${playing ? ' is-active' : ''}`} />
            <span className="qp-card-audio-rate">320 kbps</span>
            <div className="qp-artwork-badge-bars" aria-hidden="true">
              <div className={`qp-bar${!playing ? ' paused' : ''}`} />
              <div className={`qp-bar${!playing ? ' paused' : ''}`} />
              <div className={`qp-bar${!playing ? ' paused' : ''}`} />
              <div className={`qp-bar${!playing ? ' paused' : ''}`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="qp-error-banner">
          <AlertCircle size={18} color="#ba1a1a" />
          <span className="qp-error-text">{error}</span>
          <button className="qp-retry-btn" onClick={retryPlay} id="qp-retry-btn">Retry</button>
        </div>
      )}

      {/* ── Buffering indicator ── */}
      {isLoading && !error && (
        <div className="qp-buffering">
          <div className="qp-spinner" />
          <span>Loading audio…</span>
        </div>
      )}

      {/* ── Seekbar ── */}
      <div className="qp-seek-wrap">
        <div className="qp-seek-track">
          <div className="qp-seek-fill" style={{ width: `${progress}%` }} />
          <div className="qp-seek-thumb" style={{ left: `${progress}%` }} />
          <input
            ref={seekRef}
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={handleSeek}
            className="qp-seek-input"
            aria-label="Seek"
            id="qp-seekbar"
          />
        </div>
        <div className="qp-seek-labels">
          <span>{fmt(currentTime)}</span>
          <span className="qp-seek-center">{surah?.name || ''}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* ── Controls (Sleep Timer, Play/Pause, Save) ── */}
      <div className="qp-controls">
        {/* Sleep Timer */}
        <button
          className={`qp-ctrl-aux qp-ctrl-sleep ${sleepTimer?.mode !== 'off' ? 'is-active' : ''}`}
          onClick={() => setShowSleepModal(true)}
          title={
            sleepTimer?.mode === 'time'
              ? `Sleep timer: ${Math.ceil(sleepTimer.remainingSeconds / 60)}m left • Tap to adjust`
              : sleepTimer?.mode === 'end_of_surah'
                ? 'Sleep timer: Stop at end of Surah • Tap to adjust'
                : 'Sleep Timer'
          }
          aria-label="Sleep timer"
          id="qp-sleep-timer-btn"
        >
          <Moon size={19} />
          {sleepTimer?.mode === 'time' && (
            <span className="qp-ctrl-aux-badge">
              {Math.ceil(sleepTimer.remainingSeconds / 60)}m
            </span>
          )}
          {sleepTimer?.mode === 'end_of_surah' && (
            <span className="qp-ctrl-aux-badge">End</span>
          )}
        </button>

        {/* Play / Pause Main Button */}
        <button
          className="qp-ctrl-play"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Resume'}
          title={playing ? 'Pause' : 'Resume'}
          id="qp-play-btn"
          disabled={!!error}
        >
          {isLoading
            ? <Loader2 size={28} className="qp-spin" />
            : playing
              ? <Pause size={28} fill="currentColor" />
              : <Play  size={28} fill="currentColor" style={{ marginLeft: 2 }} />}
        </button>

        {/* Download / Save Action */}
        <button
          className={`qp-ctrl-aux qp-ctrl-download state-${downloadInfo.status || 'none'}`}
          onClick={handleDownloadClick}
          title={
            downloadInfo.status === 'downloaded'
              ? `Downloaded (${downloadInfo.formattedSize || (downloadInfo.fileSize ? formatBytes(downloadInfo.fileSize) : 'Offline')}) • Tap to remove`
              : downloadInfo.status === 'downloading'
                ? `Downloading ${downloadInfo.progress}% • Tap to cancel`
                : downloadInfo.status === 'error'
                  ? `Download failed: ${downloadInfo.error || 'Tap to retry'}`
                  : 'Download Surah for offline listening'
          }
          aria-label="Download or manage offline audio"
          id="qp-download-btn"
        >
          {downloadInfo.status === 'downloading' ? (
            <div className="qp-ctrl-aux-progress">
              <Loader2 size={17} className="qp-spin" />
              {downloadInfo.progress > 0 && <span>{downloadInfo.progress}%</span>}
            </div>
          ) : downloadInfo.status === 'downloaded' ? (
            <CheckCircle2 size={20} color="#10b981" />
          ) : downloadInfo.status === 'error' ? (
            <AlertCircle size={20} color="#f87171" />
          ) : (
            <Download size={19} />
          )}
        </button>
      </div>

      {/* ── Compact Queue / Next bar ── */}
      <div className="qp-compact-queue-bar">
        <button
          className="qp-compact-queue-btn"
          onClick={() => setShowQueue(true)}
          id="qp-compact-queue-btn"
        >
          <List size={14} /> Surah Queue ({surahList.length || 114})
        </button>
        {nextSurah && (
          <button
            className="qp-compact-next-btn"
            onClick={playNext}
            title={`Next: ${nextSurah.name}`}
            id="qp-compact-next-btn"
          >
            <span>Next: {nextSurah.name}</span>
            <NextIcon size={13} />
          </button>
        )}
      </div>

      {/* ── In-Player Surah Queue Drawer ── */}
      {showQueue && (
        <>
          <div className="qp-queue-backdrop" onClick={() => setShowQueue(false)} />
          <div className="qp-queue-drawer" role="dialog" aria-label="Surah Playlist">
            <div className="qp-queue-header">
              <div className="qp-queue-header-title">
                <span>Surah Queue • சூராக்கள்</span>
                <small>{activeReciter?.name}</small>
              </div>
              <button
                className="qp-queue-close"
                onClick={() => setShowQueue(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search */}
            <div className="qp-queue-search">
              <Search size={14} color="#6b7f74" />
              <input
                className="qp-queue-search-input"
                placeholder="Search Surah in queue..."
                value={queueSearch}
                onChange={e => setQueueSearch(e.target.value)}
              />
              {queueSearch && (
                <button onClick={() => setQueueSearch('')} style={{ background: 'none', border: 'none', color: '#6b7f74', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>

            {/* List */}
            <div className="qp-queue-list">
              {filteredQueueSurahs.map(s => {
                const isCur = s.id === surah?.id;
                const isDownloaded = downloadedSet.has(s.id);
                return (
                  <button
                    key={s.id}
                    className={`qp-queue-item${isCur ? ' active' : ''}`}
                    onClick={() => handleSelectSurahFromQueue(s)}
                  >
                    <span className="qp-queue-item-num">{String(s.id).padStart(3, '0')}</span>
                    <div className="qp-queue-item-info">
                      <div className="qp-queue-item-name">{s.name}</div>
                      <div className="qp-queue-item-meta">
                        {s.verseCount} Ayahs
                        {isDownloaded && <span className="qp-queue-offline-tag"> · Saved offline</span>}
                      </div>
                    </div>
                    <span className="qp-queue-item-ar">{s.nameArabic}</span>
                    {isDownloaded && (
                      <CheckCircle2 size={13} color="#0e5c3a" style={{ marginLeft: 6, flexShrink: 0, opacity: 0.85 }} title="Downloaded" />
                    )}
                    {isCur && <Check size={16} color="#0e5c3a" style={{ marginLeft: 8 }} />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Remove Download Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="ios-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="ios-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="ios-confirm-content">
              <h4>Remove Download</h4>
              <p>
                Delete offline audio for <strong>Surah {surah?.name}</strong>?
                {downloadInfo.fileSize ? (
                  <>
                    <br />
                    <span style={{ fontSize: '11px', color: '#6b7f74' }}>
                      Reclaims {formatBytes(downloadInfo.fileSize)}
                    </span>
                  </>
                ) : null}
              </p>
            </div>
            <div className="ios-confirm-actions">
              <button className="ios-confirm-btn ios-btn-delete" onClick={handleConfirmDelete}>
                Delete Audio
              </button>
              <button className="ios-confirm-btn ios-btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                Keep Audio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Authentic iOS Action Sheet — Sleep Timer ── */}
      {showSleepModal && createPortal(
        <div className="ios-sheet-overlay" onClick={() => setShowSleepModal(false)}>
          <div className="ios-action-sheet" onClick={e => e.stopPropagation()}>
            {/* Options Group */}
            <div className="ios-sheet-group">
              <div className="ios-sheet-header">
                <div className="ios-sheet-title">SLEEP TIMER</div>
                <div className="ios-sheet-sub">Stop audio automatically • உறக்க நேரம்</div>
              </div>

              {[15, 30, 45, 60].map(mins => {
                const isSelected = sleepTimer?.mode === 'time' && sleepTimer.minutes === mins;
                return (
                  <button
                    key={mins}
                    className={`ios-sheet-item ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => {
                      startSleepTimer(mins);
                      setShowSleepModal(false);
                    }}
                  >
                    <span className="ios-sheet-item-label">{mins} Minutes</span>
                    {isSelected && <Check size={18} className="ios-sheet-check" />}
                  </button>
                );
              })}

              <button
                className={`ios-sheet-item ${sleepTimer?.mode === 'end_of_surah' ? 'is-selected' : ''}`}
                onClick={() => {
                  startSleepTimer('end_of_surah');
                  setShowSleepModal(false);
                }}
              >
                <span className="ios-sheet-item-label">End of Current Surah</span>
                {sleepTimer?.mode === 'end_of_surah' && <Check size={18} className="ios-sheet-check" />}
              </button>

              {sleepTimer?.mode !== 'off' && (
                <button
                  className="ios-sheet-item is-destructive"
                  onClick={() => {
                    cancelSleepTimer();
                    setShowSleepModal(false);
                  }}
                >
                  <span className="ios-sheet-item-label">Turn Off Timer</span>
                </button>
              )}
            </div>

            {/* Cancel Group */}
            <div className="ios-sheet-group ios-sheet-cancel-group">
              <button
                className="ios-sheet-item is-cancel"
                onClick={() => setShowSleepModal(false)}
              >
                <span className="ios-sheet-item-label">Cancel</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Spacer */}
      <div style={{ height: 24 }} />
    </div>
  );
}
