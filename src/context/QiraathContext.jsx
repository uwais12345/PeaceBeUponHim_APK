import { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { saveRecentSurah, saveRecentReciterId, QIRAATH_RECITERS } from '../services/qiraath';
import { getPlayableAudioUrl } from '../services/qiraathDownload';

// ============================================================
// QIRAATH AUDIO CONTEXT
// Central singleton audio player — prevents multiple tracks
// playing simultaneously across route changes.
// ============================================================

const QiraathPlaybackContext = createContext(null);
const QiraathProgressContext = createContext(null);
export const QiraathContext = QiraathPlaybackContext;

export function QiraathProvider({ children }) {
  const audioRef = useRef(null);
  const blobUrlRef = useRef(null);

  // Current track state
  const [reciter, setReciter]       = useState(null);
  const [surah, setSurah]           = useState(null);
  const [surahList, setSurahList]   = useState([]);   // full ordered list for prev/next

  // Playback state
  const [playing, setPlaying]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [buffering, setBuffering]   = useState(false);
  const [error, setError]           = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration]     = useState(0);
  const [progress, setProgress]     = useState(0);

  // Sleep Timer state
  const [sleepTimer, setSleepTimer] = useState({
    mode: 'off', // 'off' | 'time' | 'end_of_surah'
    minutes: 0,
    targetTimestamp: null,
    remainingSeconds: 0,
  });
  const sleepTimerRef = useRef(sleepTimer);
  useEffect(() => {
    sleepTimerRef.current = sleepTimer;
  }, [sleepTimer]);

  // Bootstrap audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;
    if (typeof window !== 'undefined') window.__qiraathAudio = audio;

    const onTimeUpdate  = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onDuration    = () => setDuration(audio.duration || 0);
    const onPlaying     = () => { setPlaying(true); setLoading(false); setBuffering(false); setError(null); };
    const onPause       = () => setPlaying(false);
    const onWaiting     = () => setBuffering(true);
    const onCanPlay     = () => setBuffering(false);
    const onEnded       = () => {
      setPlaying(false);
      const curTimer = sleepTimerRef.current;
      if (curTimer.mode === 'end_of_surah') {
        setSleepTimer({ mode: 'off', minutes: 0, targetTimestamp: null, remainingSeconds: 0 });
        return;
      }
      advanceToNext();
    };
    const onError       = () => {
      setLoading(false);
      setBuffering(false);
      setPlaying(false);
      setError('Unable to load audio. Please check your connection and try again.');
    };
    const onLoadStart   = () => { setLoading(true); setError(null); };
    const onLoadedData  = () => setLoading(false);

    // Speed control — dispatched by QiraathPlayer speed button
    const onSpeedChange = (e) => {
      if (audio) audio.playbackRate = e.detail || 1.0;
    };
    window.addEventListener('qiraath-speed', onSpeedChange);

    audio.addEventListener('timeupdate',  onTimeUpdate);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('playing',     onPlaying);
    audio.addEventListener('pause',       onPause);
    audio.addEventListener('waiting',     onWaiting);
    audio.addEventListener('canplay',     onCanPlay);
    audio.addEventListener('ended',       onEnded);
    audio.addEventListener('error',       onError);
    audio.addEventListener('loadstart',   onLoadStart);
    audio.addEventListener('loadeddata',  onLoadedData);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate',     onTimeUpdate);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('playing',        onPlaying);
      audio.removeEventListener('pause',          onPause);
      audio.removeEventListener('waiting',        onWaiting);
      audio.removeEventListener('canplay',        onCanPlay);
      audio.removeEventListener('ended',          onEnded);
      audio.removeEventListener('error',          onError);
      audio.removeEventListener('loadstart',      onLoadStart);
      audio.removeEventListener('loadeddata',     onLoadedData);
      window.removeEventListener('qiraath-speed', onSpeedChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // advanceToNext in a ref so the event handler always has the latest surahList/surah
  const surahListRef = useRef(surahList);
  const surahRef     = useRef(surah);
  const reciterRef   = useRef(reciter);
  useEffect(() => { surahListRef.current = surahList; }, [surahList]);
  useEffect(() => { surahRef.current     = surah;     }, [surah]);
  useEffect(() => { reciterRef.current   = reciter;   }, [reciter]);

  // MediaSession API integration for Android notification / lock-screen controls
  useEffect(() => {
    try {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !window.MediaMetadata) return;
      if (!surah || !reciter) {
        try { navigator.mediaSession.playbackState = 'none'; } catch { /* ignore */ }
        return;
      }

      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: surah.nameSimple || surah.name || `Surah ${surah.id}`,
        artist: reciter.name || 'Qari',
        album: 'Peace Be Upon Him — Al-Quran',
        artwork: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      });
    } catch {
      // ignore on unsupported WebViews
    }
  }, [surah, reciter]);

  useEffect(() => {
    try {
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
      navigator.mediaSession.playbackState = playing ? 'playing' : (surah ? 'paused' : 'none');
    } catch {
      // ignore on unsupported WebViews
    }
  }, [playing, surah]);

  const advanceToNext = useCallback(() => {
    const list = surahListRef.current;
    const cur  = surahRef.current;
    const rec  = reciterRef.current;
    if (!list.length || !cur || !rec) return;
    const idx = list.findIndex(s => s.id === cur.id);
    if (idx < 0 || idx >= list.length - 1) return;
    loadAndPlay(rec, list[idx + 1], list);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load a surah and start playing.
   * @param {object} rec   - reciter object from QIRAATH_RECITERS
   * @param {object} s     - surah object { id, name, audioUrl, ... }
   * @param {array}  list  - full ordered surah list for prev/next
   */
  const loadAndPlay = useCallback((rec, s, list = []) => {
    const audio = audioRef.current;
    if (!audio) return;

    // Stop current playback
    audio.pause();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
    setError(null);
    setLoading(true);

    setReciter(rec);
    setSurah(s);
    if (list.length) setSurahList(list);

    // Persist history
    saveRecentSurah(rec.id, s.id, 0);
    saveRecentReciterId(rec.id);

    // Prefer local offline audio file if available; otherwise stream remote CDN URL
    getPlayableAudioUrl(rec.id, s.id, s.audioUrl)
      .then(playableUrl => {
        // Prevent race condition if user quickly clicked another track
        if (surahRef.current?.id !== s.id || reciterRef.current?.id !== rec.id) return;

        // Revoke prior blob URL if any
        if (blobUrlRef.current && blobUrlRef.current.startsWith('blob:')) {
          try { URL.revokeObjectURL(blobUrlRef.current); } catch {}
          blobUrlRef.current = null;
        }
        if (playableUrl.startsWith('blob:')) {
          blobUrlRef.current = playableUrl;
        }

        audio.src = playableUrl;
        audio.currentTime = 0;
        audio.load();

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay blocked — user needs to press play manually
            setLoading(false);
            setPlaying(false);
          });
        }
      })
      .catch(() => {
        audio.src = s.audioUrl;
        audio.currentTime = 0;
        audio.load();
        audio.play().catch(() => {
          setLoading(false);
          setPlaying(false);
        });
      });
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play().catch(() => setError('Playback blocked. Tap play again.'));
    } else {
      audio.pause();
    }
  }, []);

  const seekTo = useCallback((percent) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    audio.currentTime = (percent / 100) * audio.duration;
  }, []);

  const skipSeconds = useCallback((secs) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration || 0, audio.currentTime + secs));
  }, []);

  const playNext = useCallback(() => {
    const list = surahListRef.current;
    const cur  = surahRef.current;
    const rec  = reciterRef.current;
    if (!list.length || !cur || !rec) return;
    const idx = list.findIndex(s => s.id === cur.id);
    if (idx >= 0 && idx < list.length - 1) loadAndPlay(rec, list[idx + 1], list);
  }, [loadAndPlay]);

  const playPrev = useCallback(() => {
    const list = surahListRef.current;
    const cur  = surahRef.current;
    const rec  = reciterRef.current;
    if (!list.length || !cur || !rec) return;
    const idx = list.findIndex(s => s.id === cur.id);
    if (idx > 0) loadAndPlay(rec, list[idx - 1], list);
  }, [loadAndPlay]);

  const retryPlay = useCallback(() => {
    const rec = reciterRef.current;
    const s   = surahRef.current;
    const list = surahListRef.current;
    if (rec && s) loadAndPlay(rec, s, list);
  }, [loadAndPlay]);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.src = '';
    setPlaying(false);
    setReciter(null);
    setSurah(null);
    setSurahList([]);
    setCurrentTime(0);
    setDuration(0);
    setProgress(0);
    setError(null);
  }, []);

  const hasTrack = !!(reciter && surah);

  // Wire MediaSession remote control buttons
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const setAction = (action, handler) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // unsupported action in this browser/device
      }
    };

    setAction('play', () => togglePlay());
    setAction('pause', () => togglePlay());
    setAction('previoustrack', () => playPrev());
    setAction('nexttrack', () => playNext());
    setAction('seekbackward', (details) => skipSeconds(-(details?.seekOffset || 10)));
    setAction('seekforward', (details) => skipSeconds(details?.seekOffset || 10));
    setAction('seekto', (details) => {
      if (audioRef.current && details?.seekTime !== undefined) {
        audioRef.current.currentTime = details.seekTime;
      }
    });

    return () => {
      ['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto'].forEach(action => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      });
    };
  }, [togglePlay, playPrev, playNext, skipSeconds]);

  // Sleep Timer Countdown & Gentle Fade-out
  useEffect(() => {
    if (sleepTimer.mode !== 'time' || !sleepTimer.targetTimestamp) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = sleepTimer.targetTimestamp - now;
      const remaining = Math.max(0, Math.ceil(diffMs / 1000));

      const audio = audioRef.current;
      // Gentle fade out in the last 10 seconds before stopping
      if (audio && remaining <= 10 && remaining > 0) {
        audio.volume = Math.max(0.05, remaining / 10);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        if (audio) {
          audio.pause();
          audio.volume = 1.0;
        }
        setPlaying(false);
        setSleepTimer({ mode: 'off', minutes: 0, targetTimestamp: null, remainingSeconds: 0 });
      } else {
        setSleepTimer(prev => ({ ...prev, remainingSeconds: remaining }));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimer.mode, sleepTimer.targetTimestamp]);

  const startSleepTimer = useCallback((option) => {
    const audio = audioRef.current;
    if (audio) audio.volume = 1.0;

    if (option === 'off') {
      setSleepTimer({ mode: 'off', minutes: 0, targetTimestamp: null, remainingSeconds: 0 });
      return;
    }
    if (option === 'end_of_surah') {
      setSleepTimer({
        mode: 'end_of_surah',
        minutes: 0,
        targetTimestamp: null,
        remainingSeconds: 0,
      });
      return;
    }
    const mins = Number(option);
    if (!isNaN(mins) && mins > 0) {
      const target = Date.now() + mins * 60 * 1000;
      setSleepTimer({
        mode: 'time',
        minutes: mins,
        targetTimestamp: target,
        remainingSeconds: mins * 60,
      });
    }
  }, []);

  const cancelSleepTimer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = 1.0;
    setSleepTimer({ mode: 'off', minutes: 0, targetTimestamp: null, remainingSeconds: 0 });
  }, []);

  const progressValue = useMemo(() => ({
    currentTime,
    duration,
    progress,
  }), [currentTime, duration, progress]);

  const playbackValue = useMemo(() => ({
    reciter, surah, surahList,
    playing, loading, buffering, error,
    hasTrack,
    sleepTimer,
    startSleepTimer,
    cancelSleepTimer,
    loadAndPlay,
    togglePlay,
    seekTo,
    skipSeconds,
    playNext,
    playPrev,
    retryPlay,
    stop,
  }), [
    reciter, surah, surahList,
    playing, loading, buffering, error,
    hasTrack,
    sleepTimer,
    startSleepTimer,
    cancelSleepTimer,
    loadAndPlay,
    togglePlay,
    seekTo,
    skipSeconds,
    playNext,
    playPrev,
    retryPlay,
    stop,
  ]);

  return (
    <QiraathPlaybackContext.Provider value={playbackValue}>
      <QiraathProgressContext.Provider value={progressValue}>
        {children}
      </QiraathProgressContext.Provider>
    </QiraathPlaybackContext.Provider>
  );
}

// Hook for pages that only need track and playback state (QiraathHome, QiraathProfile, etc.)
// DOES NOT re-render on high-frequency timeupdate ticks!
export function useQiraathPlayback() {
  const ctx = useContext(QiraathPlaybackContext);
  if (!ctx) throw new Error('useQiraathPlayback must be inside QiraathProvider');
  return ctx;
}

// Hook for components that only need progress/scrubbing (scrubber, progress bar)
export function useQiraathProgress() {
  const ctx = useContext(QiraathProgressContext);
  if (!ctx) throw new Error('useQiraathProgress must be inside QiraathProvider');
  return ctx;
}

// Combined hook for full player (QiraathPlayer, QiraathMiniPlayer)
export function useQiraath() {
  const playback = useContext(QiraathPlaybackContext);
  const progress = useContext(QiraathProgressContext);
  if (!playback) throw new Error('useQiraath must be inside QiraathProvider');
  return { ...playback, ...progress };
}
