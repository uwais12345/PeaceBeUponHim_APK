import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker safely for Offline PWA support
try {
  registerSW({ immediate: true });
} catch (e) {
  console.warn('PWA service worker skipped:', e);
}

// Import design system and global styles
import './styles/variables.css';
import './styles/global.css';
import './styles/responsive.css';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('Peace Be Upon Him uncaught render error:', error, errorInfo);
  }
  handleReload = () => {
    try {
      // Prevent reload loops: track recent reloads
      const now = Date.now();
      const lastReload = parseInt(sessionStorage.getItem('pbuh_last_err_reload') || '0', 10);
      if (now - lastReload < 4000) {
        // Repeated immediate crash: clear temporary session storage before reloading
        sessionStorage.clear();
      } else {
        sessionStorage.setItem('pbuh_last_err_reload', String(now));
      }
    } catch {}
    window.location.reload();
  };
  render() {
    if (this.state.hasError) {
      const isDev = Boolean(import.meta.env && import.meta.env.DEV);
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a1f0a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem', color: '#10b981' }}>Peace Be Upon Him</h2>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', maxWidth: '320px', lineHeight: 1.5 }}>
            Something went wrong while displaying this screen. Tap below to reload.
          </p>
          {isDev && this.state.error && (
            <pre style={{
              textAlign: 'left',
              color: '#f87171',
              background: '#182818',
              padding: '1rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              maxWidth: '90vw',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap',
              marginTop: '1rem',
              border: '1px solid #2d5a27'
            }}>
              {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
