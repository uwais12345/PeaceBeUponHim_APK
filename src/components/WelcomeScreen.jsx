import mosqueImage from '../assets/kaaba-splash.jpg';
import './WelcomeScreen.css';

export default function WelcomeScreen({ error = null, onRetry = null, isFading = false }) {
  return (
    <main
      className={`welcome-screen ${isFading ? 'welcome-screen-fadeout' : ''}`}
      aria-labelledby="welcome-title"
    >
      <div className="welcome-hero" aria-hidden="true">
        <img
          src={mosqueImage}
          alt="The Holy Kaaba"
          loading="eager"
          decoding="sync"
          fetchpriority="high"
        />
        <div className="welcome-vignette" />
      </div>

      <section className="welcome-content">
        <div className="welcome-brand">
          <img
            src="/channels4_profile.jpg"
            alt="Peace Be Upon Him Logo"
            className="welcome-logo"
            width="68"
            height="68"
            loading="eager"
            decoding="sync"
            fetchpriority="high"
          />
          <h2 className="welcome-app-name">Peace Be Upon Him</h2>
        </div>
        <h1 id="welcome-title">Assalamu Alaikum!</h1>
        <p>Your Muslim Lifestyle Companion</p>
        {error ? (
          <div className="welcome-error-wrap">
            <p className="welcome-error-msg">{error}</p>
            <button
              type="button"
              className="welcome-start welcome-retry-btn"
              onClick={onRetry}
              aria-label="Retry initialization"
            >
              Retry
            </button>
          </div>
        ) : (
          <div
            className="welcome-start welcome-loading-badge"
            role="status"
            aria-live="polite"
            aria-label="Loading application"
          >
            <span className="welcome-spinner" aria-hidden="true" />
            <span>Loading...</span>
          </div>
        )}
      </section>
    </main>
  );
}
