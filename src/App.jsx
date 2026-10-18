import { useEffect, useState, useRef, useCallback } from 'react';
import { Routes, Route, useLocation, useNavigate, useNavigationType, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SplashScreen } from '@capacitor/splash-screen';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Providers
import {
  LanguageProvider,
  ThemeProvider,
  QuranAudioSettingsProvider,
  BookmarkProvider,
  SearchProvider,
} from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { QiraathProvider } from './context/QiraathContext';
import { NetworkProvider } from './context/NetworkContext';

// Shared Components
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import QiraathMiniPlayer from './components/qiraath/QiraathMiniPlayer';
import NetworkStatusIndicator from './components/ui/NetworkStatusIndicator';
import { AppNavigationTracker, performAppBack } from './hooks/useAppNavigation';
// AuthModal removed — no login required

import { Suspense, lazy } from 'react';
import PageLoading from './components/ui/PageLoading';
// Pages — Home is statically imported so the initial route renders instantly
import Home from './pages/Home';
import WelcomeScreen from './components/WelcomeScreen';

// Quran Pages
const QuranIndex = lazy(() => import('./pages/Quran').then(m => ({ default: m.QuranIndex })));
const QuranSurah = lazy(() => import('./pages/Quran').then(m => ({ default: m.QuranSurah })));
const MushafJuzIndex = lazy(() => import('./pages/MushafJuzIndex'));
const MushafReader = lazy(() => import('./pages/MushafReader'));
const HadithIndex = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithIndex })));
const HadithCollection = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithCollection })));
const HadithCategoryDetail = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithCategoryDetail })));
const HadithSearchPage = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithSearchPage })));
const HadithBook = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithBook })));
const Dua = lazy(() => import('./pages/Dua'));
const Dhikr = lazy(() => import('./pages/Dhikr'));
const DailyInspiration = lazy(() => import('./pages/DailyInspiration'));
const Explore = lazy(() => import('./pages/Explore'));
const Library = lazy(() => import('./pages/Library'));
const About = lazy(() => import('./pages/About'));
const AfterSalah = lazy(() => import('./pages/AfterSalah'));
const Settings = lazy(() => import('./pages/Settings'));
const NearbyMasjids = lazy(() => import('./pages/NearbyMasjids'));
const Lessons = lazy(() => import('./pages/Lessons'));
const NamesOfAllah = lazy(() => import('./pages/NamesOfAllah'));
const QiblaPage = lazy(() => import('./pages/Qibla'));
const QiraathHome = lazy(() => import('./pages/QiraathHome'));
const QiraathProfile = lazy(() => import('./pages/QiraathProfile'));
const QiraathPlayer = lazy(() => import('./pages/QiraathPlayer'));

// Cached promise for surah-to-page mapping
let _surahPagesPromise = null;
function getSurahPagesMap() {
  if (!_surahPagesPromise) {
    _surahPagesPromise = fetch('/api/quran/surah_pages.json')
      .then(res => res.json())
      .catch(() => ({}));
  }
  return _surahPagesPromise;
}

// Backward compatibility redirect for legacy /quran/:surahId links
function QuranSurahRedirect() {
  const { id, surahId } = useParams();
  const rawId = surahId || id;
  const [targetPage, setTargetPage] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    getSurahPagesMap().then(data => {
      const parsedId = parseInt(rawId, 10);
      setTargetPage(data?.[parsedId]?.page || 1);
      setChecked(true);
    });
  }, [rawId]);

  if (!checked) return <PageLoading />;
  return <Navigate to={`/quran/mushaf/page/${targetPage || 1}`} replace />;
}


// Scroll restoration — restores scroll position on Back (POP) and resets to top on PUSH
function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollPositions = useRef({});

  // Continuously record scroll position for current route without layout thrashing
  useEffect(() => {
    let ticking = false;
    const saveScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const key = location.key || location.pathname;
          scrollPositions.current[key] = window.scrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', saveScroll, { passive: true });
    return () => window.removeEventListener('scroll', saveScroll);
  }, [location]);

  useEffect(() => {
    const key = location.key || location.pathname;
    if (navigationType === 'POP') {
      const savedY = scrollPositions.current[key] ?? 0;
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedY, left: 0, behavior: 'instant' });
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [location, navigationType]);

  return null;
}

function useDisableBrowserZoomAndCopy() {
  useEffect(() => {
    const isEditableTarget = target =>
      target instanceof Element &&
      target.closest('input, textarea, select, [contenteditable="true"]');

    const preventZoomShortcut = event => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (['+', '=', '-', '0'].includes(event.key)) event.preventDefault();
    };
    const preventWheelZoom = event => {
      if (event.ctrlKey) event.preventDefault();
    };
    const preventGestureZoom = event => event.preventDefault();
    const preventPageCopy = event => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };
    const preventPageContextMenu = event => {
      if (!isEditableTarget(event.target)) event.preventDefault();
    };

    document.addEventListener('keydown', preventZoomShortcut, true);
    document.addEventListener('wheel', preventWheelZoom, { capture: true, passive: false });
    document.addEventListener('gesturestart', preventGestureZoom, { passive: false });
    document.addEventListener('gesturechange', preventGestureZoom, { passive: false });
    document.addEventListener('copy', preventPageCopy, true);
    document.addEventListener('cut', preventPageCopy, true);
    document.addEventListener('contextmenu', preventPageContextMenu, true);

    return () => {
      document.removeEventListener('keydown', preventZoomShortcut, true);
      document.removeEventListener('wheel', preventWheelZoom, true);
      document.removeEventListener('gesturestart', preventGestureZoom);
      document.removeEventListener('gesturechange', preventGestureZoom);
      document.removeEventListener('copy', preventPageCopy, true);
      document.removeEventListener('cut', preventPageCopy, true);
      document.removeEventListener('contextmenu', preventPageContextMenu, true);
    };
  }, []);
}

const STARTUP_STATE = {
  LOADING: 'loading',
  READY: 'ready',
  ERROR: 'error'
};

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [startupState, setStartupState] = useState(() => {
    try {
      return sessionStorage.getItem('hasStarted') === 'true'
        ? STARTUP_STATE.READY
        : STARTUP_STATE.LOADING;
    } catch {
      return STARTUP_STATE.LOADING;
    }
  });

  const [isFading, setIsFading] = useState(false);
  const [initError, setInitError] = useState(null);
  const isInitializingRef = useRef(false);

  // Hide native Android splash smoothly once custom React splash is mounted
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Real app startup initialization lifecycle with 3-second loading wait
  const runInitialization = useCallback(async () => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    setInitError(null);
    setIsFading(false);
    const startTime = Date.now();

    try {
      // 1. Critical storage & runtime environment sanity check
      try {
        const testKey = '__pbuh_init_check__';
        localStorage.setItem(testKey, '1');
        localStorage.removeItem(testKey);
      } catch (storageErr) {
        throw new Error('Device storage is inaccessible. Please check permissions.');
      }

      // 2. Load essential local datasets (e.g. Surah-to-page mapping)
      // Guarded with a timeout so optional delays never hang indefinitely
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Initialization timed out. Please try again.')), 8000);
      });

      await Promise.race([
        getSurahPagesMap(),
        timeoutPromise
      ]);

      // 3. User requirement: exactly 3 seconds wait loading before opening home screen
      const MIN_LOADING_MS = 3000;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
      if (remaining > 0) {
        await new Promise(resolve => setTimeout(resolve, remaining));
      }

      // 4. Smooth fade out transition of the Welcome / Splash screen
      setIsFading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Successfully initialized! Transition to READY state
      try {
        sessionStorage.setItem('hasStarted', 'true');
      } catch (e) {
        console.warn('Storage warning:', e);
      }
      setStartupState(STARTUP_STATE.READY);
      setIsFading(false);
    } catch (err) {
      console.error('[Startup] Initialization failed:', err);
      setInitError(err?.message || 'Unable to complete startup initialization.');
      setStartupState(STARTUP_STATE.ERROR);
      setIsFading(false);
    } finally {
      isInitializingRef.current = false;
    }
  }, []);

  // Run initialization when entering LOADING state
  useEffect(() => {
    if (startupState === STARTUP_STATE.LOADING) {
      runInitialization();
    }
  }, [startupState, runInitialization]);

  const handleRetry = useCallback(() => {
    setStartupState(STARTUP_STATE.LOADING);
    setInitError(null);
  }, []);

  useDisableBrowserZoomAndCopy();

  // Android hardware / gesture back button
  useEffect(() => {
    if (startupState !== STARTUP_STATE.READY) {
      let handle = null;
      CapApp.addListener('backButton', () => {
        CapApp.exitApp();
      }).then(h => { handle = h; }).catch(() => {});
      return () => { if (handle) handle.remove(); };
    }

    let removeListener = null;

    const setupListener = async () => {
      const handle = await CapApp.addListener('backButton', () => {
        // 1. Dispatch custom event so open layers (modal, sheet, search, drawer) can handle and dismiss first
        const backEvt = new CustomEvent('pbuh:back', { cancelable: true });
        window.dispatchEvent(backEvt);
        if (backEvt.defaultPrevented) return;

        // 2. If at root Home screen, exit app directly instead of looping through history
        if (location.pathname === '/' || location.pathname === '/index.html') {
          CapApp.exitApp();
          return;
        }

        // 3. Resilient in-app back navigation matching on-screen Back button behavior
        performAppBack(navigate, location.pathname, '/');
      });
      removeListener = () => handle.remove();
    };

    setupListener();

    return () => {
      if (removeListener) removeListener();
    };
  }, [startupState, location.pathname, navigate]);

  // Idle prefetch core lazy chunks so navigation is instant
  useEffect(() => {
    if (startupState === STARTUP_STATE.READY && typeof window !== 'undefined') {
      const schedulePrefetch = window.requestIdleCallback || ((cb) => setTimeout(cb, 800));
      schedulePrefetch(() => {
        import('./pages/MushafJuzIndex');
        import('./pages/Hadith');
        import('./pages/Dua');
        import('./pages/Dhikr');
        import('./pages/QiraathHome');
      });
    }
  }, [startupState]);


  return (
    <AuthProvider>
    <QiraathProvider>
    <LanguageProvider>
      <ThemeProvider>
        <QuranAudioSettingsProvider>
          <BookmarkProvider>
            <SearchProvider>
              <NetworkProvider>
                <div className="app-container">
                  <AppNavigationTracker />
                  <ScrollRestoration />
                  <NetworkStatusIndicator />
                  <Navbar />
                  <div
                    key={location.pathname}
                    className="page-transition-wrapper fade-in"
                    style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                  >
                    <Suspense fallback={<PageLoading />}>
                      <Routes location={location}>
                        <Route path="/" element={<Home />} />
                        <Route path="/index.html" element={<Home />} />
                        <Route path="/quran" element={<MushafJuzIndex />} />
                        <Route path="/quran/mushaf" element={<MushafJuzIndex />} />
                        <Route path="/quran/mushaf/page/:pageNumber" element={<MushafReader />} />
                        <Route path="/quran/:id" element={<QuranSurahRedirect />} />
                        <Route path="/quran/surah/:id" element={<QuranSurahRedirect />} />
                        <Route path="/quran/translation" element={<QuranIndex />} />
                        <Route path="/quran/translation/:id" element={<QuranSurah />} />
                        <Route path="/hadith" element={<HadithIndex />} />
                        <Route path="/hadith/search" element={<HadithSearchPage />} />
                        <Route path="/hadith/categories/:id" element={<HadithCategoryDetail />} />
                        <Route path="/hadith/:id" element={<HadithCollection />} />
                        <Route path="/hadith/:id/book/:bookId" element={<HadithBook />} />
                        <Route path="/dua" element={<Dua />} />
                        <Route path="/dhikr" element={<Dhikr />} />
                        <Route path="/inspiration" element={<DailyInspiration />} />
                        <Route path="/daily-inspiration" element={<DailyInspiration />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/explore/:topic" element={<Explore />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/after-salah" element={<AfterSalah />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/nearby-masjids" element={<NearbyMasjids />} />
                        <Route path="/lessons" element={<Lessons />} />
                        <Route path="/lessons/:subjectId" element={<Lessons />} />
                        <Route path="/lessons/:subjectId/:lessonId" element={<Lessons />} />
                        <Route path="/names-of-allah" element={<NamesOfAllah />} />
                        <Route path="/qibla" element={<QiblaPage />} />
                        <Route path="/qiraath" element={<QiraathHome />} />
                        <Route path="/qiraath/:reciterId" element={<QiraathProfile />} />
                        <Route path="/qiraath/:reciterId/player" element={<QiraathPlayer />} />
                        <Route path="*" element={
                          <main className="page-wrapper fade-in" id="main-content">
                            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                              <h1 style={{ fontSize: '4rem', margin: 0, color: 'var(--color-primary)' }}>404</h1>
                              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                                Page not found
                              </p>
                              <a href="/" className="btn btn-primary">Go Home</a>
                            </div>
                          </main>
                        } />
                      </Routes>
                    </Suspense>
                  </div>
                  {location.pathname === '/' && <Footer />}
                  <QiraathMiniPlayer />

                  {/* Startup Splash & Loading Screen Overlay */}
                  {(startupState !== STARTUP_STATE.READY || isFading) && (
                    <WelcomeScreen
                      error={startupState === STARTUP_STATE.ERROR ? initError : null}
                      onRetry={handleRetry}
                      isFading={isFading}
                    />
                  )}
                </div>
              </NetworkProvider>
            </SearchProvider>
          </BookmarkProvider>
        </QuranAudioSettingsProvider>
      </ThemeProvider>
    </LanguageProvider>
    </QiraathProvider>
    </AuthProvider>
  );
}
