// ============================================
// DAILY ISLAMIC INSPIRATION SERVICE
// Offline-first, verified Islamic reminders:
// - Quran Verse of the Day
// - Authentic Hadith of the Day
// - Dua of the Day
// ============================================

import inspirationsData from '../data/dailyInspirations.json';

const SAVED_STORAGE_KEY = 'pbuh_saved_inspirations';

export const CATEGORIES = [
  { id: 'all', name: 'All', tamil: 'அனைத்தும்', icon: '✨' },
  { id: 'everyone', name: 'Everyone', tamil: 'அனைவருக்கும்', icon: '🌍' },
  { id: 'students', name: 'Students', tamil: 'மாணவர்கள்', icon: '🎓' },
  { id: 'youth', name: 'Youth', tamil: 'இளைஞர்கள்', icon: '🌱' },
  { id: 'adults', name: 'Adults', tamil: 'பெரியவர்கள்', icon: '💼' },
  { id: 'family', name: 'Family', tamil: 'குடும்பம்', icon: '👨‍👩‍👧‍👦' },
];

export const CONTENT_TYPES = [
  { id: 'all', name: 'All Reminders', tamil: 'அனைத்தும்', icon: '✨' },
  { id: 'quran', name: 'Quran Verse', tamil: 'திருக்குர்ஆன்', icon: '📖' },
  { id: 'hadith', name: 'Authentic Hadith', tamil: 'நபிமொழி', icon: '📜' },
  { id: 'dua', name: 'Dua of the Day', tamil: 'துஆ', icon: '🤲' },
];

/**
 * Returns today's local date string formatted as YYYY-MM-DD
 */
export function getLocalDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a date string or Date object to a human-readable display date
 */
export function formatDisplayDate(dateInput, lang = 'ta') {
  const date = typeof dateInput === 'string' ? new Date(dateInput + 'T00:00:00') : new Date(dateInput);
  if (lang === 'ta') {
    return date.toLocaleDateString('ta-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Simple deterministic hash for a date string to pick items cleanly
 */
function getDaySeed(dateStr) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Get daily items (Quran, Hadith, Dua) for a specific date
 */
export function getDailyInspirationsForDate(dateStr = getLocalDateString()) {
  const seed = getDaySeed(dateStr);

  const quranItems = inspirationsData.filter(i => i.type === 'quran');
  const hadithItems = inspirationsData.filter(i => i.type === 'hadith');
  const duaItems = inspirationsData.filter(i => i.type === 'dua');

  const quran = quranItems[seed % quranItems.length];
  const hadith = hadithItems[(seed + 1) % hadithItems.length];
  const dua = duaItems[(seed + 2) % duaItems.length];

  return {
    date: dateStr,
    quran,
    hadith,
    dua,
    allToday: [quran, hadith, dua],
  };
}

/**
 * Get a single inspiration by ID
 */
export function getInspirationById(id) {
  return inspirationsData.find(item => item.id === id) || null;
}

/**
 * Filter inspirations by category and type
 */
export function getInspirations({ category = 'all', type = 'all', query = '' } = {}) {
  return inspirationsData.filter(item => {
    if (category !== 'all' && item.category !== category) return false;
    if (type !== 'all' && item.type !== type) return false;
    if (query) {
      const q = query.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.titleTamil.toLowerCase().includes(q) ||
        item.meaning_tamil.toLowerCase().includes(q) ||
        item.meaning_english.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.arabic.includes(query);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Get inspiration history for previous days (prevents repetition)
 */
export function getInspirationHistory(daysBack = 14) {
  const history = [];
  const today = new Date();

  for (let i = 0; i < daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateString(d);
    const daily = getDailyInspirationsForDate(dateStr);
    history.push({
      dateStr,
      displayDateTamil: formatDisplayDate(dateStr, 'ta'),
      displayDateEnglish: formatDisplayDate(dateStr, 'en'),
      items: daily.allToday,
      isToday: i === 0,
    });
  }

  return history;
}

// ----------------------------------------------------
// Saved Reminders (Favorites)
// ----------------------------------------------------

export function getSavedInspirationIds() {
  try {
    const raw = localStorage.getItem(SAVED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isItemSaved(id) {
  const saved = getSavedInspirationIds();
  return saved.includes(id);
}

export function toggleSaveInspiration(id) {
  try {
    const saved = getSavedInspirationIds();
    const index = saved.indexOf(id);
    let updated;
    if (index >= 0) {
      updated = saved.filter(savedId => savedId !== id);
    } else {
      updated = [id, ...saved];
    }
    localStorage.setItem(SAVED_STORAGE_KEY, JSON.stringify(updated));
    return updated.includes(id);
  } catch (e) {
    console.error('Failed to update saved reminders:', e);
    return false;
  }
}

export function getSavedInspirations() {
  const ids = getSavedInspirationIds();
  return ids
    .map(id => inspirationsData.find(item => item.id === id))
    .filter(Boolean);
}
