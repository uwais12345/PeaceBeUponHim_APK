import { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { TRANSLATIONS, LANGUAGES } from '../i18n/translations';
import { QURAN_RECITERS } from '../services/quran';

// ============================================
// LANGUAGE CONTEXT
// ============================================
const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app-lang') || 'ta');

  useEffect(() => {
    localStorage.setItem('app-lang', lang);
    const langMeta = LANGUAGES.find(l => l.code === lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', langMeta?.dir || 'ltr');
  }, [lang]);

  const t = useCallback((key) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en?.[key] || key, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, languages: LANGUAGES }), [lang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
};

// ============================================
// THEME CONTEXT
// ============================================
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
    return 'light';
  });

  // Resolve the effective data-theme value
  const resolveEffective = (t) => {
    if (t === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return t;
  };

  useEffect(() => {
    const applyTheme = (t) => {
      document.documentElement.setAttribute('data-theme', resolveEffective(t));
      localStorage.setItem('theme', t);
    };

    applyTheme(theme);

    // When "system" is selected, track OS preference changes in real time
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme('system');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  const value = useMemo(() => ({ theme, toggle, setTheme }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
};

// ============================================
// QURAN AUDIO SETTINGS CONTEXT
// ============================================
const QuranAudioSettingsContext = createContext(null);
const DEFAULT_RECITER_ID = '7';

function loadReciterId() {
  const savedId = localStorage.getItem('quran_reciter');
  return QURAN_RECITERS.some(reciter => String(reciter.id) === savedId)
    ? savedId
    : DEFAULT_RECITER_ID;
}

export function QuranAudioSettingsProvider({ children }) {
  const [reciterId, setReciterId] = useState(loadReciterId);

  useEffect(() => {
    localStorage.setItem('quran_reciter', reciterId);
  }, [reciterId]);

  const value = useMemo(() => ({ reciterId, setReciterId }), [reciterId]);

  return (
    <QuranAudioSettingsContext.Provider value={value}>
      {children}
    </QuranAudioSettingsContext.Provider>
  );
}

export const useQuranAudioSettings = () => {
  const ctx = useContext(QuranAudioSettingsContext);
  if (!ctx) throw new Error('useQuranAudioSettings must be used inside QuranAudioSettingsProvider');
  return ctx;
};

// ============================================
// BOOKMARK CONTEXT
// ============================================
const BookmarkContext = createContext(null);

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem('bookmarks') || '[]');
  } catch { return []; }
}

export function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useState(loadBookmarks);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimer = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2500);
  }, []);

  // Persist bookmarks whenever they change
  useEffect(() => {
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const isBookmarked = useCallback((type, id) =>
    bookmarks.some(b => b.type === type && b.id === String(id)), [bookmarks]);

  const toggle = useCallback((item) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.type === item.type && b.id === String(item.id));
      const lang = localStorage.getItem('app-lang') || 'ta';
      const T = TRANSLATIONS[lang] || TRANSLATIONS.en;
      if (exists) {
        showToast(T.bookmark === 'சேமி' ? 'நீக்கப்பட்டது' : lang === 'ar' ? 'تم الحذف' : 'Bookmark removed');
        return prev.filter(b => !(b.type === item.type && b.id === String(item.id)));
      } else {
        showToast(lang === 'ta' ? 'நூலகத்தில் சேமிக்கப்பட்டது' : lang === 'ar' ? 'تم الحفظ في المكتبة' : 'Saved to library');
        return [...prev, { ...item, id: String(item.id), savedAt: new Date().toISOString() }];
      }
    });
  }, [showToast]);

  const remove = useCallback((type, id) => {
    setBookmarks(prev => prev.filter(b => !(b.type === type && b.id === String(id))));
    const lang = localStorage.getItem('app-lang') || 'ta';
    const msg = lang === 'ta' ? 'நூலகத்திலிருந்து நீக்கப்பட்டது' : lang === 'ar' ? 'تم الإزالة من المكتبة' : 'Removed from library';
    showToast(msg);
  }, [showToast]);

  const value = useMemo(() => ({
    bookmarks, isBookmarked, toggle, remove
  }), [bookmarks, isBookmarked, toggle, remove]);

  return (
    <BookmarkContext.Provider value={value}>
      {children}
      {toastMsg && (
        <div className="toast-container">
          <div className="toast">{toastMsg}</div>
        </div>
      )}
    </BookmarkContext.Provider>
  );
}

export const useBookmarks = () => {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used inside BookmarkProvider');
  return ctx;
};

// ============================================
// SEARCH CONTEXT (Global search modal)
// ============================================
const SearchContext = createContext(null);

export function SearchProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    const backHandler = (e) => {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handler);
    window.addEventListener('pbuh:back', backHandler);
    return () => {
      document.removeEventListener('keydown', handler);
      window.removeEventListener('pbuh:back', backHandler);
    };
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used inside SearchProvider');
  return ctx;
};
