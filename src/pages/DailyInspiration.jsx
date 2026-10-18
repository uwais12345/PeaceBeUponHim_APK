import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Download,
  SlidersHorizontal,
  X,
  BookOpen,
  MessageSquare,
  Heart,
  Sparkles,
} from 'lucide-react';
import {
  CATEGORIES,
  getLocalDateString,
  formatDisplayDate,
  getDailyInspirationsForDate,
  isItemSaved,
  toggleSaveInspiration,
  getSavedInspirations,
} from '../services/dailyInspiration';
import { copyInspirationText } from '../utils/posterGenerator';
import PosterModal from '../components/inspiration/PosterModal';
import BackButton from '../components/ui/BackButton';
import './DailyInspiration.css';

export default function DailyInspiration() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'saved'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentDateStr, setCurrentDateStr] = useState(getLocalDateString());
  const [posterItem, setPosterItem] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [toastMsg, setToastMsg] = useState('');
  const toastTimerRef = useRef(null);

  const todayStr = useMemo(() => getLocalDateString(), []);
  const isViewingToday = currentDateStr === todayStr;

  const showToast = (msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMsg(msg);
    toastTimerRef.current = setTimeout(() => setToastMsg(''), 2200);
  };

  useEffect(() => {
    setSavedCount(getSavedInspirations().length);
  }, []);

  const handleToggleSave = (id) => {
    const isNowSaved = toggleSaveInspiration(id);
    setSavedCount(getSavedInspirations().length);
    showToast(isNowSaved ? 'நினைவூட்டல் சேமிக்கப்பட்டது' : 'சேமிப்பிலிருந்து நீக்கப்பட்டது');
  };

  const handleCopy = async (item) => {
    await copyInspirationText(item);
    showToast('உரை நகலெடுக்கப்பட்டது');
  };

  // Date steppers
  const handlePrevDay = () => {
    const d = new Date(currentDateStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setCurrentDateStr(getLocalDateString(d));
  };

  const handleNextDay = () => {
    if (isViewingToday) return;
    const d = new Date(currentDateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setCurrentDateStr(getLocalDateString(d));
  };

  const handleResetToToday = () => {
    setCurrentDateStr(todayStr);
  };

  // Daily items
  const dailyData = useMemo(() => {
    return getDailyInspirationsForDate(currentDateStr);
  }, [currentDateStr]);

  const displayDailyItems = useMemo(() => {
    let items = dailyData.allToday;
    if (selectedCategory !== 'all') {
      items = items.filter(i => i.category === selectedCategory || i.category === 'everyone');
    }
    return items;
  }, [dailyData, selectedCategory]);

  const savedItems = useMemo(() => {
    const items = getSavedInspirations();
    if (selectedCategory !== 'all') {
      return items.filter(i => i.category === selectedCategory || i.category === 'everyone');
    }
    return items;
  }, [savedCount, selectedCategory]);

  const currentCategoryObj = CATEGORIES.find(c => c.id === selectedCategory) || CATEGORIES[0];

  return (
    <main className="page-wrapper inspiration-ios-page" id="main-content">
      <div className="inspiration-ios-shell">
        {/* Top iOS Navigation */}
        <div className="insp-top-nav">
          <BackButton fallback="/" label="Back" className="insp-back-arrow-btn" />

          <div className="insp-nav-actions">
            <button
              type="button"
              className={`insp-nav-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'saved' ? 'today' : 'saved')}
              aria-label="Saved reminders"
            >
              <Bookmark size={18} />
              {savedCount > 0 && <span className="insp-saved-dot">{savedCount}</span>}
            </button>
          </div>
        </div>

        {/* Large iOS Page Title */}
        <div className="insp-title-row">
          <h1 className="insp-main-title">
            {activeTab === 'saved' ? 'சேமித்தவை' : 'தினசரி வழிகாட்டல்'}
          </h1>
          <span className="insp-sub-caption">
            {activeTab === 'saved'
              ? `${savedItems.length} நினைவூட்டல்கள் சேமிக்கப்பட்டுள்ளன`
              : 'குர்ஆன் • நபிமொழி • துஆ'}
          </span>
        </div>

        {/* Section 1: Compact Date Bar & Horizontal Category Chips */}
        <div className="insp-controls-wrap">
          {/* Date Selector Row */}
          <div className="insp-date-bar">
            <button
              type="button"
              className="insp-date-nav-btn"
              onClick={handlePrevDay}
              aria-label="முந்தைய நாள்"
            >
              <ChevronLeft size={18} />
            </button>

            <button
              type="button"
              className="insp-date-center"
              onClick={handleResetToToday}
              aria-label="இன்றைய தேதிக்குச் செல்"
            >
              <span className="insp-date-label">
                {formatDisplayDate(currentDateStr, 'ta')}
              </span>
              {isViewingToday ? (
                <span className="insp-today-pill">இன்று</span>
              ) : (
                <span className="insp-reset-pill">இன்று செல்ல</span>
              )}
            </button>

            <button
              type="button"
              className={`insp-date-nav-btn ${isViewingToday ? 'disabled' : ''}`}
              onClick={handleNextDay}
              disabled={isViewingToday}
              aria-label="அடுத்த நாள்"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="insp-category-chips" role="tablist" aria-label="பிரிவுகள்">
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`insp-chip ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="insp-chip-icon">{cat.icon}</span>
                  <span className="insp-chip-text">{cat.tamil}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Items Cards List (Compact, Clean, Content-First) */}
        {activeTab === 'today' ? (
          <div className="insp-items-stack">
            {displayDailyItems.length === 0 ? (
              <div className="insp-empty-card">
                <p>தேர்ந்தெடுக்கப்பட்ட பிரிவில் இன்றைய பதிவுகள் இல்லை.</p>
                <button
                  type="button"
                  className="insp-link-btn"
                  onClick={() => setSelectedCategory('all')}
                >
                  அனைத்தையும் காண்க
                </button>
              </div>
            ) : (
              displayDailyItems.map(item => (
                <article key={item.id} className="insp-item-card">
                  {/* Meta Top: Type Badge & Bookmark */}
                  <div className="insp-card-meta">
                    <span className={`insp-type-tag ${item.type}`}>
                      {item.type === 'quran' ? 'குர்ஆன்' : item.type === 'hadith' ? 'ஹதீஸ்' : 'துஆ'}
                    </span>

                    <button
                      type="button"
                      className={`insp-bookmark-btn ${isItemSaved(item.id) ? 'saved' : ''}`}
                      onClick={() => handleToggleSave(item.id)}
                      aria-label={isItemSaved(item.id) ? 'சேமிப்பிலிருந்து நீக்குக' : 'சேமிக்க'}
                    >
                      {isItemSaved(item.id) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                    </button>
                  </div>

                  {/* Title */}
                  <h2 className="insp-card-title">{item.titleTamil}</h2>

                  {/* Arabic Text (Right-aligned, clean Amiri calligraphy) */}
                  {item.arabic && (
                    <div className="insp-card-arabic arabic-text notranslate" dir="rtl" lang="ar" translate="no">
                      {item.arabic}
                    </div>
                  )}

                  {/* Tamil Meaning (Left-aligned, natural wrapping) */}
                  <p className="insp-card-meaning tamil-text">
                    {item.meaning_tamil}
                  </p>

                  {/* Lesson / Context (Clean editorial callout with left accent) */}
                  {item.contextTamil && (
                    <div className="insp-card-lesson">
                      <span className="insp-lesson-lead">படிப்பினை</span>
                      <span className="insp-lesson-text tamil-text">{item.contextTamil}</span>
                    </div>
                  )}

                  {/* Footer Row: Source on left, Compact Actions on right */}
                  <div className="insp-card-footer">
                    <span className="insp-card-source">{item.source}</span>
                    <div className="insp-action-buttons">
                      <button
                        type="button"
                        className="insp-btn insp-btn-poster"
                        onClick={() => setPosterItem(item)}
                        title="போஸ்டர் பதிவிறக்கு"
                        aria-label="போஸ்டர் பதிவிறக்கு"
                      >
                        <Download size={12} aria-hidden="true" />
                        <span>போஸ்டர்</span>
                      </button>

                      <button
                        type="button"
                        className="insp-btn insp-btn-copy"
                        onClick={() => handleCopy(item)}
                        title="நகலெடு"
                        aria-label="நகலெடு"
                      >
                        <Copy size={12} aria-hidden="true" />
                        <span>நகலெடு</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        ) : (
          /* Saved Items View */
          <div className="insp-items-stack">
            {savedItems.length === 0 ? (
              <div className="insp-empty-card">
                <p>சேமிக்கப்பட்ட நினைவூட்டல்கள் ஏதுமில்லை.</p>
                <button
                  type="button"
                  className="insp-link-btn"
                  onClick={() => setActiveTab('today')}
                >
                  இன்றைய நினைவூட்டல்களுக்குச் செல்
                </button>
              </div>
            ) : (
              savedItems.map(item => (
                <article key={item.id} className="insp-item-card">
                  <div className="insp-card-meta">
                    <span className={`insp-type-tag ${item.type}`}>
                      {item.type === 'quran' ? 'குர்ஆன்' : item.type === 'hadith' ? 'ஹதீஸ்' : 'துஆ'}
                    </span>

                    <button
                      type="button"
                      className="insp-bookmark-btn saved"
                      onClick={() => handleToggleSave(item.id)}
                      aria-label="சேமிப்பிலிருந்து நீக்குக"
                    >
                      <BookmarkCheck size={16} />
                    </button>
                  </div>

                  <h2 className="insp-card-title">{item.titleTamil}</h2>

                  {item.arabic && (
                    <div className="insp-card-arabic arabic-text notranslate" dir="rtl" lang="ar" translate="no">
                      {item.arabic}
                    </div>
                  )}

                  <p className="insp-card-meaning tamil-text">
                    {item.meaning_tamil}
                  </p>

                  {item.contextTamil && (
                    <div className="insp-card-lesson">
                      <span className="insp-lesson-lead">படிப்பினை</span>
                      <span className="insp-lesson-text tamil-text">{item.contextTamil}</span>
                    </div>
                  )}

                  <div className="insp-card-footer">
                    <span className="insp-card-source">{item.source}</span>
                    <div className="insp-action-buttons">
                      <button
                        type="button"
                        className="insp-btn insp-btn-poster"
                        onClick={() => setPosterItem(item)}
                        title="போஸ்டர் பதிவிறக்கு"
                        aria-label="போஸ்டர் பதிவிறக்கு"
                      >
                        <Download size={12} aria-hidden="true" />
                        <span>போஸ்டர்</span>
                      </button>

                      <button
                        type="button"
                        className="insp-btn insp-btn-copy"
                        onClick={() => handleCopy(item)}
                        title="நகலெடு"
                        aria-label="நகலெடு"
                      >
                        <Copy size={12} aria-hidden="true" />
                        <span>நகலெடு</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        )}

        {/* Minimal Toast Indicator */}
        {toastMsg && (
          <div className="insp-toast" role="status" aria-live="polite">
            <Check size={16} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Poster Modal */}
        {posterItem && (
          <PosterModal
            item={posterItem}
            dateStr={currentDateStr}
            onClose={() => setPosterItem(null)}
          />
        )}
      </div>
    </main>
  );
}
