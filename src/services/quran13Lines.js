/**
 * quran13Lines.js
 * 
 * Partitions any Quran Mushaf page (1 to 604) into EXACTLY 13 visual rows
 * matching the classical 13-Line Mushaf layout.
 *
 * Each row is either:
 * - { type: 'surah_header', info }
 * - { type: 'bismillah' }
 * - { type: 'text', tokens: [...], isFirstLine: boolean }
 *
 * Total rows per page is ALWAYS strictly 13.
 */

export function toArabicNumerals(n) {
  return String(n).replace(/\d/g, d => String.fromCharCode(0x0660 + parseInt(d)));
}

/**
 * Calculates the Manzil (1 to 7) for a given Surah number.
 * Manzil 1: Surah 1 to 4
 * Manzil 2: Surah 5 to 9
 * Manzil 3: Surah 10 to 16
 * Manzil 4: Surah 17 to 25
 * Manzil 5: Surah 26 to 36
 * Manzil 6: Surah 37 to 49
 * Manzil 7: Surah 50 to 114
 */
export function getManzil(surah) {
  const s = parseInt(surah, 10) || 1;
  if (s <= 4) return 1;
  if (s <= 9) return 2;
  if (s <= 16) return 3;
  if (s <= 25) return 4;
  if (s <= 36) return 5;
  if (s <= 49) return 6;
  return 7;
}

export function partitionPageInto13Rows(pageNum, verses, surahPages = {}) {
  if (!verses || verses.length === 0) return [];

  // 1. Group verses by surah
  const surahGroups = [];
  for (const v of verses) {
    if (!surahGroups.length || surahGroups[surahGroups.length - 1].surah !== v.s) {
      surahGroups.push({ surah: v.s, verses: [] });
    }
    surahGroups[surahGroups.length - 1].verses.push(v);
  }

  // 2. Count header rows for any surah starting on this page (verse 1)
  let headerRowsCount = 0;
  for (const g of surahGroups) {
    const isStart = g.verses[0].v === 1;
    if (isStart) {
      headerRowsCount += 1; // Surah banner row
      if (g.surah !== 1 && g.surah !== 9) {
        headerRowsCount += 1; // Bismillah row
      }
    }
  }

  const textRowsCount = Math.max(1, 13 - headerRowsCount);

  // 3. Collect word tokens and verse markers
  const tokens = [];
  for (const v of verses) {
    const words = v.t.trim().split(/\s+/);
    for (const w of words) {
      if (w) tokens.push({ type: 'word', text: w, surah: v.s, verse: v.v });
    }
    tokens.push({ type: 'mark', num: v.v, surah: v.s });
  }

  // 4. Optimal partitioning of tokens into textRowsCount lines
  const n = tokens.length;
  const k = textRowsCount;
  const lengths = tokens.map(t => t.type === 'word' ? t.text.length + 1 : 4);

  const textLines = [];
  let tokenIdx = 0;
  for (let lineIdx = 0; lineIdx < k; lineIdx++) {
    const remainingLines = k - lineIdx;
    if (remainingLines === 1) {
      textLines.push(tokens.slice(tokenIdx));
      break;
    }

    const remainingTotalLen = lengths.slice(tokenIdx).reduce((a, b) => a + b, 0);
    const target = remainingTotalLen / remainingLines;

    let bestSplit = tokenIdx + 1;
    let currentLen = 0;
    let minDiff = Infinity;
    const maxSplit = n - (remainingLines - 1);

    for (let j = tokenIdx; j < maxSplit; j++) {
      currentLen += lengths[j];
      const diff = Math.abs(currentLen - target);
      if (diff < minDiff) {
        minDiff = diff;
        bestSplit = j + 1;
      } else if (currentLen > target && diff > minDiff) {
        break;
      }
    }

    textLines.push(tokens.slice(tokenIdx, bestSplit));
    tokenIdx = bestSplit;
  }

  // 5. Build the final 13 rows in reading order
  const finalRows = [];
  let currentSurahOnPage = null;

  for (let i = 0; i < textLines.length; i++) {
    const lineTokens = textLines[i];

    // Check if a new surah starts on this line
    for (const g of surahGroups) {
      if (g.verses[0].v === 1 && g.surah !== currentSurahOnPage) {
        const lineHasFirstVerse = lineTokens.some(t => t.surah === g.surah && t.verse === 1);
        if (lineHasFirstVerse) {
          const info = surahPages[String(g.surah)] || {};
          finalRows.push({ type: 'surah_header', info, surah: g.surah });
          if (g.surah !== 1 && g.surah !== 9) {
            finalRows.push({ type: 'bismillah' });
          }
          currentSurahOnPage = g.surah;
        }
      }
    }

    finalRows.push({
      type: 'text',
      tokens: lineTokens,
      isFirstLine: lineTokens.some(t => t.verse === 1)
    });
  }

  // Pad to exactly 13 rows if needed
  while (finalRows.length < 13) {
    finalRows.push({ type: 'text', tokens: [] });
  }

  return finalRows;
}
