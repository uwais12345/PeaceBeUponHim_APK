import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Clock, Search, X } from 'lucide-react';
import juzList from '../data/juz_13lines.json';
import { useLang } from '../context/AppContext';
import BackButton from '../components/ui/BackButton';
import './Settings.css';
import './MushafJuzIndex.css';

function getLastRead() {
  try {
    const saved = localStorage.getItem('mushaf_13lines_last_read');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export default function MushafJuzIndex() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [lastRead] = useState(getLastRead);
  const { t, lang } = useLang();

  const filteredJuz = useMemo(() => {
    const search = query.trim().toLocaleLowerCase();
    if (!search) return juzList;
    return juzList.filter((item) => (
      String(item.juz) === search ||
      item.name_ar?.includes(query.trim()) ||
      item.name_en?.toLocaleLowerCase().includes(search) ||
      item.tamil?.toLocaleLowerCase().includes(search) ||
      item.start_surah?.toLocaleLowerCase().includes(search)
    ));
  }, [query]);

  // Localized strings
  const pageTitle = lang === 'ar' ? 'القرآن الكريم' : lang === 'en' ? 'Holy Quran' : 'திருக்குர்ஆன்';
  const searchPlaceholder = lang === 'ar' ? 'ابحث عن رقم الجزء أو اسمه...' : lang === 'en' ? 'Search by Juz number or name...' : 'ஜுஸ்ஃ எண் அல்லது பெயர் தேடுக...';
  const lastReadLabel = lang === 'ar' ? 'آخر قراءة' : lang === 'en' ? 'Last read' : 'கடைசியாக வாசித்தது';
  const noResultLabel = lang === 'ar' ? 'لم يتم العثور على أي جزء' : lang === 'en' ? 'No Juz found' : 'ஜுஸ்ஃ எதுவும் கிடைக்கவில்லை';
  const juzLabel = lang === 'ar' ? 'جزء' : lang === 'en' ? 'Juz' : 'ஜுஸ்ஃ';
  const pageLabel = lang === 'ar' ? 'صفحة' : lang === 'en' ? 'Page' : 'பக்கம்';
  const continueLabel = lang === 'ar' ? 'متابعة' : lang === 'en' ? 'Continue' : 'தொடர்க';
  const juzIndexHeading = lang === 'ar' ? 'أجزاء القرآن الكريم' : lang === 'en' ? '30 Juz Index' : '30 ஜுஸ்ஃ பட்டியல்';

  return (
    <main className="page-wrapper settings-page" id="main-content">
      <div className="settings-shell">
        {/* Top Back Navigation with Reader Action */}
        <div className="settings-top-nav mushaf-top-nav">
          <BackButton fallback="/" label={t('back') || 'Back'} />
          <button
            type="button"
            className="mushaf-header-action-btn"
            onClick={() => navigate(lastRead ? `/quran/mushaf/page/${lastRead.page}` : '/quran/mushaf/page/1')}
            aria-label={lang === 'ar' ? 'فتح المصحف' : lang === 'ta' ? 'குர்ஆன் ஓதுதல்' : 'Open Mushaf'}
            title={lang === 'ar' ? 'فتح المصحف' : lang === 'ta' ? 'குர்ஆன் ஓதுதல்' : 'Open Mushaf'}
          >
            <BookOpen size={20} />
          </button>
        </div>

        {/* Large Bold Page Title */}
        <h1 className="settings-main-title">{pageTitle}</h1>

        {/* Last Read Inset Card */}
        {lastRead && (
          <div className="settings-group-wrap">
            <div className="settings-card-group">
              <button
                type="button"
                className="settings-card-row mushaf-last-read-row"
                onClick={() => navigate(`/quran/mushaf/page/${lastRead.page}`)}
              >
                <div className="mushaf-row-left">
                  <span className="mushaf-clock-squircle" aria-hidden="true">
                    <Clock size={17} />
                  </span>
                  <div className="settings-row-text-group">
                    <span className="mushaf-last-read-kicker">{lastReadLabel}</span>
                    <span className="settings-row-label">
                      {juzLabel} {lastRead.juz} · {pageLabel} {lastRead.page}
                    </span>
                  </div>
                </div>
                <div className="settings-row-value-wrap">
                  <span className="mushaf-resume-pill">{continueLabel}</span>
                  <ChevronRight size={19} className="settings-row-chevron" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* iOS-Style Search Field */}
        <div className="settings-group-wrap">
          <div className="mushaf-ios-search-field">
            <Search size={16} className="mushaf-ios-search-icon" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="mushaf-ios-search-input"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mushaf-ios-clear-btn"
                aria-label="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* 30 Juz Inset Card Group */}
        <div className="settings-group-wrap">
          <div className="mushaf-group-header-row">
            <h2 className="settings-group-heading">{juzIndexHeading}</h2>
            <span className="mushaf-count-caption">{filteredJuz.length} / 30</span>
          </div>

          <div className="settings-card-group">
            {filteredJuz.map((item) => (
              <button
                key={item.juz}
                type="button"
                className="settings-card-row mushaf-juz-card-row"
                onClick={() => navigate(`/quran/mushaf/page/${item.page_start}`)}
              >
                <div className="mushaf-row-left">
                  <span className="mushaf-juz-num">
                    {String(item.juz).padStart(2, '0')}
                  </span>
                  <div className="settings-row-text-group">
                    <span className="settings-row-label">
                      {lang === 'ar' ? item.name_ar : lang === 'ta' ? (item.tamil || item.name_en) : item.name_en}
                    </span>
                    <span className="settings-row-subtext">
                      {item.start_surah} · {pageLabel} {item.page_start}
                    </span>
                  </div>
                </div>
                <div className="mushaf-row-right">
                  <span className="mushaf-juz-arabic notranslate" lang="ar" dir="rtl">
                    {item.name_ar}
                  </span>
                  <ChevronRight size={19} className="settings-row-chevron" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredJuz.length === 0 && (
          <div className="settings-group-wrap">
            <div className="settings-card-group mushaf-empty-card">
              <Search size={32} className="mushaf-empty-icon" />
              <p className="mushaf-empty-title">{noResultLabel}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
