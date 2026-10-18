import React from 'react';
import './MushafFrontispiece.css';

/* ── Arabic numeral converter ── */
function toArabicNumerals(n) {
  return String(n).replace(/\d/g, d => String.fromCharCode(0x0660 + parseInt(d)));
}

/* ── Ayah Marker with ornate gold border ── */
function AyahMark({ num }) {
  return (
    <span className="mf-fp-mark" aria-label={`Verse ${num}`}>
      {toArabicNumerals(num)}
    </span>
  );
}

/* ── Traditional Islamic Star Lattice Arch (Unwan / تاج السورة) ── */
function OpeningHeadpieceSVG() {
  return (
    <svg
      className="mf-fp-arch-svg"
      viewBox="0 0 400 125"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Traditional Islamic Geometric Arch"
    >
      <defs>
        {/* Gold linear gradient */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7a5813" />
          <stop offset="25%" stopColor="#d4af37" />
          <stop offset="50%" stopColor="#f5e18e" />
          <stop offset="75%" stopColor="#c8992a" />
          <stop offset="100%" stopColor="#68480b" />
        </linearGradient>

        {/* Dark Walnut / Bronze background gradient */}
        <radialGradient id="woodGrad" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#2c1a0a" />
          <stop offset="70%" stopColor="#1a0f05" />
          <stop offset="100%" stopColor="#0d0702" />
        </radialGradient>

        {/* Emerald gradient */}
        <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#113322" />
          <stop offset="50%" stopColor="#1b4d35" />
          <stop offset="100%" stopColor="#113322" />
        </linearGradient>

        {/* 8-Point Star Pattern Definition */}
        <pattern id="girihStar" width="40" height="40" patternUnits="userSpaceOnUse">
          {/* Subtle star lattice grid */}
          <path
            d="M 20,0 L 25,15 L 40,20 L 25,25 L 20,40 L 15,25 L 0,20 L 15,15 Z"
            fill="none"
            stroke="#d4af37"
            strokeWidth="0.8"
            opacity="0.65"
          />
          <polygon
            points="20,8 23,17 32,20 23,23 20,32 17,23 8,20 17,17"
            fill="#3a2512"
            stroke="#f0d575"
            strokeWidth="0.6"
            opacity="0.85"
          />
          <circle cx="20" cy="20" r="3" fill="#d4af37" opacity="0.9" />
          <circle cx="0" cy="0" r="2" fill="#d4af37" opacity="0.5" />
          <circle cx="40" cy="0" r="2" fill="#d4af37" opacity="0.5" />
          <circle cx="0" cy="40" r="2" fill="#d4af37" opacity="0.5" />
          <circle cx="40" cy="40" r="2" fill="#d4af37" opacity="0.5" />
        </pattern>
      </defs>

      {/* Outer Rectangular Border */}
      <rect x="2" y="2" width="396" height="121" rx="4" fill="#f8f2e2" stroke="url(#goldGrad)" strokeWidth="2.5" />
      <rect x="6" y="6" width="388" height="113" rx="3" fill="none" stroke="#1b4332" strokeWidth="1.5" />

      {/* Corner Arabesque Ornaments */}
      <path d="M 6,6 Q 30,8 35,35 Q 12,30 6,6 Z" fill="#8b1e2d" opacity="0.85" />
      <path d="M 394,6 Q 370,8 365,35 Q 388,30 394,6 Z" fill="#8b1e2d" opacity="0.85" />
      <path d="M 6,119 Q 30,117 35,90 Q 12,95 6,119 Z" fill="#8b1e2d" opacity="0.85" />
      <path d="M 394,119 Q 370,117 365,90 Q 388,95 394,119 Z" fill="#8b1e2d" opacity="0.85" />

      {/* Main Islamic Cusped / Scalloped Arch */}
      <path
        d="M 20,112
           L 20,45
           Q 20,20 60,20
           Q 110,12 150,18
           Q 175,8 200,8
           Q 225,8 250,18
           Q 290,12 340,20
           Q 380,20 380,45
           L 380,112
           Z"
        fill="url(#woodGrad)"
        stroke="url(#goldGrad)"
        strokeWidth="2.5"
      />

      {/* Inner Geometric Star Field inside Arch */}
      <path
        d="M 23,110
           L 23,46
           Q 23,23 62,23
           Q 112,15 152,21
           Q 177,11 200,11
           Q 223,11 248,21
           Q 288,15 338,23
           Q 377,23 377,46
           L 377,110
           Z"
        fill="url(#girihStar)"
      />

      {/* Center Grand Medallion / Rosette */}
      <circle cx="200" cy="58" r="26" fill="#201308" stroke="url(#goldGrad)" strokeWidth="1.8" />
      <circle cx="200" cy="58" r="20" fill="none" stroke="#d4af37" strokeWidth="1" strokeDasharray="3 2" />
      <polygon
        points="200,38 206,51 220,58 206,65 200,78 194,65 180,58 194,51"
        fill="url(#goldGrad)"
      />
      <circle cx="200" cy="58" r="5" fill="#8b1e2d" />
      <circle cx="200" cy="58" r="2" fill="#fff" />

      {/* Side Medallions */}
      <circle cx="100" cy="62" r="14" fill="#201308" stroke="url(#goldGrad)" strokeWidth="1.2" />
      <polygon
        points="100,51 104,58 111,62 104,66 100,73 96,66 89,62 96,58"
        fill="#d4af37"
        opacity="0.9"
      />
      <circle cx="100" cy="62" r="2.5" fill="#8b1e2d" />

      <circle cx="300" cy="62" r="14" fill="#201308" stroke="url(#goldGrad)" strokeWidth="1.2" />
      <polygon
        points="300,51 304,58 311,62 304,66 300,73 296,66 289,62 296,58"
        fill="#d4af37"
        opacity="0.9"
      />
      <circle cx="300" cy="62" r="2.5" fill="#8b1e2d" />

      {/* Base Decorative Rail */}
      <rect x="20" y="112" width="360" height="4" fill="url(#goldGrad)" />
      <circle cx="200" cy="114" r="3" fill="#8b1e2d" />
      <circle cx="100" cy="114" r="2" fill="#8b1e2d" />
      <circle cx="300" cy="114" r="2" fill="#8b1e2d" />
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════
   MUSHAF FRONTISPIECE COMPONENT (Pages 1 and 2)
   ══════════════════════════════════════════════════════════ */
export default function MushafFrontispiece({ pageNum, verses }) {
  const isPage1 = pageNum === 1;

  // Surah metadata for frontispiece
  const surahTitle = isPage1 ? 'سُورَةُ الْفَاتِحَةِ مَكِّيَّةٌ' : 'سُورَةُ الْبَقَرَةِ مَدَنِيَّةٌ';
  const surahMeta  = isPage1 ? 'آيَاتُهَا ٧ · رُكُوعُهَا ١' : 'آيَاتُهَا ٢٨٦ · رُكُوعَاتُهَا ٤٠';
  const pageLabel  = isPage1 ? '١' : '٢';

  return (
    <div className="mf-frontispiece">

      {/* ── Top Marginal Header (outside the illuminated border) ── */}
      <div className="mf-fp-outer-header">
        <span className="mf-fp-outer-title" lang="ar" dir="rtl">
          {isPage1 ? 'سُورَةُ الْفَاتِحَةِ' : 'سُورَةُ الْبَقَرَةِ'}
        </span>
        <span className="mf-fp-outer-pagenum" lang="ar" dir="rtl">
          {toArabicNumerals(pageLabel)}
        </span>
        <span className="mf-fp-outer-juz" lang="ar" dir="rtl">
          {isPage1 ? 'الجزء ١' : 'الم (الجزء ١)'}
        </span>
      </div>

      {/* ── Inner Illuminated Stage ── */}
      <div className="mf-fp-inner">
        <div className="mf-fp-frame">

          {/* 1. Grand Traditional Arch Headpiece (Unwan) */}
          <div className="mf-fp-headpiece">
            <OpeningHeadpieceSVG />
          </div>

          {/* 2. Ornate Surah Title Cartouche */}
          <div className="mf-fp-banner">
            <span className="mf-fp-banner-finial">﴿</span>
            <div className="mf-fp-banner-center">
              <span className="mf-fp-banner-name" lang="ar" dir="rtl">
                {surahTitle}
              </span>
              <span className="mf-fp-banner-meta" lang="ar" dir="rtl">
                {surahMeta}
              </span>
            </div>
            <span className="mf-fp-banner-finial">﴾</span>
          </div>

          {/* 3. Ruled Text Rows — Exact lines, NO extra empty lines */}
          <div className="mf-fp-rows" lang="ar" dir="rtl">
            {isPage1 ? (
              /* ── PAGE 1: SURAH AL-FATIHA (7 Classical Lines) ── */
              <>
                {/* Line 1: Bismillah */}
                <div className="mf-fp-row mf-fp-bismillah-row">
                  <span>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span>
                  <AyahMark num={1} />
                </div>

                {/* Line 2 */}
                <div className="mf-fp-row">
                  <span>ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ</span>
                  <AyahMark num={2} />
                  <span>ٱلرَّحْمَـٰنِ</span>
                </div>

                {/* Line 3 */}
                <div className="mf-fp-row">
                  <span>ٱلرَّحِيمِ</span>
                  <AyahMark num={3} />
                  <span>مَـٰلِكِ يَوْمِ ٱلدِّينِ</span>
                  <AyahMark num={4} />
                </div>

                {/* Line 4 */}
                <div className="mf-fp-row">
                  <span>إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ</span>
                  <AyahMark num={5} />
                </div>

                {/* Line 5 */}
                <div className="mf-fp-row">
                  <span>ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ</span>
                  <AyahMark num={6} />
                  <span>صِرَٰطَ</span>
                </div>

                {/* Line 6 */}
                <div className="mf-fp-row">
                  <span>ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ</span>
                </div>

                {/* Line 7 */}
                <div className="mf-fp-row">
                  <span>ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ</span>
                  <AyahMark num={7} />
                </div>
              </>
            ) : (
              /* ── PAGE 2: AL-BAQARAH / ALIF-LAM-MEEM (6 Classical Lines) ── */
              <>
                {/* Line 1: Bismillah */}
                <div className="mf-fp-row mf-fp-bismillah-row">
                  <span>بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</span>
                </div>

                {/* Line 2: Alif Lam Meem */}
                <div className="mf-fp-row">
                  <span>الٓمٓ</span>
                  <AyahMark num={1} />
                </div>

                {/* Line 3 */}
                <div className="mf-fp-row">
                  <span>ذَٰلِكَ ٱلْكِتَـٰبُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ</span>
                  <AyahMark num={2} />
                </div>

                {/* Line 4 */}
                <div className="mf-fp-row">
                  <span>ٱلَّذِينَ يُؤْمِنُونَ بِٱلْغَيْبِ وَيُقِيمُونَ ٱلصَّلَوٰةَ وَمِمَّا رَزَقْنَـٰهُمْ يُنفِقُونَ</span>
                  <AyahMark num={3} />
                </div>

                {/* Line 5 */}
                <div className="mf-fp-row">
                  <span>وَٱلَّذِينَ يُؤْمِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِٱلْـَٔاخِرَةِ هُمْ يُوقِنُونَ</span>
                  <AyahMark num={4} />
                </div>

                {/* Line 6 */}
                <div className="mf-fp-row">
                  <span>أُو۟لَـٰٓئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُو۟لَـٰٓئِكَ هُمُ ٱلْمُفْلِحُونَ</span>
                  <AyahMark num={5} />
                </div>
              </>
            )}
          </div>

        </div>
      </div>

      {/* ── Bottom Marginal Notations ── */}
      <div className="mf-fp-margins" lang="ar" dir="rtl">
        <span>مَنزِل ١</span>
        <span>١ ع</span>
      </div>

    </div>
  );
}
