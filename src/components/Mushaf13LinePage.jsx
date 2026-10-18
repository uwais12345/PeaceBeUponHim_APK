import React, { useMemo, useRef, useLayoutEffect, useState } from 'react';
import { partitionPageInto13Rows, toArabicNumerals, getManzil } from '../services/quran13Lines';
import './Mushaf13LinePage.css';

/* ── Ayah Marker with circular green/gold medal ── */
function AyahMark({ num }) {
  return (
    <span className="m13-ayah-mark" aria-label={`Verse ${num}`}>
      {toArabicNumerals(num)}
    </span>
  );
}

/* ── 3-Cell Surah Title Cartouche matching the reference clone ── */
function SurahCartouche({ info }) {
  const name  = info?.name_ar || '';
  const id    = info?.id || '';
  const type  = info?.type === 'makkah' ? 'مَكِّيَّةٌ' : 'مَدَنِيَّةٌ';
  const count = info?.verses ? toArabicNumerals(info.verses) : '';
  const ruku  = info?.rukus ? toArabicNumerals(info.rukus) : '١';

  return (
    <div className="m13-surah-cartouche" lang="ar" dir="rtl">
      {/* Right cell: Ayah count */}
      <div className="m13-cartouche-side">
        <span>آيَاتُهَا<br />{count}</span>
      </div>

      {/* Center cell: Surah name and type */}
      <div className="m13-cartouche-center">
        <span>
          {id ? `(${toArabicNumerals(id)}) ` : ''}
          سُورَةُ {name} {type}
        </span>
      </div>

      {/* Left cell: Ruku count */}
      <div className="m13-cartouche-side">
        <span>رُكُوعَاتُهَا<br />{ruku}</span>
      </div>
    </div>
  );
}

/* ── Centered Bismillah Row with ornamental rosettes ── */
function BismillahRow() {
  return (
    <div className="m13-bismillah-row" lang="ar" dir="rtl">
      <span className="m13-bismillah-rosette">۞</span>
      <span className="m13-bismillah-text">
        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
      </span>
      <span className="m13-bismillah-rosette">۞</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MUSHAF 13-LINE PAGE COMPONENT
   Strictly 13 lines per page, fixed single-page layout.
   ══════════════════════════════════════════════════════════ */
export default function Mushaf13LinePage({ pageNum, verses, surahPages, juz }) {
  const containerRef = useRef(null);
  const [fontSize, setFontSize] = useState(null);

  // 1. Partition verses into EXACTLY 13 visual rows
  const rows = useMemo(() => {
    return partitionPageInto13Rows(pageNum, verses, surahPages);
  }, [pageNum, verses, surahPages]);

  // 2. Identify top surah and manzil
  const topSurahId = verses?.[0]?.s || 1;
  const topSurahInfo = surahPages?.[String(topSurahId)] || {};
  const topSurahName = topSurahInfo.name_ar || '';
  const manzilNumber = getManzil(topSurahId);

  // 3. Dynamic font scaling based on container width & height so words fit inside borders with consistent gaps
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const updateFs = () => {
      const container = containerRef.current;
      if (!container) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 600;

      // 13 rows in height: height per row accounts for outer headers and frame padding
      const availableH = h - 68;
      const rowHeight = availableH / 13;
      // Available width inside frame accounting for borders and inner 10px padding
      const availableW = Math.max(260, w - 48);

      // Base font size estimation
      let fs = Math.round(Math.min(rowHeight * 0.48, availableW / 21.8));
      fs = Math.max(12, Math.min(21, fs));

      container.style.setProperty('--m13-fs', `${fs}px`);

      // Verify DOM measurement so no row ever overflows or touches borders
      const textRows = container.querySelectorAll('.m13-text-row');
      if (textRows.length > 0) {
        let maxRatio = 1.0;
        textRows.forEach(row => {
          if (row.scrollWidth > row.clientWidth) {
            const r = row.scrollWidth / row.clientWidth;
            if (r > maxRatio) maxRatio = r;
          }
        });

        if (maxRatio > 1.0) {
          // Scale down with 3% safety margin so complete lines fit inside without touching
          const adjustedFs = Math.floor((fs / maxRatio) * 0.97 * 2) / 2;
          fs = Math.max(11, adjustedFs);
          container.style.setProperty('--m13-fs', `${fs}px`);
        }
      }

      setFontSize(fs);
    };

    updateFs();
    window.addEventListener('resize', updateFs);
    return () => window.removeEventListener('resize', updateFs);
  }, [verses, pageNum, rows]);

  return (
    <div
      className="m13-page-container"
      ref={containerRef}
      style={fontSize ? { '--m13-fs': `${fontSize}px` } : {}}
    >
      {/* ── Top Outer Margin Metadata (Surah, Page, Juz) ── */}
      <div className="m13-outer-header">
        <span className="m13-outer-surah" lang="ar" dir="rtl">
          {topSurahName ? `سورة ${topSurahName}` : ''}
        </span>
        <span className="m13-outer-pagenum" lang="ar" dir="rtl">
          {toArabicNumerals(pageNum)}
        </span>
        <span className="m13-outer-juz" lang="ar" dir="rtl">
          {juz?.name_ar ? `${juz.name_ar} ${toArabicNumerals(juz.juz)}` : ''}
        </span>
      </div>

      {/* ── Inner Frame with the Traditional Green Chain Border ── */}
      <div className="m13-frame">
        <div className="m13-chain-border" />

        {/* ── The 13 Rows: EXACTLY 13 rows, zero scrolling! ── */}
        <div className="m13-body">
          {rows.map((row, idx) => {
            if (row.type === 'surah_header') {
              return (
                <div key={`header-${idx}`} className="m13-row">
                  <SurahCartouche info={row.info} />
                </div>
              );
            }

            if (row.type === 'bismillah') {
              return (
                <div key={`bismillah-${idx}`} className="m13-row">
                  <BismillahRow />
                </div>
              );
            }

            // Text row — highlight only when this row contains verse 1 of a Surah (traditional olive wash)
            const isFirst = row.isFirstLine;
            return (
              <div
                key={`text-${idx}`}
                className={`m13-row${isFirst ? ' m13-row-first-ayah' : ''}`}
              >
                <div className="m13-text-row" lang="ar" dir="rtl">
                  {row.tokens.map((tok, tIdx) => {
                    if (tok.type === 'word') {
                      return (
                        <span key={`w-${tIdx}`} className="m13-word">
                          {tok.text}
                        </span>
                      );
                    }
                    return (
                      <AyahMark key={`m-${tIdx}`} num={tok.num} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Outer Margin Metadata (Manzil) ── */}
      <div className="m13-outer-footer" lang="ar" dir="rtl">
        <span>منزل {toArabicNumerals(manzilNumber)}</span>
      </div>
    </div>
  );
}
