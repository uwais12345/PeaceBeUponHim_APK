import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home, BookOpen, MessageSquare, Heart, Hash, Compass,
  Library, Info, Menu, X, Settings, MapPin, Headphones, Sparkles
} from 'lucide-react';
import { useTheme, useLang } from '../../context/AppContext';
import '../../styles/navbar.css';

/* ── Primary links shown in the desktop top navbar (6 max) ── */
const DESKTOP_NAV = [
  { to: '/',        key: 'home',    icon: Home,         exact: true },
  { to: '/quran',   key: 'quran',   icon: BookOpen },
  { to: '/hadith',  key: 'hadith',  icon: MessageSquare },
  { to: '/dua',     key: 'dua',     icon: Heart },
  { to: '/dhikr',   key: 'dhikr',   icon: Hash },
  { to: '/explore', key: 'explore', icon: Compass },
];

/* ── Quick links in the mobile bottom bar ── */
const BOTTOM_NAV = [
  { to: '/',         key: 'home',     icon: Home,       exact: true },
  { to: '/quran',    key: 'quran',    icon: BookOpen },
  { to: '/qiraath',  key: 'qiraath',  icon: Headphones },
  { to: '/dua',      key: 'dua',      icon: Heart },
  { to: '/explore',  key: 'explore',  icon: Compass },
];

/* ── All destinations available in the slide-up drawer ── */
const MENU_LINKS = [
  { to: '/inspiration',   key: 'inspiration',    icon: Sparkles },
  { to: '/hadith',        key: 'hadith',         icon: MessageSquare },
  { to: '/dhikr',         key: 'dhikr',          icon: Hash },
  { to: '/nearby-masjids',key: 'nearbyMasjids',  icon: MapPin },
  { to: '/library',       key: 'library',        icon: Library },
  { to: '/about',         key: 'about',          icon: Info },
  { to: '/settings',      key: 'settings',       icon: Settings },
];

/* ─────────────────────────────────────────────
   Main Navbar
───────────────────────────────────────────── */
export default function Navbar({ onAuthClick }) {
  const { theme, toggle } = useTheme();
  const { t } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 10;
          setScrolled(prev => prev !== isScrolled ? isScrolled : prev);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Close drawer on route change */
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = e => { if (e.key === 'Escape') setMenuOpen(false); };
    const closeOnBack = e => {
      e.preventDefault();
      setMenuOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('pbuh:back', closeOnBack);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('pbuh:back', closeOnBack);
    };
  }, [menuOpen]);

  // On full-screen Mushaf reader pages, do not render top navbar or bottom navigation
  if (location.pathname.startsWith('/quran/mushaf/page')) {
    return null;
  }

  return (
    <>
      {/* ── Top navbar ── */}
      <nav
        className={`navbar${scrolled ? ' scrolled' : ''}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="container navbar-inner">

          {/* Left: Logo + brand */}
          <Link
            to="/"
            className="navbar-logo"
            aria-label="Peace be upon him — Home"
          >
            <img
              src="/channels4_profile.jpg"
              alt="Peace be upon him Logo"
              className="navbar-logo-img"
            />
            <div className="navbar-logo-text">
              <span className="navbar-logo-name">Peace Be Upon Him</span>
              <span className="navbar-logo-sub">@peacebeuponhim</span>
            </div>
          </Link>

          {/* Center: primary nav links (desktop only) */}
          <div className="navbar-links" role="menubar">
            {DESKTOP_NAV.map(({ to, key, icon: Icon, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
                role="menuitem"
                onClick={(e) => {
                  if (location.pathname === to) {
                    e.preventDefault();
                  }
                }}
              >
                <Icon size={14} aria-hidden="true" />
                {t(key)}
              </NavLink>
            ))}
          </div>

          {/* Right: Hamburger menu button */}
          <div className="navbar-actions">
            <button
              className="navbar-hamburger"
              onClick={() => setMenuOpen(v => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </nav>

      {/* ── Mobile bottom bar ── */}
      <nav className="bottom-nav" role="navigation" aria-label="Mobile navigation">
        <div className="bottom-nav-items">
          {BOTTOM_NAV.map(({ to, key, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
              aria-label={t(key)}
              onClick={(e) => {
                if (location.pathname === to) {
                  e.preventDefault();
                }
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavPill"
                      className="bottom-nav-pill"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                  <div className="bottom-nav-item-icon">
                    <Icon size={20} aria-hidden="true" />
                  </div>
                  <span className="bottom-nav-item-label">{t(key)}</span>
                </>
              )}
            </NavLink>
          ))}

          {/* "More" button opens the full drawer */}
          <button
            className={`bottom-nav-item${menuOpen ? ' active' : ''}`}
            onClick={() => setMenuOpen(v => !v)}
            aria-label={t('more')}
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
          >
            {menuOpen && (
              <motion.div
                layoutId="bottomNavPill"
                className="bottom-nav-pill"
                initial={false}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <div className="bottom-nav-item-icon">
              <Menu size={20} aria-hidden="true" />
            </div>
            <span className="bottom-nav-item-label">{t('more')}</span>
          </button>
        </div>
      </nav>

      {/* ── Overlay (menu drawer) ── */}
      <div
        className={`mobile-menu-overlay${menuOpen ? ' open' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Full navigation drawer ── */}
      <div
        className={`mobile-menu-drawer${menuOpen ? ' open' : ''}`}
        role={menuOpen ? 'dialog' : undefined}
        aria-label="Menu"
        aria-modal={menuOpen || undefined}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">{t('morePages')}</span>
          <button
            className="btn-icon"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mobile-menu-grid">
          {MENU_LINKS.map(({ to, key, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `mobile-menu-link${isActive ? ' active' : ''}`}
              onClick={(e) => {
                if (location.pathname === to) {
                  e.preventDefault();
                }
                setMenuOpen(false);
              }}
            >
              <Icon size={22} aria-hidden="true" />
              <span>{t(key)}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </>
  );
}
