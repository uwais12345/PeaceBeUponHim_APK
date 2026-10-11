import { useEffect } from 'react';
import mosqueImage from '../assets/kaaba-splash.jpg';
import './WelcomeScreen.css';

export default function WelcomeScreen({ onGetStarted }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onGetStarted();
    }, 1800);
    return () => clearTimeout(timer);
  }, [onGetStarted]);

  return (
    <main className="welcome-screen" aria-labelledby="welcome-title">
      <div className="welcome-hero" aria-hidden="true">
        <img src={mosqueImage} alt="The Holy Kaaba" />
        <div className="welcome-vignette" />
      </div>

      <section className="welcome-content">
        <div className="welcome-brand">
          <img src="/channels4_profile.jpg" alt="Peace Be Upon Him Logo" className="welcome-logo" />
          <h2 className="welcome-app-name">Peace Be Upon Him</h2>
        </div>
        <h1 id="welcome-title">Assalamu Alaikum!</h1>
        <p>Your Muslim Lifestyle Companion</p>
        <button
          type="button"
          className="welcome-start"
          onClick={onGetStarted}
          aria-label="Continue to Home"
        >
          <span className="welcome-spinner" /> Loading...
        </button>
        <div className="welcome-home-indicator" aria-hidden="true">
          <span />
        </div>
      </section>
    </main>
  );
}
