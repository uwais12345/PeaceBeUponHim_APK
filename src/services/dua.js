// Dua Service
// Primary: bundled local JSON (src/data/duas.json) — works offline immediately
// Fallback: /api/duas.json (static public asset, cached by Workbox)

import bundledDuas from '../data/duas.json';

// Seed memory cache with bundled data immediately
let duasMemoryCache = bundledDuas || null;

export async function fetchDuasData() {
  // If we already have the bundled data in memory, return it directly.
  // This is synchronous-fast and works with no network at all.
  if (duasMemoryCache) return duasMemoryCache;

  // Fallback: fetch from /api/duas.json (served as static public asset)
  try {
    const res = await fetch('/api/duas.json');
    if (!res.ok) throw new Error('Failed to fetch dua data');
    const data = await res.json();
    duasMemoryCache = data;
    try {
      localStorage.setItem('pbuh_duas_cache', JSON.stringify(data));
    } catch {
      // ignore quota
    }
    return data;
  } catch (error) {
    // Last resort: try localStorage
    try {
      const persisted = localStorage.getItem('pbuh_duas_cache');
      if (persisted) {
        duasMemoryCache = JSON.parse(persisted);
        return duasMemoryCache;
      }
    } catch {
      // ignore
    }
    console.error('Error fetching duas:', error);
    return { categories: [], duas: [] };
  }
}

export function searchDuas(duas, query) {
  if (!query) return duas;
  const q = query.toLowerCase();
  return duas.filter(dua => [
    dua.title,
    dua.tamil,
    dua.meaning_english,
    dua.meaning_tamil,
    dua.transliteration,
    dua.notes,
    dua.note,
    dua.category,
    ...(Array.isArray(dua.keywords) ? dua.keywords : []),
  ].some(value => typeof value === 'string' && value.toLowerCase().includes(q)));
}
