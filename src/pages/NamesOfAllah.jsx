import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pause, Play, RotateCw, Search, Sparkles, Square, Volume2 } from 'lucide-react';
import { NAMES_OF_ALLAH, getNameAudioUrl } from '../services/namesOfAllah';
import BackButton from '../components/ui/BackButton';
import './NamesOfAllah.css';

export default function NamesOfAllah() {
  const [query, setQuery] = useState('');
  const [playingNumber, setPlayingNumber] = useState(null);
  const [playbackMode, setPlaybackMode] = useState(null); // 'single' | 'all' | null
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [queuePosition, setQueuePosition] = useState(0);
  const [audioError, setAudioError] = useState('');

  const audioRef = useRef(null);
  const playbackRun = useRef(0);
  const queueIndex = useRef(0);
  const activeMode = useRef(null);
  const lastAttemptedIndex = useRef(null);

  const filteredNames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return NAMES_OF_ALLAH;
    return NAMES_OF_ALLAH.filter(({ arabic, transliteration, meaning, meaningTamil, number }) => (
      arabic.includes(query.trim()) ||
      transliteration.toLocaleLowerCase().includes(normalizedQuery) ||
      meaning.toLocaleLowerCase().includes(normalizedQuery) ||
      meaningTamil.includes(query.trim()) ||
      String(number) === normalizedQuery
    ));
  }, [query]);

  const currentPlayingName = useMemo(() => {
    if (!playingNumber) return null;
    return NAMES_OF_ALLAH.find(n => n.number === playingNumber) || null;
  }, [playingNumber]);

  // Completely halts any audio instance and resets playback state
  const stopPlayback = useCallback(() => {
    playbackRun.current += 1;
    activeMode.current = null;
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setPlayingNumber(null);
    setPlaybackMode(null);
    setIsPaused(false);
    setIsLoading(false);
    setQueuePosition(0);
  }, []);

  // Cleanup on component unmount to prevent leaks and rogue background audio
  useEffect(() => {
    return () => {
      playbackRun.current += 1;
      activeMode.current = null;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
    };
  }, []);

  // Plays a specific name by index (0-based)
  const playNameAtIndex = useCallback((index, mode, run) => {
    if (run !== playbackRun.current) return;
    const name = NAMES_OF_ALLAH[index];
    const audio = audioRef.current;
    if (!name || !audio) {
      stopPlayback();
      return;
    }

    queueIndex.current = index;
    lastAttemptedIndex.current = index;
    setQueuePosition(index + 1);
    setPlayingNumber(name.number);
    setIsPaused(false);
    setIsLoading(true);
    setAudioError('');

    const audioUrl = getNameAudioUrl(name.number);
    if (!audioUrl) {
      setIsLoading(false);
      setPlayingNumber(null);
      setPlaybackMode(null);
      activeMode.current = null;
      setAudioError('Audio source URL not available for this name.');
      return;
    }

    audio.src = audioUrl;
    audio.load();

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (run !== playbackRun.current) return;
          setIsLoading(false);
          setIsPaused(false);
        })
        .catch(err => {
          if (run !== playbackRun.current) return;
          if (err.name === 'AbortError') return; // Expected if user quickly stopped or changed track
          setIsLoading(false);
          setIsPaused(false);
          setPlayingNumber(null);
          setPlaybackMode(null);
          activeMode.current = null;
          setAudioError(
            navigator.onLine
              ? 'Arabic audio could not be played right now. Please try again.'
              : 'Your internet connection seems offline. Please check your connection and try again.'
          );
        });
    }
  }, [stopPlayback]);

  // Audio element event listeners
  const handleCanPlay = () => {
    setIsLoading(false);
  };

  const handleWaiting = () => {
    setIsLoading(true);
  };

  const handlePlaying = () => {
    setIsLoading(false);
    setIsPaused(false);
  };

  const handlePause = () => {
    if (playingNumber) {
      setIsPaused(true);
    }
  };

  const handleEnded = () => {
    const run = playbackRun.current;
    if (run !== playbackRun.current) return;

    if (activeMode.current === 'all' && queueIndex.current + 1 < NAMES_OF_ALLAH.length) {
      playNameAtIndex(queueIndex.current + 1, 'all', run);
    } else {
      setPlayingNumber(null);
      setPlaybackMode(null);
      setIsPaused(false);
      setIsLoading(false);
      setQueuePosition(0);
      activeMode.current = null;
    }
  };

  const handleError = () => {
    const run = playbackRun.current;
    if (run !== playbackRun.current) return;

    const audio = audioRef.current;
    const mediaErr = audio?.error;
    console.warn('[Diagnostics - NamesOfAllah Audio Error]:', mediaErr);

    setAudioError(
      navigator.onLine
        ? 'Arabic audio could not be played right now. Please try again.'
        : 'Your internet connection seems offline. Please check your connection and try again.'
    );
    setIsLoading(false);
    setIsPaused(false);
    setPlayingNumber(null);
    setPlaybackMode(null);
    activeMode.current = null;
  };

  // Toggle individual name card button
  const handleCardClick = (name) => {
    if (playingNumber === name.number) {
      togglePause();
      return;
    }

    stopPlayback();
    const run = ++playbackRun.current;
    setPlaybackMode('single');
    activeMode.current = 'single';
    playNameAtIndex(name.number - 1, 'single', run);
  };

  // Play All 99 sequentially
  const playAll = () => {
    stopPlayback();
    const run = ++playbackRun.current;
    setPlaybackMode('all');
    activeMode.current = 'all';
    playNameAtIndex(0, 'all', run);
  };

  // Toggle pause/resume
  const togglePause = () => {
    const audio = audioRef.current;
    if (!audio || !playingNumber) return;

    if (isPaused) {
      setIsLoading(true);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPaused(false);
            setIsLoading(false);
          })
          .catch(err => {
            setIsLoading(false);
            if (err.name !== 'AbortError') {
              console.warn('[Diagnostics - Resume Audio]:', err);
              setAudioError('Audio playback could not resume. Please try again.');
            }
          });
      }
    } else {
      audio.pause();
      setIsPaused(true);
      setIsLoading(false);
    }
  };

  // Retry playback if an error occurred
  const retryPlayback = () => {
    if (lastAttemptedIndex.current === null) return;
    const targetIdx = lastAttemptedIndex.current;
    const targetMode = activeMode.current || 'single';
    stopPlayback();
    const run = ++playbackRun.current;
    setPlaybackMode(targetMode);
    activeMode.current = targetMode;
    playNameAtIndex(targetIdx, targetMode, run);
  };

  return (
    <main className="page-wrapper fade-in" id="main-content">
      <div className="container names-page">
        <div className="app-top-nav">
          <BackButton fallback="/explore" label="Back" />
        </div>
        <header className="names-header">
          <span className="names-header-icon" aria-hidden="true"><Sparkles size={25} /></span>
          <h1>Allah's Beautiful Names</h1>
          <p className="tamil-text">அல்லாஹ்வின் அழகிய திருநாமங்கள்</p>
          <p className="names-note">
            Commonly circulated list of 99 names; translations are brief explanations and may vary.
          </p>
        </header>

        <section className="names-audio-panel" aria-label="Arabic name audio">
          <div className="names-audio-row">
            <span className="names-audio-label"><Volume2 size={17} aria-hidden="true" /> Arabic audio</span>
            <div className="names-audio-controls">
              {playbackMode ? (
                <>
                  <button className="btn btn-secondary" onClick={togglePause} aria-label={isPaused ? 'Resume playback' : 'Pause playback'}>
                    {isLoading ? (
                      <Loader2 size={15} className="icon-spin" aria-hidden="true" />
                    ) : isPaused ? (
                      <Play size={15} aria-hidden="true" />
                    ) : (
                      <Pause size={15} aria-hidden="true" />
                    )}
                    {isLoading ? 'Loading...' : isPaused ? 'Resume' : 'Pause'}
                  </button>
                  <button className="btn btn-ghost" onClick={stopPlayback} aria-label="Stop playback">
                    <Square size={14} fill="currentColor" aria-hidden="true" />
                    Stop
                  </button>
                </>
              ) : (
                <button className="btn btn-primary names-play-all" onClick={playAll} aria-label="Play all 99 names sequentially">
                  <Play size={15} fill="currentColor" aria-hidden="true" />
                  Play all 99
                </button>
              )}
            </div>
          </div>

          <p className="names-audio-status" aria-live="polite">
            {isLoading
              ? 'Loading Arabic audio...'
              : isPaused && currentPlayingName
                ? `Paused at ${currentPlayingName.transliteration} (${playbackMode === 'all' ? `${queuePosition} of 99` : `Name ${playingNumber}`})`
                : playbackMode === 'all' && currentPlayingName
                  ? `Playing ${queuePosition} of 99 — ${currentPlayingName.transliteration}`
                  : playbackMode === 'single' && currentPlayingName
                    ? `Playing name ${playingNumber} — ${currentPlayingName.transliteration}`
                    : 'Authentic Arabic recitation · requires internet'}
          </p>

          {audioError && (
            <div className="names-audio-error-wrap" role="alert">
              <p className="names-audio-error">{audioError}</p>
              <button type="button" className="btn-retry" onClick={retryPlayback} aria-label="Retry audio playback">
                <RotateCw size={12} aria-hidden="true" />
                Retry
              </button>
            </div>
          )}

          {/* Hidden HTML5 Audio element with native callbacks */}
          <audio
            ref={audioRef}
            preload="none"
            playsInline
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onPlaying={handlePlaying}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
          />
        </section>

        <label className="names-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search name or meaning..."
            aria-label="Search Allah's names"
          />
          <span>{filteredNames.length} / 99</span>
        </label>

        {filteredNames.length ? (
          <ol className="names-grid">
            {filteredNames.map(name => {
              const isPlayingThis = playingNumber === name.number;
              return (
                <li className={`name-card card${isPlayingThis ? ' is-playing' : ''}`} key={name.number}>
                  <span className="name-number">{String(name.number).padStart(2, '0')}</span>
                  <p className="name-arabic arabic-text" lang="ar" dir="rtl">{name.arabic}</p>
                  <h2>{name.transliteration}</h2>
                  <p className="name-meaning tamil-text">{name.meaningTamil}</p>
                  <p className="name-meaning-english">{name.meaning}</p>
                  <button
                    className="name-play-button"
                    type="button"
                    onClick={() => handleCardClick(name)}
                    aria-label={
                      isPlayingThis
                        ? isPaused
                          ? `Resume ${name.transliteration}`
                          : `Pause ${name.transliteration}`
                        : `Play ${name.transliteration} in Arabic`
                    }
                  >
                    {isPlayingThis && isLoading ? (
                      <Loader2 size={15} className="icon-spin" aria-hidden="true" />
                    ) : isPlayingThis && !isPaused ? (
                      <Pause size={15} aria-hidden="true" />
                    ) : isPlayingThis && isPaused ? (
                      <Play size={15} aria-hidden="true" />
                    ) : (
                      <Volume2 size={15} aria-hidden="true" />
                    )}
                    {isPlayingThis
                      ? isLoading
                        ? 'Loading...'
                        : isPaused
                          ? 'Resume'
                          : 'Pause'
                      : 'Listen'}
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="names-empty">No names match your search. Try another name or meaning.</p>
        )}

        <p className="names-reference">Quran 7:180 · Quran 17:110 · Quran 59:22-24</p>
      </div>
    </main>
  );
}
