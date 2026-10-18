// ============================================
// HADITH SERVICE
// Uses https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1
// ============================================

import { fetchWithRetry } from './networkManager.js';

const BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions';
const cache = new Map();

// Hadith fetches from cdn.jsdelivr.net with session persistence & retry
// In-memory cache & sessionStorage enable offline access for previously opened books.
async function fetchCached(url) {
  if (cache.has(url)) return cache.get(url);

  const storageKey = `hadith_cache_${url}`;
  try {
    const saved = sessionStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      cache.set(url, parsed);
      return parsed;
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetchWithRetry(url, {}, { retries: 2, backoff: 800, timeout: 8000 });
    if (!res.ok) throw new Error(`Hadith API error: ${res.status}`);
    const data = await res.json();
    cache.set(url, data);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(data));
    } catch {
      // ignore quota
    }
    return data;
  } catch (err) {
    // If request failed, double check fallback storage
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        cache.set(url, parsed);
        return parsed;
      }
    } catch {
      // ignore
    }
    throw err;
  }
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

// Curated verified hadith texts for unpopulated or missing API entries (e.g. Sahih Muslim intro hadiths)
export const HADITH_OVERRIDES = {
  muslim: {
    '1': {
      arab: 'وَهُوَ الأَثَرُ الْمَشْهُورُ عَنْ رَسُولِ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: "مَنْ حَدَّثَ عَنِّي بِحَدِيثٍ يُرَى أَنَّهُ كَذِبٌ فَهُوَ أَحَدُ الْكَاذِبِينَ". حَدَّثَنَا أَبُو بَكْرِ بْنُ أَبِي شَيْبَةَ، حَدَّثَنَا وَكِيعٌ، عَنْ شُعْبَةَ، عَنِ الْحَكَمِ، عَنْ عَبْدِ الرَّحْمَنِ بْنِ أَبِي لَيْلَى، عَنْ سَمُرَةَ بْنِ جُنْدَبٍ، وَعَنِ الْمُغِيرَةِ بْنِ شُعْبَةَ قَالَا: قَالَ رَسُولُ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ ذَلِكَ.',
      translation: 'அல்லாஹ்வின் தூதர் (ஸல்) அவர்கள் கூறியதாக பிரசித்தி பெற்ற செய்தி: "பொய் என்று கருதப்படும் ஒரு செய்தியை என் பெயரால் எவரேனும் கூறினால், அவரும் பொய்யர்களில் ஒருவராவார்." (அறிவிப்பாளர்கள்: சமுரா பின் ஜுன்துப் (ரலி), அல்-முகீரா பின் ஷுஃபா (ரலி))',
      engTranslation: 'And it is the well-known narration from the Messenger of Allah (ﷺ): "Whoever narrates a hadith from me while it is thought that it is a lie, then he is one of the liars." (Narrated by Samurah bin Jundab and al-Mughirah bin Shu\'bah (ra))',
    },
    '2': {
      arab: 'حَدَّثَنَا أَبُو بَكْرِ بْنُ أَبِي شَيْبَةَ، حَدَّثَنَا غُنْدَرٌ، عَنْ شُعْبَةَ، ح وَحَدَّثَنَا مُحَمَّدُ بْنُ الْمُثَنَّى، وَابْنُ بَشَّارٍ، قَالَا: حَدَّثَنَا مُحَمَّدُ بْنُ جَعْفَرٍ، حَدَّثَنَا شُعْبَةُ، عَنْ مَنْصُورٍ، عَنْ رِبْعِيِّ بْنِ حِرَاشٍ، أَنَّهُ سَمِعَ عَلِيًّا رَضِيَ اللهُ عَنْهُ يَخْطُبُ يَقُولُ: قَالَ رَسُولُ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: "لَا تَكْذِبُوا عَلَيَّ، فَإِنَّهُ مَنْ يَكْذِبْ عَلَيَّ يَلِجِ النَّارَ".',
      translation: 'அலீ (ரலி) அவர்கள் உரை நிகழ்த்திய போது கூறியதாவது: அல்லாஹ்வின் தூதர் (ஸல்) அவர்கள் கூறினார்கள்: "என் மீது பொய் உரைக்காதீர்கள்; ஏனெனில் எவர் என் மீது பொய்யுரைக்கிறாரோ அவர் நரகில் நுழைவார்."',
      engTranslation: 'Ali (may Allah be pleased with him) delivered a sermon saying: The Messenger of Allah (ﷺ) said: "Do not tell lies against me, for whoever tells lies against me will certainly enter the Fire."',
    },
    '5': {
      arab: 'حَدَّثَنَا مُحَمَّدُ بْنُ عَبْدِ اللهِ بْنِ نُمَيْرٍ، حَدَّثَنَا أَبِي، حَدَّثَنَا سَعِيدُ بْنُ عُبَيْدٍ، حَدَّثَنَا عَلِيُّ بْنُ رَبِيعَةَ، قَالَ: سَمِعْتُ الْمُغِيرَةَ بْنَ شُعْبَةَ، يَقُولُ: سَمِعْتُ رَسُولَ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ يَقُولُ: "إِنَّ كَذِبًا عَلَيَّ لَيْسَ كَكَذِبٍ عَلَى أَحَدٍ، فَمَنْ كَذَبَ عَلَيَّ مُتَعَمِّدًا، فَلْيَتَبَوَّأْ مَقْعَدَهُ مِنَ النَّارِ".',
      translation: 'முகீரா பின் ஷுஃபா (ரலி) அவர்கள் கூறியதாவது: அல்லாஹ்வின் தூதர் (ஸல்) அவர்கள் கூறக் கேட்டேன்: "என் மீது பொய் சொல்வது மற்றவர் மீது பொய் சொல்வதைப் போன்றதல்ல; என் மீது எவர் வேண்டுமென்றே பொய்யுரைக்கிறாரோ அவர் தனது தங்குமிடத்தை நரகத்தில் அமைத்துக் கொள்ளட்டும்."',
      engTranslation: 'Al-Mughirah bin Shu\'bah reported: I heard the Messenger of Allah (ﷺ) say: "Telling lies about me is not like telling lies about anyone else. Whoever intentionally lies about me, let him take his place in the Fire."',
    },
    '7': {
      arab: 'حَدَّثَنَا عُبَيْدُ اللهِ بْنُ مُعَاذٍ الْعَنْبَرِيُّ، حَدَّثَنَا أَبِي، حَدَّثَنَا شُعْبَةُ، عَنْ مُحَمَّدِ بْنِ قَيْسٍ، عَنْ عَلِيِّ بْنِ رَبِيعَةَ الأَسَدِيِّ، عَنِ الْمُغِيرَةِ بْنِ شُعْبَةَ، عَنِ النَّبِيِّ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ بِمِثْلِهِ.',
      translation: 'முகீரா பின் ஷுஃபா (ரலி) அவர்கள் நபி (ஸல்) அவர்களிடமிருந்து இதே போன்ற மற்றொரு அறிவிப்பாளர் தொடர் வழியாகவும் அறிவிக்கிறார்கள்.',
      engTranslation: 'Another narration from al-Mughirah bin Shu\'bah from the Prophet (ﷺ) with the same meaning.',
    },
  },
};

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

    const araMap = new Map();
    if (araData?.hadiths) {
      araData.hadiths.forEach(h => {
        if (h && h.hadithnumber != null) araMap.set(String(h.hadithnumber), h.text);
      });
    }

    const engMap = new Map();
    if (engData?.hadiths) {
      engData.hadiths.forEach(h => {
        if (h && h.hadithnumber != null) engMap.set(String(h.hadithnumber), h.text);
      });
    }

    const formattedHadiths = transData.hadiths
      .map((h, i) => {
        const numStr = String(h.hadithnumber);
        let araText = araMap.get(numStr) || araData?.hadiths?.[i]?.text || '';
        let engText = engMap.get(numStr) || engData?.hadiths?.[i]?.text || '';
        let tamText = h.text || '';

        const override = HADITH_OVERRIDES?.[collectionId]?.[numStr];
        if (override) {
          if (override.arab) araText = override.arab;
          if (override.translation) tamText = override.translation;
          if (override.engTranslation) engText = override.engTranslation;
        }

        return {
          number: h.hadithnumber,
          arab: araText,
          translation: tamText,
          engTranslation: engText,
          id: `${h.reference?.book}-${h.reference?.hadith}`
        };
      })
      .filter(h => {
        // Filter out empty phantom entries across all imams
        return (h.arab && h.arab.trim().length > 0) ||
               (h.translation && h.translation.trim().length > 0) ||
               (h.engTranslation && h.engTranslation.trim().length > 0);
      });

    return {
      hadiths: formattedHadiths,
      name: col.name,
      bookName: transData.metadata?.section?.[bookId] || `Book ${bookId}`,
      total: formattedHadiths.length,
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

    const araMap = new Map();
    if (araData?.hadiths) {
      araData.hadiths.forEach(h => {
        if (h && h.hadithnumber != null) araMap.set(String(h.hadithnumber), h.text);
      });
    }

    const engMap = new Map();
    if (engData?.hadiths) {
      engData.hadiths.forEach(h => {
        if (h && h.hadithnumber != null) engMap.set(String(h.hadithnumber), h.text);
      });
    }

    // Map, enrich overrides, and filter out phantom empty hadiths across all imams
    const allFormatted = transData.hadiths
      .map((h, i) => {
        const numStr = String(h.hadithnumber);
        let araText = araMap.get(numStr) || araData?.hadiths?.[i]?.text || '';
        let engText = engMap.get(numStr) || engData?.hadiths?.[i]?.text || '';
        let tamText = h.text || '';

        const override = HADITH_OVERRIDES?.[collectionId]?.[numStr];
        if (override) {
          if (override.arab) araText = override.arab;
          if (override.translation) tamText = override.translation;
          if (override.engTranslation) engText = override.engTranslation;
        }

        return {
          number: h.hadithnumber,
          arab: araText,
          translation: tamText,
          engTranslation: engText,
          id: `${h.reference?.book}-${h.reference?.hadith}`
        };
      })
      .filter(h => {
        // Ensure no empty card is ever produced for any collection
        return (h.arab && h.arab.trim().length > 0) ||
               (h.translation && h.translation.trim().length > 0) ||
               (h.engTranslation && h.engTranslation.trim().length > 0);
      });

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const pagedHadiths = allFormatted.slice(startIndex, endIndex);

    return {
      hadiths: pagedHadiths,
      name: transData.metadata?.name || col.name,
      total: allFormatted.length,
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

    const numStr = String(number);
    const override = HADITH_OVERRIDES?.[collectionId]?.[numStr];

    const collectionKey = col.id === 'abu-dawud' ? 'abudawud' : col.id === 'tirmidzi' ? 'tirmidhi' : col.id === 'ibnu-majah' ? 'ibnmajah' : col.id;

    const [araData, tamData, engData] = await Promise.all([
      fetchCached(`${BASE}/ara-${collectionKey}.min.json`).catch(() => null),
      fetchCached(`${BASE}/tam-${collectionKey}.min.json`).catch(() => null),
      fetchCached(`${BASE}/eng-${collectionKey}.min.json`).catch(() => null),
    ]);

    const transData = tamData && tamData.hadiths ? tamData : engData;
    if (!transData || !transData.hadiths) {
      if (override) {
        return {
          number: Number(number) || number,
          arab: override.arab,
          translation: override.translation,
          engTranslation: override.engTranslation,
          id: `0-${number}`
        };
      }
      return null;
    }

    const hIndex = transData.hadiths.findIndex(x => String(x.hadithnumber) === numStr);
    if (hIndex === -1 && !override) return null;
    
    const h = hIndex !== -1 ? transData.hadiths[hIndex] : {};
    let araText = (hIndex !== -1 ? araData?.hadiths?.[hIndex]?.text : '') || '';
    let tamText = h.text || '';
    let engText = (hIndex !== -1 ? engData?.hadiths?.[hIndex]?.text : '') || '';

    if (override) {
      if (override.arab) araText = override.arab;
      if (override.translation) tamText = override.translation;
      if (override.engTranslation) engText = override.engTranslation;
    }

    return {
      number: h.hadithnumber || number,
      arab: araText,
      translation: tamText,
      engTranslation: engText,
      id: `${h.reference?.book || 0}-${h.reference?.hadith || number}`
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
