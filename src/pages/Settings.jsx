import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Check, Trash2 } from 'lucide-react';
import { QURAN_RECITERS } from '../services/quran';
import { useLang, useQuranAudioSettings, useTheme, useBookmarks } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import BackButton from '../components/ui/BackButton';
import './Settings.css';

/* ── iOS Toggle Switch Component ── */
function IosSwitch({ checked, onChange, label, id }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      id={id}
      className={`ios-switch${checked ? ' is-on' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
    >
      <span className="ios-switch-thumb" />
    </button>
  );
}

export default function Settings() {
  const { lang, setLang, t, languages } = useLang();
  const { theme, setTheme } = useTheme();
  const { reciterId, setReciterId } = useQuranAudioSettings();
  const { history, removeHistory } = useAuth();
  const { bookmarks } = useBookmarks();
  const navigate = useNavigate();

  // Active modal: 'reciter' | 'lang' | 'theme' | 'clear' | null
  const [activeMenu, setActiveMenu] = useState(null);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);

  // Quran App Extra Features
  // 1. Volume Buttons Page Turn
  const [volumeNav, setVolumeNav] = useState(() => {
    return localStorage.getItem('mushaf_volume_nav') !== 'false';
  });

  // 2. Keep Screen Awake while reading Quran
  const [keepAwake, setKeepAwake] = useState(() => {
    return localStorage.getItem('mushaf_keep_awake') !== 'false';
  });

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2200);
  };

  const handleToggleVolumeNav = (val) => {
    setVolumeNav(val);
    localStorage.setItem('mushaf_volume_nav', String(val));
    showToast(
      val
        ? (lang === 'ta' ? 'ஒலி பொத்தான்கள் வழிசெலுத்தல் ஆன்' : 'Volume key navigation ON')
        : (lang === 'ta' ? 'ஒலி பொத்தான்கள் வழிசெலுத்தல் ஆஃப்' : 'Volume key navigation OFF')
    );
  };

  const handleToggleKeepAwake = (val) => {
    setKeepAwake(val);
    localStorage.setItem('mushaf_keep_awake', String(val));
    showToast(
      val
        ? (lang === 'ta' ? 'திரை எப்போதும் ஆன்' : 'Screen Keep Awake ON')
        : (lang === 'ta' ? 'திரை உறங்குமுறை ஆன்' : 'Screen Keep Awake OFF')
    );
  };

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    if (activeMenu) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeMenu]);

  const currentLangObj = languages.find((l) => l.code === lang) || languages[0];
  const currentReciterObj =
    QURAN_RECITERS.find((r) => String(r.id) === String(reciterId)) || QURAN_RECITERS[0];

  const THEMES = [
    { id: 'light', label: t('themeLight') },
    { id: 'dark', label: t('themeDark') },
    { id: 'system', label: t('themeSystem') },
  ];
  const currentThemeObj = THEMES.find((th) => th.id === theme) || THEMES[0];

  const handleSelectLang = (code) => {
    setLang(code);
    setActiveMenu(null);
    showToast(lang === 'ta' ? 'மொழி மாற்றப்பட்டது' : 'Language updated');
  };

  const handleSelectTheme = (id) => {
    setTheme(id);
    setActiveMenu(null);
    showToast(lang === 'ta' ? 'தோற்றம் புதுப்பிக்கப்பட்டது' : 'Theme updated');
  };

  const handleSelectReciter = (id) => {
    setReciterId(id);
    setActiveMenu(null);
    showToast(lang === 'ta' ? 'ஓதுபவர் தேர்ந்தெடுக்கப்பட்டார்' : 'Reciter updated');
  };

  const handleClearHistory = () => {
    removeHistory();
    setActiveMenu(null);
    showToast(lang === 'ta' ? 'வரலாறு அழிக்கப்பட்டது' : 'Reading history cleared');
  };

  // Dismiss open dropdown/modal on Android back button/gesture
  useEffect(() => {
    if (!activeMenu) return undefined;
    const onBack = (e) => {
      e.preventDefault();
      setActiveMenu(null);
    };
    window.addEventListener('pbuh:back', onBack);
    return () => window.removeEventListener('pbuh:back', onBack);
  }, [activeMenu]);

  return (
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Back Arrow */}
        <div className="settings-top-nav">
          <BackButton fallback="/" label={t('back') || 'Back'} />
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">{t('settingsTitle')}</h1>

        {/* ── SECTION 1: Help & Contact (Single Card) ── */}
        <div className="settings-group-wrap">
          <div className="settings-card-group">
            <button
              type="button"
              className="settings-card-row"
              onClick={() => navigate('/about')}
            >
              <span className="settings-row-label">
                {lang === 'ta' ? 'உதவி & தொடர்பு' : 'Customer Service'}
              </span>
              <ChevronRight size={19} className="settings-row-chevron" />
            </button>
          </div>
        </div>

        {/* ── SECTION 2: General ── */}
        <div className="settings-group-wrap">
          <h2 className="settings-group-heading">
            {lang === 'ta' ? 'பொதுவானவை' : 'General'}
          </h2>
          <div className="settings-card-group">
            {/* Language */}
            <button
              type="button"
              className="settings-card-row"
              onClick={() => setActiveMenu('lang')}
            >
              <span className="settings-row-label">{t('appLanguage')}</span>
              <div className="settings-row-value-wrap">
                <span className="settings-row-value">{currentLangObj?.nativeName || 'English'}</span>
                <ChevronRight size={19} className="settings-row-chevron" />
              </div>
            </button>

            {/* Appearance / Theme */}
            <button
              type="button"
              className="settings-card-row"
              onClick={() => setActiveMenu('theme')}
            >
              <span className="settings-row-label">{t('theme')}</span>
              <div className="settings-row-value-wrap">
                <span className="settings-row-value">{currentThemeObj?.label || 'System'}</span>
                <ChevronRight size={19} className="settings-row-chevron" />
              </div>
            </button>

            {/* Reciter Picker Row (Triggers iOS style small dropdown menu) */}
            <button
              type="button"
              className="settings-card-row"
              onClick={() => setActiveMenu('reciter')}
            >
              <span className="settings-row-label">{t('defaultReciter')}</span>
              <div className="settings-row-value-wrap">
                <span className="settings-row-value settings-truncate-val">
                  {currentReciterObj?.name || 'Mishari Rashid'}
                </span>
                <ChevronRight size={19} className="settings-row-chevron" />
              </div>
            </button>

            {/* Saved Bookmarks */}
            <button
              type="button"
              className="settings-card-row"
              onClick={() => navigate('/library')}
            >
              <span className="settings-row-label">
                {lang === 'ta' ? 'சேமிக்கப்பட்டவை' : 'Saved Bookmarks'}
              </span>
              <div className="settings-row-value-wrap">
                <span className="settings-row-value">{bookmarks?.length || 0}</span>
                <ChevronRight size={19} className="settings-row-chevron" />
              </div>
            </button>
          </div>
        </div>

        {/* ── SECTION 3: Quran Reading Settings (EXTRA 2 FEATURES) ── */}
        <div className="settings-group-wrap">
          <h2 className="settings-group-heading">
            {lang === 'ta' ? 'குர்ஆன் வாசிப்பு விருப்பங்கள்' : 'Quran Preferences'}
          </h2>
          <div className="settings-card-group">
            {/* Feature 1: Volume Button Page Navigation */}
            <div className="settings-card-row">
              <div className="settings-row-text-group">
                <span className="settings-row-label">
                  {lang === 'ta' ? 'ஒலி பொத்தான் பக்கம் திரும்புதல்' : 'Volume Button Navigation'}
                </span>
                <span className="settings-row-subtext">
                  {lang === 'ta'
                    ? 'ஒலி பொத்தான்கள் மூலம் அடுத்த / முந்தைய பக்கம்'
                    : 'Turn Quran pages using volume up / down keys'}
                </span>
              </div>
              <IosSwitch
                checked={volumeNav}
                onChange={handleToggleVolumeNav}
                label="Volume Button Navigation"
                id="switch-volume-nav"
              />
            </div>

            {/* Feature 2: Keep Screen Awake While Reading */}
            <div className="settings-card-row">
              <div className="settings-row-text-group">
                <span className="settings-row-label">
                  {lang === 'ta' ? 'திரை எப்போதும் விழித்திருக்க' : 'Keep Screen Awake'}
                </span>
                <span className="settings-row-subtext">
                  {lang === 'ta'
                    ? 'குர்ஆன் வாசிக்கும்போது திரை அணையாமல் இருக்க'
                    : 'Prevent screen timeout while reciting Quran'}
                </span>
              </div>
              <IosSwitch
                checked={keepAwake}
                onChange={handleToggleKeepAwake}
                label="Keep Screen Awake"
                id="switch-keep-awake"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Privacy and Security ── */}
        <div className="settings-group-wrap">
          <h2 className="settings-group-heading">
            {lang === 'ta' ? 'தனியுரிமை மற்றும் பாதுகாப்பு' : 'Privacy and Security'}
          </h2>
          <div className="settings-card-group">
            {/* Anonymous Mode */}
            <div className="settings-card-row settings-row-static">
              <span className="settings-row-label">
                {lang === 'ta' ? 'அநாமதேய பயன்முறை' : 'Anonymous Device Identity'}
              </span>
              <span className="settings-row-value settings-green-val">
                {lang === 'ta' ? 'இயங்குகிறது' : 'Active'}
              </span>
            </div>

            {/* Reading History */}
            <button
              type="button"
              className="settings-card-row"
              onClick={() => setActiveMenu('clear')}
            >
              <span className="settings-row-label">{t('yourActivity')}</span>
              <div className="settings-row-value-wrap">
                <span className="settings-row-value">
                  {history.length} {lang === 'ta' ? 'பதிவுகள்' : 'items'}
                </span>
                <ChevronRight size={19} className="settings-row-chevron" />
              </div>
            </button>

            {/* Offline Storage */}
            <div className="settings-card-row settings-row-static">
              <span className="settings-row-label">
                {lang === 'ta' ? 'ஆஃப்லைன் சேமிப்பு' : 'Offline Data Storage'}
              </span>
              <span className="settings-row-value">
                {lang === 'ta' ? 'சாதனத்தில் மட்டும்' : 'On-device only'}
              </span>
            </div>
          </div>
        </div>

        {/* ── SECTION 5: About ── */}
        <div className="settings-group-wrap">
          <h2 className="settings-group-heading">
            {lang === 'ta' ? 'பயன்பாடு பற்றி' : 'About and Info'}
          </h2>
          <div className="settings-card-group">
            <div className="settings-card-row settings-row-static">
              <span className="settings-row-label">
                {lang === 'ta' ? 'பதிப்பு' : 'Version'}
              </span>
              <span className="settings-row-value">v1.0.1 Stable</span>
            </div>
            <button
              type="button"
              className="settings-card-row"
              onClick={() => navigate('/about')}
            >
              <span className="settings-row-label">
                {lang === 'ta' ? 'Peace Be Upon Him பற்றி' : 'About Peace Be Upon Him'}
              </span>
              <ChevronRight size={19} className="settings-row-chevron" />
            </button>
          </div>
        </div>

        {/* ── SOLID BOTTOM ACTION BUTTON ── */}
        <div className="settings-bottom-section">
          {history.length > 0 ? (
            <button
              type="button"
              className="settings-solid-btn is-danger"
              onClick={() => setActiveMenu('clear')}
            >
              <Trash2 size={16} />
              {t('clearHistory')}
            </button>
          ) : (
            <button
              type="button"
              className="settings-solid-btn"
              onClick={() => navigate('/about')}
            >
              {lang === 'ta' ? 'பயன்பாட்டு தகவல்' : 'Learn More'}
            </button>
          )}

          <p className="settings-bottom-disclaimer">
            {lang === 'ta' ? (
              <>
                Peace Be Upon Him பற்றி மேலும் அறிய, அல்லது எங்கள் தனியுரிமை கொள்கையை படிக்கவும்.{' '}
                <button
                  type="button"
                  className="settings-disclaimer-link"
                  onClick={() => navigate('/about')}
                >
                  மேலும் படிக்க.
                </button>
              </>
            ) : (
              <>
                Learn more about Peace Be Upon Him, or read our privacy policy.{' '}
                <button
                  type="button"
                  className="settings-disclaimer-link"
                  onClick={() => navigate('/about')}
                >
                  Read more.
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* ────────────────────────────────────────────────
          COMPACT iOS-STYLE CENTERED DROPDOWN MENU MODAL
          (Small size, Center-Aligned, Clean Apple Menu)
         ──────────────────────────────────────────────── */}
      {activeMenu && (
        <div className="ios-menu-backdrop" onClick={() => setActiveMenu(null)}>
          <div
            className="ios-menu-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="ios-menu-header">
              <span className="ios-menu-title">
                {activeMenu === 'reciter' && t('defaultReciter')}
                {activeMenu === 'lang' && t('appLanguage')}
                {activeMenu === 'theme' && t('theme')}
                {activeMenu === 'clear' && t('yourActivity')}
              </span>
            </div>

            {/* Reciter Options — Compact, Center-Aligned, Small Size */}
            {activeMenu === 'reciter' && (
              <div className="ios-menu-list">
                {QURAN_RECITERS.map((r) => {
                  const isSelected = String(r.id) === String(reciterId);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      className={`ios-menu-item${isSelected ? ' is-selected' : ''}`}
                      onClick={() => handleSelectReciter(r.id)}
                    >
                      <span className="ios-menu-item-text">{r.name}</span>
                      {isSelected && <Check size={16} strokeWidth={2.5} className="ios-menu-check" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Language Options */}
            {activeMenu === 'lang' && (
              <div className="ios-menu-list">
                {languages.map((l) => {
                  const isSelected = lang === l.code;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      className={`ios-menu-item${isSelected ? ' is-selected' : ''}`}
                      onClick={() => handleSelectLang(l.code)}
                    >
                      <span className="ios-menu-item-text">{l.nativeName}</span>
                      {isSelected && <Check size={16} strokeWidth={2.5} className="ios-menu-check" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Theme Options */}
            {activeMenu === 'theme' && (
              <div className="ios-menu-list">
                {THEMES.map((th) => {
                  const isSelected = theme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      className={`ios-menu-item${isSelected ? ' is-selected' : ''}`}
                      onClick={() => handleSelectTheme(th.id)}
                    >
                      <span className="ios-menu-item-text">{th.label}</span>
                      {isSelected && <Check size={16} strokeWidth={2.5} className="ios-menu-check" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Clear History Options */}
            {activeMenu === 'clear' && (
              <div className="ios-menu-clear-box">
                <p className="ios-menu-clear-text">
                  {lang === 'ta'
                    ? 'வாசிப்பு வரலாற்றை அழிக்கவா?'
                    : 'Clear your local reading history?'}
                </p>
                <div className="ios-menu-clear-actions">
                  <button
                    type="button"
                    className="ios-menu-clear-btn"
                    onClick={handleClearHistory}
                  >
                    <Trash2 size={15} />
                    <span>{t('clearHistory')}</span>
                  </button>
                  <button
                    type="button"
                    className="ios-menu-cancel-btn"
                    onClick={() => setActiveMenu(null)}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}

            {/* Cancel Button */}
            {activeMenu !== 'clear' && (
              <button
                type="button"
                className="ios-menu-cancel-row"
                onClick={() => setActiveMenu(null)}
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Micro-Toast */}
      {toastMsg && (
        <div className="settings-toast-indicator">
          <span>{toastMsg}</span>
        </div>
      )}
    </main>
  );
}
