// ============================================
// HADITH SERVICE
// Uses https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1
// ============================================

const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
const cache = new Map();

// Hadith is online-only — fetches from cdn.jsdelivr.net at runtime.
// In-memory cache deduplicates repeated calls within the same session.
async function fetchCached(url) {
  if (cache.has(url)) return cache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hadith API error: ${res.status}`);
  const data = await res.json();
  cache.set(url, data);
  return data;
}

// Available collections
export const COLLECTIONS = [
  {
    id: 'bukhari',
    apiId: 'eng-bukhari',
    name: 'ஸஹீஹ் அல்-புகாரி',
    arabicName: 'صحيح البخاري',
    author: 'இமாம் புகாரி',
    grade: 'Sahih',
    description: 'இமாம் முஹம்மது இப்னு இஸ்மாயில் அல்-புகாரி அவர்களால் தொகுக்கப்பட்ட, ஹதீஸ்களின் மிகவும் நம்பகமான தொகுப்பு.',
    total: 7563,
  },
  {
    id: 'muslim',
    apiId: 'eng-muslim',
    name: 'ஸஹீஹ் முஸ்லிம்',
    arabicName: 'صحيح مسلم',
    author: 'இமாம் முஸ்லிம் இப்னு அல்-ஹஜ்ஜாஜ்',
    grade: 'Sahih',
    description: 'ஸஹீஹ் அல்-புகாரிக்கு அடுத்தபடியாக கருதப்படும் மிக முக்கியமான ஆறு ஹதீஸ் தொகுப்புகளில் ஒன்று.',
    total: 7190,
  },
  {
    id: 'abu-dawud',
    apiId: 'eng-abudawud',
    name: 'சுனன் அபூ தாவூத்',
    arabicName: 'سنن أبي داود',
    author: 'இமாம் அபூ தாவூத்',
    grade: 'Mixed',
    description: 'மார்க்க சட்டங்களை மையமாகக் கொண்ட குதுப் அஸ்-ஸித்தா (ஆறு முக்கிய நூல்கள்) தொகுப்புகளில் ஒன்று.',
    total: 5274,
  },
  {
    id: 'tirmidzi',
    apiId: 'eng-tirmidhi',
    name: "ஜாமிஅத்-திர்மிதி",
    arabicName: 'جامع الترمذي',
    author: 'இமாம் திர்மிதி',
    grade: 'Mixed',
    description: 'ஹதீஸ்களின் தரவரிசை குறிப்புகளையும் உள்ளடக்கிய சிறப்பான தொகுப்பு.',
    total: 3956,
  },
  {
    id: 'nasai',
    apiId: 'eng-nasai',
    name: "சுனன் அந்-நஸாயீ",
    arabicName: 'سنن النسائي',
    author: "இமாம் அந்-நஸாயீ",
    grade: 'Mixed',
    description: 'ஹதீஸ் விமர்சனத்தில் கடுமையான நிபந்தனைகளை கொண்ட ஆறு முக்கிய நூல்களில் ஒன்று.',
    total: 5662,
  },
  {
    id: 'ibnu-majah',
    apiId: 'eng-ibnmajah',
    name: 'சுனன் இப்னு மாஜா',
    arabicName: 'سنن ابن ماجه',
    author: 'இமாம் இப்னு மாஜா',
    grade: 'Mixed',
    description: 'இமாம் இப்னு மாஜா அவர்களால் தொகுக்கப்பட்ட ஆறு முக்கிய ஹதீஸ் நூல்களில் ஆறாவது நூல்.',
    total: 4341,
  },
  {
    id: 'malik',
    apiId: 'eng-malik',
    name: "முவத்தா மாலிக்",
    arabicName: 'موطأ مالك',
    author: 'இமாம் மாலிக் இப்னு அனஸ்',
    grade: 'Mixed',
    description: 'இஸ்லாமிய சட்டம் மற்றும் ஹதீஸ்களின் ஆரம்பகால தொகுப்புகளில் ஒன்று.',
    total: 1832,
  },
];

export function getCollection(id) {
  return COLLECTIONS.find(c => c.id === id) || null;
}

// Get hadiths from a collection
export async function getHadithsByBook(collectionId, bookId) {
  try {
    const col = getCollection(collectionId);
    if (!col) throw new Error('Collection not found');

    const collectionKey = col.id === 'abu-dawud' ? 'abudawud' : col.id === 'tirmidzi' ? 'tirmidhi' : col.id === 'ibnu-majah' ? 'ibnmajah' : col.id;
    
    // Fetch only the specific book (section) which is just a few KB instead of 5MB
    const [araData, tamData, engData] = await Promise.all([
      fetchCached(`${BASE}/ara-${collectionKey}/sections/${bookId}.min.json`).catch(() => null),
      fetchCached(`${BASE}/tam-${collectionKey}/sections/${bookId}.min.json`).catch(() => null),
      fetchCached(`${BASE}/eng-${collectionKey}/sections/${bookId}.min.json`).catch(() => null),
    ]);

    const transData = tamData && tamData.hadiths ? tamData : engData;
    if (!transData || !transData.hadiths) return { hadiths: [], error: 'Failed to load' };

    const formattedHadiths = transData.hadiths.map((h, i) => {
      const araText = araData?.hadiths?.[i]?.text || '';
      const engText = engData?.hadiths?.[i]?.text || '';
      return {
        number: h.hadithnumber,
        arab: araText,
        translation: h.text,
        engTranslation: engText,
        id: `${h.reference?.book}-${h.reference?.hadith}`
      };
    });

    return {
      hadiths: formattedHadiths,
      name: col.name,
      bookName: transData.metadata?.section?.[bookId] || `Book ${bookId}`,
      total: transData.hadiths.length,
    };
  } catch (err) {
    console.error(err);
    return { hadiths: [], error: err.message };
  }
}

export async function getHadiths(collectionId, { page = 1, limit = 20 } = {}) {
  try {
    const col = getCollection(collectionId);
    if (!col) throw new Error('Collection not found');

    const collectionKey = col.id === 'abu-dawud' ? 'abudawud' : col.id === 'tirmidzi' ? 'tirmidhi' : col.id === 'ibnu-majah' ? 'ibnmajah' : col.id;
    
    const [araData, tamData, engData] = await Promise.all([
      fetchCached(`${BASE}/ara-${collectionKey}.min.json`).catch(() => null),
      fetchCached(`${BASE}/tam-${collectionKey}.min.json`).catch(() => null),
      fetchCached(`${BASE}/eng-${collectionKey}.min.json`).catch(() => null),
    ]);

    const transData = tamData && tamData.hadiths ? tamData : engData;
    if (!transData || !transData.hadiths) return { hadiths: [], error: 'Failed to load' };

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Format to match old UI expectations
    const formattedHadiths = transData.hadiths.slice(startIndex, endIndex).map((h, i) => {
      const realIndex = startIndex + i;
      const araText = araData?.hadiths?.[realIndex]?.text || '';
      const engText = engData?.hadiths?.[realIndex]?.text || '';
      return {
        number: h.hadithnumber,
        arab: araText,
        translation: h.text,
        engTranslation: engText,
        id: `${h.reference?.book}-${h.reference?.hadith}`
      };
    });

    return {
      hadiths: formattedHadiths,
      name: transData.metadata?.name || col.name,
      total: transData.hadiths.length,
    };
  } catch (e) {
    return { hadiths: [], error: e.message };
  }
}

// Get a single hadith by number
export async function getHadith(collectionId, number) {
  try {
    const col = getCollection(collectionId);
    if (!col) return null;

    const collectionKey = col.id === 'abu-dawud' ? 'abudawud' : col.id === 'tirmidzi' ? 'tirmidhi' : col.id === 'ibnu-majah' ? 'ibnmajah' : col.id;

    const [araData, tamData, engData] = await Promise.all([
      fetchCached(`${BASE}/ara-${collectionKey}.min.json`).catch(() => null),
      fetchCached(`${BASE}/tam-${collectionKey}.min.json`).catch(() => null),
      fetchCached(`${BASE}/eng-${collectionKey}.min.json`).catch(() => null),
    ]);

    const transData = tamData && tamData.hadiths ? tamData : engData;
    if (!transData || !transData.hadiths) return null;

    const hIndex = transData.hadiths.findIndex(x => String(x.hadithnumber) === String(number));
    if (hIndex === -1) return null;
    
    const h = transData.hadiths[hIndex];
    const araText = araData?.hadiths?.[hIndex]?.text || '';

    return {
      number: h.hadithnumber,
      arab: araText,
      translation: h.text,
      id: `${h.reference?.book}-${h.reference?.hadith}`
    };
  } catch {
    return null;
  }
}

// List available books in a collection (api provides)
export async function getBooks(collection) {
  // The free API doesn't have book endpoints; we use curated data
  return COLLECTION_BOOKS[collection] || [];
}

// Curated book data for Sahih al-Bukhari (for display)
export const COLLECTION_BOOKS = {
  bukhari: [
    { number: 1, name: 'Revelation', arabicName: 'بدء الوحي', count: 7 },
    { number: 2, name: 'Belief', arabicName: 'الإيمان', count: 50 },
    { number: 3, name: 'Knowledge', arabicName: 'العلم', count: 134 },
    { number: 4, name: 'Ablutions (Wudu)', arabicName: 'الوضوء', count: 247 },
    { number: 5, name: 'Bathing (Ghusl)', arabicName: 'الغسل', count: 45 },
    { number: 6, name: 'Menstrual Periods', arabicName: 'الحيض', count: 32 },
    { number: 7, name: 'Rubbing Hands and Feet', arabicName: 'التيمم', count: 10 },
    { number: 8, name: 'Prayers (Salah)', arabicName: 'الصلاة', count: 172 },
    { number: 9, name: 'Times of the Prayers', arabicName: 'مواقيت الصلاة', count: 48 },
    { number: 10, name: 'Call to Prayer', arabicName: 'الأذان', count: 166 },
    { number: 11, name: 'Friday Prayer', arabicName: 'الجمعة', count: 46 },
    { number: 12, name: 'Fear Prayer', arabicName: 'صلاة الخوف', count: 7 },
    { number: 13, name: 'The Two Festivals (Eids)', arabicName: 'العيدين', count: 38 },
    { number: 14, name: 'Witr Prayer', arabicName: 'الوتر', count: 15 },
    { number: 15, name: 'Invoking Allah for Rain', arabicName: 'الاستسقاء', count: 13 },
    { number: 16, name: 'Prostration During Quran Recitation', arabicName: 'سجود القرآن', count: 12 },
    { number: 17, name: 'Shortening the Prayers', arabicName: 'التقصير', count: 56 },
    { number: 18, name: 'Prayer at Night (Tahajjud)', arabicName: 'التهجد', count: 111 },
    { number: 19, name: "Actions While Praying", arabicName: 'العمل في الصلاة', count: 26 },
    { number: 20, name: 'Funerals', arabicName: 'الجنائز', count: 158 },
    { number: 21, name: 'Obligatory Charity Tax (Zakat)', arabicName: 'الزكاة', count: 163 },
    { number: 22, name: 'Hajj (Pilgrimage)', arabicName: 'الحج', count: 259 },
    { number: 23, name: 'Minor Pilgrimage (Umra)', arabicName: 'العمرة', count: 25 },
    { number: 24, name: 'Pilgrims Prevented from Completing the Pilgrimage', arabicName: 'المحصر', count: 12 },
    { number: 25, name: 'Penalty of Hunting while on Pilgrimage', arabicName: 'جزاء الصيد', count: 30 },
    { number: 26, name: 'Virtues of Medina', arabicName: 'فضائل المدينة', count: 19 },
    { number: 27, name: 'Fasting', arabicName: 'الصوم', count: 104 },
    { number: 28, name: 'Night Prayer in Ramadan', arabicName: 'التراويح', count: 6 },
  ],
};

// Hadith categories
export const HADITH_CATEGORIES = [
  { id: 'iman', name: 'Iman (Faith)', tamil: 'ஈமான்', icon: '☽', color: '#1a6b3a', count: null },
  { id: 'tawheed', name: 'Tawheed', tamil: 'தவ்ஹீத்', icon: '✦', color: '#1a6b3a', count: null },
  { id: 'salah', name: 'Salah (Prayer)', tamil: 'தொழுகை', icon: '◆', color: '#1a6b3a', count: null },
  { id: 'quran', name: "Quran & Dhikr", tamil: 'குர்ஆன் & திக்ர்', icon: '◈', color: '#2980b9', count: null },
  { id: 'youth', name: 'Youth', tamil: 'வாலிபம்', icon: '◉', color: '#8e44ad', count: null },
  { id: 'parents', name: 'Parents', tamil: 'பெற்றோர்', icon: '❖', color: '#c0392b', count: null },
  { id: 'family', name: 'Family', tamil: 'குடும்பம்', icon: '⊛', color: '#c8973a', count: null },
  { id: 'marriage', name: 'Marriage', tamil: 'திருமணம்', icon: '◇', color: '#c8973a', count: null },
  { id: 'character', name: 'Character', tamil: 'ஒழுக்கம்', icon: '✧', color: '#16a085', count: null },
  { id: 'tawbah', name: 'Tawbah (Repentance)', tamil: 'தவ்பா', icon: '☾', color: '#2980b9', count: null },
  { id: 'sabr', name: 'Sabr (Patience)', tamil: 'சபர்', icon: '⚓', color: '#1a6b3a', count: null },
  { id: 'ramadan', name: 'Ramadan', tamil: 'ரமழான்', icon: '☾', color: '#1a6b3a', count: null },
  { id: 'dua', name: 'Dua & Prayer', tamil: 'துஆ', icon: '◎', color: '#1a6b3a', count: null },
  { id: 'rizq', name: 'Rizq (Provision)', tamil: 'ரிஸ்க்', icon: '⊕', color: '#c8973a', count: null },
  { id: 'akhirah', name: 'Akhirah', tamil: 'ஆஹிரத்', icon: '∞', color: '#6b6b6b', count: null },
  { id: 'jannah', name: 'Jannah (Paradise)', tamil: 'ஜன்னத்', icon: '✦', color: '#1a6b3a', count: null },
  { id: 'charity', name: 'Sadaqah (Charity)', tamil: 'ஸதக்கா', icon: '⊙', color: '#c8973a', count: null },
  { id: 'knowledge', name: 'Knowledge', tamil: 'அறிவு', icon: '◈', color: '#2980b9', count: null },
  { id: 'death', name: 'Death & Hereafter', tamil: 'மரணம்', icon: '❖', color: '#6b6b6b', count: null },
  { id: 'fasting', name: 'Fasting', tamil: 'நோன்பு', icon: '☽', color: '#1a6b3a', count: null },
  { id: 'anger', name: 'Anger Management', tamil: 'கோபம்', icon: '◉', color: '#c0392b', count: null },
  { id: 'brotherhood', name: 'Brotherhood', tamil: 'சகோதரத்துவம்', icon: '◎', color: '#16a085', count: null },
  { id: 'business', name: 'Business & Halal', tamil: 'வணிகம்', icon: '⚖', color: '#c8973a', count: null },
  { id: 'tawakkul', name: 'Tawakkul', tamil: 'தவக்குல்', icon: '✧', color: '#1a6b3a', count: null },
];

// Grade display config
export const GRADES = {
  sahih: { label: 'Sahih', badge: 'badge-sahih', description: 'Authentic' },
  hasan: { label: 'Hasan', badge: 'badge-hasan', description: 'Good' },
  daif: { label: "Da'if", badge: 'badge-daif', description: 'Weak' },
  mixed: { label: 'Mixed', badge: 'badge-unknown', description: 'Varies by hadith' },
  unknown: { label: 'Not graded', badge: 'badge-unknown', description: '' },
};

export function getGrade(collection) {
  const col = COLLECTIONS.find(c => c.id === collection);
  if (!col) return 'unknown';
  return col.grade.toLowerCase();
}
