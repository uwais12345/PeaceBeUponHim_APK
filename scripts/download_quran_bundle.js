#!/usr/bin/env node
/**
 * download_quran_bundle.js
 * Downloads all 114 surahs (Arabic text + Tamil translation ID 133 + English ID 20)
 * and saves them as local JSON files into public/api/quran/
 * Usage: node scripts/download_quran_bundle.js
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'api', 'quran');
const BASE = 'https://api.quran.com/api/v4';
const DELAY_MS = 250;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchJSON(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries - 1) throw e;
      await sleep(1000 * (i + 1));
    }
  }
}

async function getAllVerses(surahId) {
  const url = `${BASE}/verses/by_chapter/${surahId}?language=en&translations=20,133&fields=text_uthmani&page=1&per_page=300`;
  const data = await fetchJSON(url);
  let verses = data.verses || [];
  const totalPages = data.pagination?.total_pages || 1;
  for (let p = 2; p <= totalPages; p++) {
    await sleep(DELAY_MS);
    const pageUrl = `${BASE}/verses/by_chapter/${surahId}?language=en&translations=20,133&fields=text_uthmani&page=${p}&per_page=300`;
    const more = await fetchJSON(pageUrl);
    verses = verses.concat(more.verses || []);
  }
  return verses.map(v => ({
    id: v.id,
    verse_number: v.verse_number,
    verse_key: v.verse_key,
    text_uthmani: v.text_uthmani,
    juz_number: v.juz_number,
    page_number: v.page_number,
    translations: (v.translations || []).map(t => ({
      resource_id: t.resource_id,
      text: t.text.replace(/<sup[^>]*>.*?<\/sup>/g, '').replace(/<[^>]+>/g, '').trim(),
    })),
  }));
}

async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  console.log('Fetching chapter list...');
  const chaptersData = await fetchJSON(`${BASE}/chapters?language=en`);
  const chapters = chaptersData.chapters || [];
  writeFileSync(join(OUT_DIR, 'chapters.json'), JSON.stringify({ chapters }, null, 0));
  console.log(`Saved chapters.json (${chapters.length} entries)`);

  for (const chapter of chapters) {
    const id = chapter.id;
    const outFile = join(OUT_DIR, `${id}.json`);
    if (existsSync(outFile)) {
      console.log(`  [${id}/114] ${chapter.name_simple} — skipping (exists)`);
      continue;
    }
    process.stdout.write(`  [${id}/114] ${chapter.name_simple}... `);
    try {
      const verses = await getAllVerses(id);
      const payload = {
        chapter: {
          id: chapter.id,
          name_simple: chapter.name_simple,
          name_arabic: chapter.name_arabic,
          verses_count: chapter.verses_count,
          revelation_place: chapter.revelation_place,
          translated_name: chapter.translated_name,
        },
        verses,
        pagination: { total_records: verses.length, total_pages: 1, current_page: 1 },
      };
      writeFileSync(outFile, JSON.stringify(payload, null, 0));
      console.log(`done (${verses.length} ayahs)`);
    } catch (e) {
      console.error(`FAILED: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  console.log('\n✅ Done. Files saved to:', OUT_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
