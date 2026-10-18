// ============================================
// QIRAATH SERVICE
// Provides reciter metadata and surah-level audio URLs
// Audio source: cdn.mp3quran.net (verified HTTP 200, audio/mpeg)
// License: mp3quran.net is a non-profit Quran audio platform providing
//   free access to Quran recitations for Islamic educational purposes.
// API: www.mp3quran.net/api/v3 (CORS-friendly, free, no key required)
// ============================================

import { getSurahs } from './quran';

export const QIRAATH_RECITERS = [
  {
    id: 'mishary-alafasy',
    mp3quranId: 123,
    moshafId: 123,
    name: 'Mishary Rashid Alafasy',
    nameArabic: 'مشاري راشد العفاسي',
    nameTamil: 'மிஷாரி ரஷீத் அல்அஃபாசி',
    role: 'குறைத்தின் பிரபல காரி',
    roleEn: 'Renowned International Qari',
    badge: 'முழு குர்ஆன்',
    badgeEn: 'Full Quran',
    style: 'Murattal',
    styleTamil: 'முர்ரதல்',
    surahCount: 114,
    server: 'https://cdn.mp3quran.net/audio/mishary-alafasy/r1/',
    photo: '/reciters/mishary-alafasy.jpg',
    country: 'Kuwait',
    countryFlag: '🇰🇼',
    category: 'haramain',
    verified: true,
  },
  {
    id: 'maher-muaiqly',
    mp3quranId: 102,
    moshafId: 102,
    name: 'Maher Al-Muaiqly',
    nameArabic: 'ماهر المعيقلي',
    nameTamil: 'மாஹர் அல்-முஐக்லி',
    role: 'மஸ்ஜிதுல் ஹராம்',
    roleEn: 'Imam of Masjid Al-Haram, Makkah',
    badge: '114 சூரா',
    badgeEn: '114 Surahs',
    style: 'Murattal',
    styleTamil: 'முர்ரதல்',
    surahCount: 114,
    server: 'https://cdn.mp3quran.net/audio/maher-muaiqly/r1/',
    photo: '/reciters/maher-muaiqly.jpg',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    category: 'haramain',
    verified: true,
  },
  {
    id: 'muhammad-al-minshawi',
    mp3quranId: 112,
    moshafId: 112,
    name: 'Muhammad Siddiq Al-Minshawi',
    nameArabic: 'محمد صديق المنشاوي',
    nameTamil: 'முஹம்மத் சித்தீக் அல்-மின்ஷாவி',
    role: 'சிரேஷ்ட எகிப்திய காரி',
    roleEn: 'Legendary Egyptian Qari',
    badge: 'முழு குர்ஆன்',
    badgeEn: 'Full Quran',
    style: 'Murattal',
    styleTamil: 'முர்ரதல்',
    surahCount: 114,
    server: 'https://cdn.mp3quran.net/audio/muhammad-minshawi/r1/',
    photo: '/reciters/minshawi.jpg',
    country: 'Egypt',
    countryFlag: '🇪🇬',
    category: 'classic',
    verified: true,
  },
  {
    id: 'bandar-baleela',
    mp3quranId: 217,
    moshafId: 217,
    name: 'Sheikh Bandar Baleela',
    nameArabic: 'الشيخ بندر بن عبد العزيز بليلة',
    nameTamil: 'பந்தர் பலீலா',
    role: 'Imam of Al-Masjid Al-Haram',
    roleEn: 'Imam of Masjid Al-Haram, Makkah',
    badge: 'ஹராமின் தலைவர்',
    badgeEn: 'Haramain Imam',
    style: 'Murattal',
    styleTamil: 'முர்ரதல்',
    surahCount: 114,
    server: 'https://cdn.mp3quran.net/audio/bandar-baleela/r1/',
    photo: '/reciters/bandar-baleela.jpg',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    category: 'haramain',
    verified: true,
  },
  {
    id: 'abdulrahman-sudais',
    mp3quranId: 54,
    moshafId: 54,
    name: 'Abdur-Rahman Al-Sudais',
    nameArabic: 'عبد الرحمن السديس',
    nameTamil: 'அப்துர் ரஹ்மான் அல்-சுதைஸ்',
    role: 'மக்கா முஸ்தஹ் இமாம்',
    roleEn: 'Chief Imam, Masjid Al-Haram',
    badge: 'தவஞ்ஞு சிறப்பு',
    badgeEn: 'Haramain Special',
    style: 'Murattal',
    styleTamil: 'முர்ரதல்',
    surahCount: 114,
    server: 'https://cdn.mp3quran.net/audio/abdulrahman-sudais/r1/',
    photo: '/reciters/abdulrahman-sudais.jpg',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    category: 'haramain',
    verified: true,
  },
  {
    id: 'yasser-dosari',
    mp3quranId: 92,
    moshafId: 92,
    name: 'Yasser Al-Dosari',
    nameArabic: 'ياسر الدوسري',
    nameTamil: 'யாசர் அல்-தோசரி',
    role: 'மஸ்ஜிதுல் ஹராம்',
    roleEn: 'Imam of Masjid Al-Haram',
    badge: '114 சூரா',
    badgeEn: '114 Surahs',
    style: 'Murattal',
    styleTamil: 'தணச்சிமிகு ஓதல்',
    surahCount: 114,
    server: 'https://cdn.mp3quran.net/audio/yasser-dosari/r1/',
    photo: '/reciters/yasser-dosari.jpg',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    category: 'haramain',
    verified: true,
  },
  {
    id: 'abdulbasit-abdulsamad',
    mp3quranId: 51,
    moshafId: 53,
    name: 'Abdul Basit Abdus-Samad',
    nameArabic: 'عبد الباسط عبد الصمد',
    nameTamil: 'அப்துல் பாஸித்',
    role: 'முஸ்லிம் முறை',
    roleEn: 'Classical Mujawwad Style',
    badge: 'அரிய பதிவுகள்',
    badgeEn: 'Classic Recordings',
    style: 'Murattal',
    styleTamil: 'கற்றல் முறை',
    surahCount: 114,
    server: 'https://cdn.mp3quran.net/audio/abdulbasit-abdulsamad/r3/',
    photo: '/reciters/abdulbasit-abdulsamad.jpg',
    country: 'Egypt',
    countryFlag: '🇪🇬',
    category: 'classic',
    verified: true,
  },
  {
    id: 'ahmed-al-ajamy',
    mp3quranId: 5,
    moshafId: 5,
    name: 'Ahmed ibn Ali Al-Ajamy',
    nameArabic: 'أحمد بن علي العجمي',
    nameTamil: 'அஹ்மத் இப்னு அலி அல்-அஜ்மி',
    role: 'பிரபல சர்வதேச காரி',
    roleEn: 'Renowned International Qari',
    badge: 'முழு குர்ஆன்',
    badgeEn: 'Full Quran',
    style: 'Murattal',
    styleTamil: 'முர்ரதல்',
    surahCount: 114,
    server: 'https://cdn.mp3quran.net/audio/ahmad-ajmi/r1/',
    photo: '/reciters/ahmed-al-ajamy.png',
    country: 'Saudi Arabia',
    countryFlag: '🇸🇦',
    category: 'classic',
    verified: true,
  },
];

const SURAH_AUDIO_CACHE = new Map();

/**
 * Build a padded audio URL: server + "001.mp3"
 */
export function getSurahAudioUrl(reciter, surahNumber) {
  const pad = String(surahNumber).padStart(3, '0');
  return `${reciter.server}${pad}.mp3`;
}

/**
 * Get full surah list with metadata from the existing quran service,
 * then annotate with audio URLs for this reciter.
 */
export async function getReciterSurahs(reciterId) {
  const cacheKey = `qiraath_surahs_${reciterId}`;
  if (SURAH_AUDIO_CACHE.has(cacheKey)) return SURAH_AUDIO_CACHE.get(cacheKey);

  const reciter = QIRAATH_RECITERS.find(r => r.id === reciterId);
  if (!reciter) throw new Error('Unknown reciter');

  // Get surah list from existing service
  const surahs = await getSurahs();

  // Build list with audio URLs
  const result = surahs.map(s => ({
    id: s.id,
    name: s.name_simple,
    nameArabic: s.name_arabic,
    verseCount: s.verses_count,
    revelationType: s.revelation_place || s.revelation_type,
    audioUrl: getSurahAudioUrl(reciter, s.id),
    reciterId: reciter.id,
  }));

  SURAH_AUDIO_CACHE.set(cacheKey, result);
  return result;
}

// Recent listening history helpers
export function saveRecentSurah(reciterId, surahId, position = 0) {
  try {
    const key = 'qiraath_recent';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    const filtered = existing.filter(
      r => !(r.reciterId === reciterId && r.surahId === surahId)
    );
    filtered.unshift({ reciterId, surahId, position, at: Date.now() });
    localStorage.setItem(key, JSON.stringify(filtered.slice(0, 20)));
  } catch {
    // ignore storage errors
  }
}

export function loadRecentSurah() {
  try {
    return JSON.parse(localStorage.getItem('qiraath_recent') || '[]');
  } catch {
    return [];
  }
}

export function saveRecentReciterId(reciterId) {
  try {
    localStorage.setItem('qiraath_last_reciter', reciterId);
  } catch { /* ignore */ }
}

export function loadRecentReciterId() {
  try {
    return localStorage.getItem('qiraath_last_reciter') || null;
  } catch { return null; }
}
