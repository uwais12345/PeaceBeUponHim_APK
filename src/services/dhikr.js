// Dhikr Service
// Primary: bundled local JSON (src/data/dhikr.json) — works offline immediately
// Fallback: /api/dhikr.json (static public asset, cached by Workbox)

import bundledDhikr from '../data/dhikr.json';

// Seed memory cache with bundled data immediately
let dhikrMemoryCache = bundledDhikr || null;

export async function fetchDhikrData() {
  // Return bundled data immediately — no network needed
  if (dhikrMemoryCache) return dhikrMemoryCache;

  // Fallback: fetch from public static asset
  try {
    const res = await fetch('/api/dhikr.json');
    if (!res.ok) throw new Error('Failed to fetch dhikr data');
    const data = await res.json();
    dhikrMemoryCache = data;
    return data;
  } catch (error) {
    console.error('Error fetching dhikr:', error);
    return { sessions: [], dhikrList: [] };
  }
}

export function getDhikrBySession(dhikrList, sessionId) {
  if (!sessionId || sessionId === 'all') return dhikrList;
  return dhikrList.filter(dhikr => dhikr.session === sessionId);
}
