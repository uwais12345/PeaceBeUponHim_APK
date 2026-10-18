import './PageLoading.css';

export default function PageLoading({ message = 'Loading content...' }) {
  return (
    <div className="page-loading-wrapper" role="status" aria-live="polite">
      <div className="page-loading-logo-wrap">
        <img
          src="/channels4_profile.jpg"
          alt="Peace Be Upon Him Logo"
          className="page-loading-logo"
        />
      </div>
      <p className="page-loading-text">{message}</p>
    </div>
  );
}

