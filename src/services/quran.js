// ============================================
// QURAN SERVICE
// Primary: bundled local JSON files at /api/quran/
// Fallback: api.quran.com (free, no key needed)
// ============================================

const BASE = 'https://api.quran.com/api/v4';
const LOCAL_BASE = '/api/quran';

const cache = new Map();

// ----------------------------------------------------------------
// Local bundle helpers
// ----------------------------------------------------------------

let _chaptersLocal = null;

async function getLocalChapters() {
  if (_chaptersLocal) return _chaptersLocal;
  try {
    const res = await fetch(`${LOCAL_BASE}/chapters.json`);
    if (!res.ok) throw new Error('No local chapters bundle');
    const data = await res.json();
    _chaptersLocal = data.chapters || null;
    return _chaptersLocal;
  } catch {
    return null;
  }
}

async function getLocalSurah(surahId) {
  const cacheKey = `local_surah_${surahId}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  try {
    const res = await fetch(`${LOCAL_BASE}/${surahId}.json`);
    if (!res.ok) throw new Error('No local surah bundle');
    const data = await res.json();
    cache.set(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------
// Remote API helpers (with localStorage caching)
// ----------------------------------------------------------------

async function fetchWithCache(url) {
  if (cache.has(url)) return cache.get(url);
  try {
    const persisted = localStorage.getItem(`quran_cache_${url}`);
    if (persisted) {
      const data = JSON.parse(persisted);
      cache.set(url, data);
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Quran API error: ${res.status}`);
    const data = await res.json();
    cache.set(url, data);
    try {
      localStorage.setItem(`quran_cache_${url}`, JSON.stringify(data));
    } catch {
      // ignore quota
    }
    return data;
  } catch (err) {
    if (cache.has(url)) return cache.get(url);
    throw err;
  }
}

// ----------------------------------------------------------------
// Public API
// ----------------------------------------------------------------

export const QURAN_RECITERS = [
  { id: 7, name: 'Mishari Rashid al-Afasy' },
  { id: 3, name: 'Abdur-Rahman as-Sudais' },
  { id: 9, name: 'Muhammad Siddiq Al-Minshawi' },
  { id: 2, name: 'AbdulBaset AbdulSamad' },
  { id: 4, name: 'Abu Bakr al-Shatri' },
  { id: 'bandar-baleela', name: 'Bandar Baleela' },
];

// Get all surahs with Tamil + English info
export async function getSurahs() {
  // Try local bundle first (works offline immediately after APK install)
  const local = await getLocalChapters();
  if (local && local.length === 114) return local;

  // Fallback: remote API (with localStorage cache)
  const data = await fetchWithCache(`${BASE}/chapters?language=en`);
  return data.chapters || [];
}

// Get single surah info
export async function getSurah(id) {
  const local = await getLocalSurah(id);
  if (local?.chapter) return local.chapter;

  const data = await fetchWithCache(`${BASE}/chapters/${id}?language=en`);
  return data.chapter || null;
}

// Get ayahs for a surah with Arabic + Tamil translation
// Tamil translation ID: 133 (Tamil - Abdul Hameed Baqavi)
// English: 20 (Saheeh International)
export async function getAyahs(surahId, { page = 1 } = {}) {
  // Local bundle contains ALL verses in one file — return them paginated
  const local = await getLocalSurah(surahId);
  if (local?.verses?.length > 0) {
    const all = local.verses;
    const perPage = 10;
    const startIdx = (page - 1) * perPage;
    const endIdx = startIdx + perPage;
    const pageVerses = all.slice(startIdx, endIdx);
    const totalPages = Math.ceil(all.length / perPage);
    return {
      verses: pageVerses,
      pagination: {
        current_page: page,
        next_page: page < totalPages ? page + 1 : null,
        total_pages: totalPages,
        total_records: all.length,
        per_page: perPage,
      },
    };
  }

  // Fallback: remote API
  const url = `${BASE}/verses/by_chapter/${surahId}?language=en&translations=20,133&fields=text_uthmani&page=${page}&per_page=10`;
  const data = await fetchWithCache(url);
  return {
    verses: data.verses || [],
    pagination: data.pagination || {},
  };
}

// Get verse-by-verse recitation audio for a Surah.
export async function getSurahAyahAudio(surahId, reciterId = 7) {
  if (reciterId === 'bandar-baleela') {
    const chapter = String(surahId).padStart(3, '0');
    return [{
      verseKey: `${surahId}:1`,
      url: `https://cdn.mp3quran.net/audio/bandar-baleela/r1/${chapter}.mp3`,
      isSurahAudio: true,
    }];
  }

  const url = `${BASE}/recitations/${reciterId}/by_chapter/${surahId}?segments=false`;
  const firstPage = await fetchWithCache(url);
  const totalPages = firstPage.pagination?.total_pages || 1;
  const remainingPages = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) =>
      fetchWithCache(`${url}&page=${index + 2}`),
    ),
  );
  const audioFiles = [firstPage, ...remainingPages].flatMap(data => data.audio_files || []);
  if (audioFiles.length === 0) throw new Error('Recitation audio is unavailable for this Surah.');
  return audioFiles.map(({ verse_key, url }) => ({
    verseKey: verse_key,
    url: new URL(url, 'https://audio.qurancdn.com/').href,
  }));
}

// Get single ayah
export async function getAyah(surahId, ayahNum) {
  // Try local bundle
  const local = await getLocalSurah(surahId);
  if (local?.verses) {
    const verse = local.verses.find(v => v.verse_number === Number(ayahNum));
    if (verse) return verse;
  }

  const url = `${BASE}/verses/by_key/${surahId}:${ayahNum}?language=en&translations=20,133&fields=text_uthmani`;
  const data = await fetchWithCache(url);
  return data.verse || null;
}

// Search Quran (remote-only — too large to bundle)
export async function searchQuran(query, page = 1) {
  if (!query || query.trim().length < 2) return { results: [], pagination: {} };
  const url = `${BASE}/search?q=${encodeURIComponent(query)}&language=en&page=${page}&size=20`;
  try {
    const data = await fetchWithCache(url);
    return {
      results: data.search?.results || [],
      pagination: data.search?.pagination || {},
      query,
    };
  } catch {
    return { results: [], pagination: {}, query };
  }
}

// Get Juz info
export async function getJuzList() {
  const data = await fetchWithCache(`${BASE}/juzs`);
  return data.juzs || [];
}

// Translation IDs reference
export const TRANSLATIONS = {
  tamil: { id: 133, name: 'Tamil — Abdul Hameed Baqavi', language: 'ta' },
  english: { id: 20, name: 'Saheeh International', language: 'en' },
};

// Utility: check if local bundle is available
export async function isQuranBundleAvailable() {
  const chapters = await getLocalChapters();
  return chapters !== null && chapters.length === 114;
}
