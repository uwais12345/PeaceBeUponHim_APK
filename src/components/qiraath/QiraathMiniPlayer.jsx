import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Play, Pause, SkipBack, SkipForward, Loader2, X } from 'lucide-react';
import { useQiraath } from '../../context/QiraathContext';
import ReciterAvatar from './ReciterAvatar';

/**
 * Persistent mini-player that appears at the bottom of the screen
 * whenever a Qiraath track is loaded.
 * - Tapping the info/artwork opens the full player page
 * - Hidden on the full player page itself
 * - Small close button hides the player without stopping audio playback
 * - Reappears when navigating to/from the player or playing another track
 */
export default function QiraathMiniPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    hasTrack, reciter, surah,
    playing, loading, buffering, progress,
    togglePlay, playNext, playPrev,
  } = useQiraath();

  const [isDismissed, setIsDismissed] = useState(false);
  const [isClosing, setIsClosing]     = useState(false);

  // Reappear when a new track/surah is selected
  const surahId = surah?.id;
  useEffect(() => {
    setIsDismissed(false);
    setIsClosing(false);
  }, [surahId]);

  // Reappear through existing player navigation (visiting full player)
  const onPlayerPage = location.pathname.includes('/player');
  useEffect(() => {
    if (onPlayerPage) {
      setIsDismissed(false);
      setIsClosing(false);
    }
  }, [onPlayerPage]);

  // Listen to custom show event if dispatched anywhere in the app
  useEffect(() => {
    const handleShow = () => {
      setIsDismissed(false);
      setIsClosing(false);
    };
    window.addEventListener('qiraath-show-mini-player', handleShow);
    return () => window.removeEventListener('qiraath-show-mini-player', handleShow);
  }, []);

  const onMushafPage = location.pathname.includes('/mushaf/page');
  if (!hasTrack || onPlayerPage || onMushafPage || isDismissed) return null;

  const handleOpenPlayer = () => {
    if (reciter) navigate(`/qiraath/${reciter.id}/player`);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsDismissed(true);
      setIsClosing(false);
    }, 240);
  };

  const isLoading = loading || buffering;

  return (
    <div
      className={`qiraath-mini-player${isClosing ? ' is-closing' : ''}`}
      role="region"
      aria-label="Now playing"
      id="qiraath-mini-player"
    >
        {/* Small neat × close button (no background circle) */}
      <button
        type="button"
        className="qiraath-mini-close-btn"
        onClick={handleClose}
        aria-label="Close mini player"
        title="Close mini player"
        id="qiraath-mini-close"
      >
        <X size={12} strokeWidth={2.4} />
      </button>
      {/* Artwork — taps open full player */}
      <ReciterAvatar
        src={reciter?.photo}
        name={reciter?.name}
        size={42}
        priority={true}
        className="qiraath-mini-player-img"
        onClick={handleOpenPlayer}
        style={{ cursor: 'pointer' }}
      />

      {/* Track info — taps open full player */}
      <div
        className="qiraath-mini-player-info"
        onClick={handleOpenPlayer}
        style={{ cursor: 'pointer' }}
      >
        <div className="qiraath-mini-player-title">
          {surah?.name || '—'}
        </div>
        <div className="qiraath-mini-player-sub">
          {reciter?.name}
        </div>
      </div>

      {/* Controls */}
      <div className="qiraath-mini-player-controls">
        <button
          className="qiraath-mini-ctrl-btn"
          onClick={playPrev}
          aria-label="Previous surah"
          id="qiraath-mini-prev"
        >
          <SkipBack size={16} />
        </button>

        <button
          className="qiraath-mini-play-btn"
          onClick={togglePlay}
          aria-label={playing ? 'Pause' : 'Play'}
          id="qiraath-mini-play"
        >
          {isLoading
            ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            : playing
              ? <Pause size={16} fill="currentColor" />
              : <Play  size={16} fill="currentColor" />}
        </button>

        <button
          className="qiraath-mini-ctrl-btn"
          onClick={playNext}
          aria-label="Next surah"
          id="qiraath-mini-next"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="qiraath-mini-progress" aria-hidden="true">
        <div
          className="qiraath-mini-progress-bar"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
