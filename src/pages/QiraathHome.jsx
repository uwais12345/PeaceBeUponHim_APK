import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Clock, Shuffle, ChevronRight, Lightbulb, ArrowLeft,
} from 'lucide-react';
import { QIRAATH_RECITERS, loadRecentSurah, loadRecentReciterId } from '../services/qiraath';
import { useQiraathPlayback } from '../context/QiraathContext';
import ReciterAvatar from '../components/qiraath/ReciterAvatar';
import './Qiraath.css';


const VERSE_REMINDER = {
  text: '"The best among you are those who learn the Quran and teach it."',
  source: 'Sahih Al-Bukhari 5027',
};

function ReciterSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="qiraath-skeleton-card">
          <div className="qiraath-skeleton-circle" />
          <div className="qiraath-skeleton-line" style={{ width: '70%' }} />
          <div className="qiraath-skeleton-line" style={{ width: '50%' }} />
          <div className="qiraath-skeleton-line" style={{ width: '40%', marginTop: 14 }} />
        </div>
      ))}
    </>
  );
}

export default function QiraathHome() {
  const navigate = useNavigate();
  const { hasTrack, reciter, surah } = useQiraathPlayback();
  const [recent, setRecent] = useState(null);
  const [recentReciter, setRecentReciter] = useState(null);

  // Load recent listening history
  useEffect(() => {
    const history = loadRecentSurah();
    const lastId  = loadRecentReciterId();
    if (history.length && lastId) {
      const rec = QIRAATH_RECITERS.find(r => r.id === lastId);
      if (rec) {
        setRecentReciter(rec);
        setRecent(history.find(h => h.reciterId === lastId) || history[0]);
      }
    }
  }, []);

  const handleExplore = () => {
    // Navigate to first reciter profile
    navigate(`/qiraath/${QIRAATH_RECITERS[0].id}`);
  };

  const handleReciterCard = (reciterObj) => {
    navigate(`/qiraath/${reciterObj.id}`);
  };

  const handleReciterPlay = useCallback((e, reciterObj) => {
    e.stopPropagation();
    navigate(`/qiraath/${reciterObj.id}`);
  }, [navigate]);

  const handleContinue = () => {
    if (hasTrack && continueReciter) {
      navigate(`/qiraath/${continueReciter.id}/player`);
    } else if (recentReciter) {
      navigate(`/qiraath/${recentReciter.id}`);
    }
  };

  // Display current track info in continue bar if something is playing
  const continueReciter = reciter || recentReciter;
  const continueSurah   = surah;
  const showContinue    = hasTrack || (recentReciter && recent);

  return (
    <main className="qiraath-page" id="main-content">
      {/* ── Hero ── */}
      <div className="qiraath-hero">
        <div className="qiraath-profile-nav-top">
          <button
            className="qiraath-profile-back"
            onClick={() => navigate('/')}
            id="qiraath-home-back"
            aria-label="Back"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        <div className="qiraath-hero-badge">
          குர்ஆன் ஓதுதல் • QIRAATH
        </div>
        <h1 className="qiraath-hero-title">Listen to Holy Quran</h1>
        <div className="qiraath-hero-actions">
          <button className="qiraath-btn-primary" onClick={handleExplore} id="qiraath-explore-btn">
            <Play size={14} fill="currentColor" /> Explore Reciters
          </button>
          {recent && (
            <button className="qiraath-btn-ghost" onClick={() => navigate(`/qiraath/${recentReciter?.id}`)} id="qiraath-recent-btn">
              <Clock size={14} /> Recent
            </button>
          )}
        </div>
      </div>

      {/* ── Continue bar ── */}
      {showContinue && (
        <div
          className="qiraath-continue"
          role="button"
          tabIndex={0}
          onClick={handleContinue}
          onKeyDown={e => e.key === 'Enter' && handleContinue()}
          id="qiraath-continue-bar"
        >
          <ReciterAvatar
            src={continueReciter?.photo}
            name={continueReciter?.name}
            size={42}
            priority={true}
            className="qiraath-continue-img"
          />
          <div className="qiraath-continue-info">
            <div className="qiraath-continue-label">
              {hasTrack ? '▶ இப்போது கேட்கிறது • Now Playing' : '↺ தொடர்ந்து கேட்க • Continue'}
            </div>
            <div className="qiraath-continue-title">
              {continueSurah?.name || `Surah Al-Kahf`}
            </div>
            <div className="qiraath-continue-sub">
              {continueReciter?.name} • {continueReciter?.nameArabic}
            </div>
            <div className="qiraath-continue-progress">
              <div className="qiraath-continue-progress-bar" style={{ width: '35%' }} />
            </div>
          </div>
          <ChevronRight size={18} color="#6b7f74" />
        </div>
      )}

      {/* ── Reciters grid ── */}
      <div className="qiraath-section">
        <div className="qiraath-section-header">
          <h2 className="qiraath-section-title">
            பிரபல காரிகள் <span>| Top Reciters</span>
          </h2>
          <span className="qiraath-see-all">முழுபட்டியல் <ChevronRight size={12} /></span>
        </div>

        <div className="qiraath-reciter-grid">
          {QIRAATH_RECITERS.map((rec, index) => (
            <div
              key={rec.id}
              className="qiraath-reciter-card"
              role="button"
              tabIndex={0}
              onClick={() => handleReciterCard(rec)}
              onKeyDown={e => e.key === 'Enter' && handleReciterCard(rec)}
              id={`qiraath-reciter-${rec.id}`}
            >
              <span className="qiraath-reciter-card-badge">{rec.badge}</span>

              <div className="qiraath-reciter-photo-wrap">
                <ReciterAvatar
                  src={rec.photo}
                  name={rec.name}
                  size={56}
                  priority={index < 4}
                  className="qiraath-reciter-photo"
                />
                {rec.verified && (
                  <span className="qiraath-reciter-verified" aria-label="Verified">✓</span>
                )}
              </div>

              <div className="qiraath-reciter-name">{rec.name}</div>
              <div className="qiraath-reciter-name-ar">{rec.nameArabic}</div>
              <div className="qiraath-reciter-role">{rec.role}</div>

              <div className="qiraath-reciter-footer">
                <span className="qiraath-reciter-count">{rec.surahCount} சூரா</span>
                <button
                  className="qiraath-reciter-play-btn"
                  aria-label={`Play ${rec.name}`}
                  onClick={e => handleReciterPlay(e, rec)}
                  id={`qiraath-play-${rec.id}`}
                >
                  <Play size={13} fill="currentColor" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Verse reminder ── */}
      <div className="qiraath-verse-reminder">
        <div className="qiraath-verse-icon">
          <Lightbulb size={16} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="qiraath-verse-label">இன்றைய சிந்தனை • Verse Reminder</div>
          <div className="qiraath-verse-text">{VERSE_REMINDER.text}</div>
          <div className="qiraath-verse-source">{VERSE_REMINDER.source}</div>
        </div>
      </div>
    </main>
  );
}
