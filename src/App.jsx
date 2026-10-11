import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { SplashScreen } from '@capacitor/splash-screen';

// Providers
import {
  LanguageProvider,
  ThemeProvider,
  QuranAudioSettingsProvider,
  BookmarkProvider,
  SearchProvider,
} from './context/AppContext';
import { AuthProvider } from './context/AuthContext';

// Shared Components
import Navbar from './components/navbar/Navbar';
import Footer from './components/footer/Footer';
import GlobalSearch from './components/search/GlobalSearch';
// AuthModal removed — no login required

import { Suspense, lazy } from 'react';
// Pages — Home is statically imported so the initial route renders instantly
import Home from './pages/Home';
import WelcomeScreen from './components/WelcomeScreen';

// Secondary pages — code-split to dramatically shrink initial JS bundle and speed up launch
const QuranIndex = lazy(() => import('./pages/Quran').then(m => ({ default: m.QuranIndex })));
const QuranSurah = lazy(() => import('./pages/Quran').then(m => ({ default: m.QuranSurah })));
const HadithIndex = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithIndex })));
const HadithCollection = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithCollection })));
const HadithCategoryDetail = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithCategoryDetail })));
const HadithSearchPage = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithSearchPage })));
const HadithBook = lazy(() => import('./pages/Hadith').then(m => ({ default: m.HadithBook })));
const Dua = lazy(() => import('./pages/Dua'));
const Dhikr = lazy(() => import('./pages/Dhikr'));
const Explore = lazy(() => import('./pages/Explore'));
const Library = lazy(() => import('./pages/Library'));
const About = lazy(() => import('./pages/About'));
const AfterSalah = lazy(() => import('./pages/AfterSalah'));
const Settings = lazy(() => import('./pages/Settings'));
const NearbyMasjids = lazy(() => import('./pages/NearbyMasjids'));
const Lessons = lazy(() => import('./pages/Lessons'));
const NamesOfAllah = lazy(() => import('./pages/NamesOfAllah'));
const QiblaPage = lazy(() => import('./pages/Qibla'));

// Scroll restoration — instant, smooth reset on page change without conflicting with CSS smooth scroll
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

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

export default function App() {
  const location = useLocation();
  const [hasStarted, setHasStarted] = useState(() => {
    return sessionStorage.getItem('hasStarted') === 'true';
  });

  useEffect(() => {
    // Hide native Android splash as soon as React has hydrated
    SplashScreen.hide().catch(() => {});
  }, []);

  const startApp = () => {
    sessionStorage.setItem('hasStarted', 'true');
    setHasStarted(true);
  };

  // showAuth removed — anonymous device identity; no login flow needed

  useDisableBrowserZoomAndCopy();

  return (
    <AuthProvider>
    <LanguageProvider>
      <ThemeProvider>
        <QuranAudioSettingsProvider>
          <BookmarkProvider>
            <SearchProvider>
              <AnimatePresence mode="wait">
                {!hasStarted ? (
                  <motion.div
                    key="welcome-splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
                  >
                    <WelcomeScreen onGetStarted={startApp} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="app-shell"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="app-container"
                  >
                    <ScrollToTop />
                    <Navbar />
                    <AnimatePresence mode="wait">
                    <motion.div
                      key={location.pathname}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      style={{ flex: 1, display: 'flex', flexDirection: 'column', willChange: 'opacity' }}
                    >
                    <Suspense fallback={null}>
                      <Routes location={location}>
                        <Route path="/" element={<Home />} />
                        <Route path="/quran" element={<QuranIndex />} />
                        <Route path="/quran/:id" element={<QuranSurah />} />
                        <Route path="/hadith" element={<HadithIndex />} />
                        <Route path="/hadith/search" element={<HadithSearchPage />} />
                        <Route path="/hadith/categories/:id" element={<HadithCategoryDetail />} />
                        <Route path="/hadith/:id" element={<HadithCollection />} />
                        <Route path="/hadith/:id/book/:bookId" element={<HadithBook />} />
                        <Route path="/dua" element={<Dua />} />
                        <Route path="/dhikr" element={<Dhikr />} />
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
                    </motion.div>
                  </AnimatePresence>
                  {location.pathname === '/' && <Footer />}
                  <GlobalSearch />
                </motion.div>
              )}
            </AnimatePresence>
            </SearchProvider>
          </BookmarkProvider>
        </QuranAudioSettingsProvider>
      </ThemeProvider>
    </LanguageProvider>
    </AuthProvider>
  );
}