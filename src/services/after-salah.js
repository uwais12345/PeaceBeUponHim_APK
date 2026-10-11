// After-Salah Service
// Uses bundled duas.json (same source as the Dua page)
// Works offline immediately — no network request needed

import bundledDuas from '../data/duas.json';

export async function fetchAfterSalahData() {
  // Primary: bundled import (always available offline)
  const data = bundledDuas;

  if (data && data.duas) {
    const afterSalahDuas = data.duas.filter(dua => dua.category === 'prayer');
    if (afterSalahDuas.length > 0) {
      return afterSalahDuas.map(dua => ({
        id: dua.id,
        title: dua.title,
        count: dua.repeat ?? 1,
        arabic: dua.arabic,
        transliteration: dua.transliteration,
        tamil: dua.meaning_tamil,
        meaning_english: dua.meaning_english,
        note: dua.notes || dua.note,
        reference: dua.source || dua.reference,
      }));
    }
  }

  // Fallback: fetch from public asset (should not be needed with bundled import)
  try {
    const res = await fetch('/api/duas.json');
    if (!res.ok) throw new Error(`Failed to fetch after-salah duas: ${res.status}`);
    const fallbackData = await res.json();
    const afterSalahDuas = (fallbackData.duas || []).filter(dua => dua.category === 'prayer');
    if (afterSalahDuas.length === 0) throw new Error('No after-salah duas are available.');
    return afterSalahDuas.map(dua => ({
      id: dua.id,
      title: dua.title,
      count: dua.repeat ?? 1,
      arabic: dua.arabic,
      transliteration: dua.transliteration,
      tamil: dua.meaning_tamil,
      meaning_english: dua.meaning_english,
      note: dua.notes || dua.note,
      reference: dua.source || dua.reference,
    }));
  } catch (err) {
    throw err;
  }
}
