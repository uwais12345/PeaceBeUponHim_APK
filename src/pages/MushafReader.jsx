import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import juzList from '../data/juz_13lines.json';
import { useBookmarks, useLang } from '../context/AppContext';
import { useAppBack } from '../hooks/useAppNavigation';
import MushafFrontispiece from '../components/MushafFrontispiece';
import Mushaf13LinePage from '../components/Mushaf13LinePage';
import './MushafReader.css';

const VolumeNav = registerPlugin('VolumeNav');

const TOTAL_PAGES = 604;
const FIRST_PAGE = 1;

/* ── Helpers ── */
function toArabicNumerals(n) {
  return String(n).replace(/\d/g, d => String.fromCharCode(0x0660 + parseInt(d)));
}

/* ── Data fetching (module-level cache so it survives re-renders) ── */
let _surahPagesCache = null;
async function getSurahPages() {
  if (_surahPagesCache) return _surahPagesCache;
  try {
    const r = await fetch('/api/quran/surah_pages.json');
    _surahPagesCache = await r.json();
  } catch { _surahPagesCache = {}; }
  return _surahPagesCache;
}

const _pgCache = new Map();
let _allPagesPromise = null;
async function getAllPages() {
  if (!_allPagesPromise)
    _allPagesPromise = fetch('/api/quran/pages.json').then(r => r.json()).catch(() => ({}));
  return _allPagesPromise;
}
async function getPageVerses(p) {
  const k = String(p);
  if (_pgCache.has(k)) return _pgCache.get(k);
  const all = await getAllPages();
  const v = all[k] || [];
  _pgCache.set(k, v);
  return v;
}

export default function MushafReader() {
  const { pageNumber } = useParams();
  const navigate       = useNavigate();
  const handleBack     = useAppBack('/quran');
  const { isBookmarked, toggle: toggleBookmark } = useBookmarks();
  const { lang }       = useLang();

  const currentPage = Math.min(TOTAL_PAGES, Math.max(FIRST_PAGE, parseInt(pageNumber || '1', 10) || 1));

  const [pageDir, setPageDir]       = useState('fwd');
  const [verses, setVerses]         = useState(null);
  const [surahPages, setSurahPages] = useState(null);
  const [error, setError]           = useState(false);

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  /* Juz for this page */
  const juz = juzList.find(j => currentPage >= j.page_start && currentPage <= j.page_end) || juzList[0];

  /* Load surah metadata once */
  useEffect(() => { getSurahPages().then(setSurahPages); }, []);

  /* Load page text */
  useEffect(() => {
    setVerses(null);
    setError(false);
    getPageVerses(currentPage).then(setVerses).catch(() => setError(true));
    if (currentPage < TOTAL_PAGES) getPageVerses(currentPage + 1).catch(() => {});
    if (currentPage > FIRST_PAGE)  getPageVerses(currentPage - 1).catch(() => {});
  }, [currentPage]);

  /* Save last-read */
  useEffect(() => {
    try {
      localStorage.setItem('mushaf_13lines_last_read',
        JSON.stringify({ page: currentPage, juz: juz.juz, timestamp: new Date().toISOString() }));
    } catch { /* ignore */ }
  }, [currentPage, juz]);

  const isNavigatingRef = useRef(false);

  /* Clear navigation lock on page change */
  useEffect(() => {
    isNavigatingRef.current = false;
  }, [currentPage]);

  /* Navigation — Traditional Arabic Quran Mushaf direction */
  const goNext = useCallback(() => {
    if (isNavigatingRef.current || currentPage >= TOTAL_PAGES) return;
    isNavigatingRef.current = true;
    setPageDir('fwd');
    navigate(`/quran/mushaf/page/${currentPage + 1}`, { replace: true });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 320);
  }, [currentPage, navigate]);

  const goPrev = useCallback(() => {
    if (isNavigatingRef.current || currentPage <= FIRST_PAGE) return;
    isNavigatingRef.current = true;
    setPageDir('bwd');
    navigate(`/quran/mushaf/page/${currentPage - 1}`, { replace: true });
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 320);
  }, [currentPage, navigate]);

  /* Touch swipe:
     - Right to left swipe (dx < 0): advances to Next Quran Page (Arabic RTL)
     - Left to right swipe (dx > 0): returns to Previous Quran Page (Arabic RTL)
  */
  const onTouchStart = e => {
    if (e.touches && e.touches.length > 0) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const onTouchEnd = e => {
    if (touchStartX.current === null || isNavigatingRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const onTouchCancel = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  useEffect(() => {
    goNextRef.current = goNext;
    goPrevRef.current = goPrev;
  });

  /* Keyboard & Hardware Volume Buttons Navigation */
  useEffect(() => {
    const isVolumeNavEnabled = localStorage.getItem('mushaf_volume_nav') !== 'false';
    let nativeListenerHandle = null;

    if (isVolumeNavEnabled && Capacitor.isNativePlatform()) {
      VolumeNav.start()
        .then(() => {
          return VolumeNav.addListener('volumeKey', event => {
            if (event?.direction === 'up') {
              goNextRef.current?.();
            } else if (event?.direction === 'down') {
              goPrevRef.current?.();
            }
          });
        })
        .then(handle => {
          nativeListenerHandle = handle;
        })
        .catch(err => {
          console.warn('[VolumeNav] Native listener registration error:', err);
        });
    }

    const onKeyDown = e => {
      if (e.key === 'ArrowLeft') {
        goNextRef.current?.();
      } else if (e.key === 'ArrowRight') {
        goPrevRef.current?.();
      } else if (isVolumeNavEnabled && (e.key === 'AudioVolumeUp' || e.key === 'VolumeUp')) {
        e.preventDefault();
        goNextRef.current?.();
      } else if (isVolumeNavEnabled && (e.key === 'AudioVolumeDown' || e.key === 'VolumeDown')) {
        e.preventDefault();
        goPrevRef.current?.();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      if (Capacitor.isNativePlatform()) {
        if (nativeListenerHandle) {
          nativeListenerHandle.remove();
        }
        VolumeNav.stop().catch(() => {});
      }
    };
  }, []);

  /* Screen Wake Lock while reading Quran */
  useEffect(() => {
    const isWakeLockEnabled = localStorage.getItem('mushaf_keep_awake') !== 'false';
    if (!isWakeLockEnabled || typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let wakeLockSentinel = null;
    const requestLock = async () => {
      try {
        if (document.visibilityState === 'visible') {
          wakeLockSentinel = await navigator.wakeLock.request('screen');
        }
      } catch {
        /* WakeLock not permitted or unsupported */
      }
    };

    requestLock();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (wakeLockSentinel) {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, []);

  /* Bookmark */
  const bmId = `mushaf_page_${currentPage}`;
  const isBookmarkedPage = isBookmarked('quran_mushaf', bmId);
  const handleBookmark = e => {
    e.stopPropagation();
    toggleBookmark({
      type: 'quran_mushaf',
      id: bmId,
      title: `முஸஹஃப் பக்கம் ${currentPage} (ஜுஸ்ஃ ${juz.juz})`,
      subtitle: `${juz.tamil} • ${juz.start_surah}`,
      url: `/quran/mushaf/page/${currentPage}`,
    });
  };

  const pageLabel = lang === 'en' ? 'Page' : lang === 'ta' ? 'பக்கம்' : 'صفحة';
  const juzLabel  = lang === 'en' ? 'Juz'  : lang === 'ta' ? 'ஜுஸ்ஃ' : 'جزء';
  const displayPageNum = lang === 'ar' ? toArabicNumerals(currentPage) : currentPage;
  const displayJuzNum  = lang === 'ar' ? toArabicNumerals(juz.juz) : juz.juz;

  const isLoading = verses === null && !error;

  return (
    <div
      className="mf-root"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
    >
      {/* ── TOPBAR: Clean, modern, professional navigation matching screenshot ── */}
      <header className="mf-topbar">
        <button
          className="mf-icon-btn mf-back-btn"
          onClick={handleBack}
          aria-label="Back"
          title="Back"
        >
          <ArrowLeft size={19} />
        </button>

        <div className="mf-nav-pill">
          {/* Traditional Arabic Quran Mushaf: Left advances forward to Next Page */}
          <button
            className="mf-pill-arrow"
            onClick={goNext}
            disabled={currentPage >= TOTAL_PAGES}
            aria-label="Next Page"
            title="Next Page"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="mf-pill-info">
            <span className="mf-pill-page">
              {pageLabel} {displayPageNum}
            </span>
            {juz?.juz && (
              <span className="mf-pill-juz">
                {juzLabel} {displayJuzNum}
              </span>
            )}
          </div>

          {/* Traditional Arabic Quran Mushaf: Right returns backward to Previous Page */}
          <button
            className="mf-pill-arrow"
            onClick={goPrev}
            disabled={currentPage <= FIRST_PAGE}
            aria-label="Previous Page"
            title="Previous Page"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <button
          className={`mf-icon-btn mf-bm-btn${isBookmarkedPage ? ' is-active' : ''}`}
          onClick={handleBookmark}
          aria-label="Bookmark"
          title={isBookmarkedPage ? 'Remove Bookmark' : 'Add Bookmark'}
        >
          <Bookmark
            size={19}
            fill={isBookmarkedPage ? '#e8b96a' : 'none'}
            color={isBookmarkedPage ? '#e8b96a' : 'currentColor'}
          />
        </button>
      </header>

      {/* ── STAGE: Framed with space around the Mushaf page ── */}
      <main className="mf-stage">
        <div
          className={`mf-page-wrap mf-dir-${pageDir}${isLoading ? ' mf-loading' : ' mf-ready'}`}
          key={currentPage}
        >
          {isLoading && (
            <div className="mf-loading-box">
              <div className="mf-loading-text" lang="ar" dir="rtl">جاري التحميل…</div>
            </div>
          )}
          {error && (
            <div className="mf-error" lang="ar" dir="rtl">
              <p>تعذّر تحميل الصفحة</p>
              <button onClick={e => { e.stopPropagation(); setError(false); setVerses(null); }}>
                إعادة المحاولة
              </button>
            </div>
          )}
          {!isLoading && !error && (
            currentPage <= 2 ? (
              /* ── PAGES 1 & 2: Illuminated Opening Frontispiece (Al-Fatiha & Alif-Lam-Meem) ── */
              <MushafFrontispiece pageNum={currentPage} verses={verses} />
            ) : (
              /* ── PAGES 3–604: Classical 13-Line Mushaf Page (Exact Reference Clone) ── */
              <Mushaf13LinePage
                pageNum={currentPage}
                verses={verses}
                surahPages={surahPages}
                juz={juz}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}
