import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Download,
  Check,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import {
  POSTER_FORMATS,
  POSTER_TEMPLATES,
  getAdaptiveTypography,
  exportPosterAsBlob,
  downloadPosterBlob,
} from '../../utils/posterGenerator';
import { formatDisplayDate, getLocalDateString } from '../../services/dailyInspiration';
import './PosterModal.css';

/**
 * Calculates adaptive font sizes for the live preview so text never clips
 */
function getPreviewTypography(arabicText = '', tamilText = '', formatId = 'story') {
  const arabicLen = (arabicText || '').length;
  const tamilLen = (tamilText || '').length;
  const total = arabicLen + tamilLen;

  if (formatId === 'story') {
    if (total < 120) {
      return { arabicSize: '14px', arabicLine: 1.9, tamilSize: '11px', tamilLine: 1.55, gap: '6px' };
    } else if (total < 220) {
      return { arabicSize: '12px', arabicLine: 1.8, tamilSize: '9.8px', tamilLine: 1.5, gap: '5px' };
    } else if (total < 340) {
      return { arabicSize: '10.5px', arabicLine: 1.7, tamilSize: '8.8px', tamilLine: 1.42, gap: '3px' };
    } else {
      return { arabicSize: '9.5px', arabicLine: 1.6, tamilSize: '7.8px', tamilLine: 1.35, gap: '2px' };
    }
  } else if (formatId === 'portrait') {
    if (total < 120) {
      return { arabicSize: '13px', arabicLine: 1.85, tamilSize: '10.5px', tamilLine: 1.5, gap: '5px' };
    } else if (total < 220) {
      return { arabicSize: '11px', arabicLine: 1.75, tamilSize: '9.2px', tamilLine: 1.42, gap: '4px' };
    } else {
      return { arabicSize: '9.5px', arabicLine: 1.6, tamilSize: '8px', tamilLine: 1.35, gap: '2px' };
    }
  } else {
    if (total < 120) {
      return { arabicSize: '12px', arabicLine: 1.75, tamilSize: '9.5px', tamilLine: 1.45, gap: '4px' };
    } else if (total < 220) {
      return { arabicSize: '10px', arabicLine: 1.65, tamilSize: '8.2px', tamilLine: 1.38, gap: '3px' };
    } else {
      return { arabicSize: '8.8px', arabicLine: 1.55, tamilSize: '7.4px', tamilLine: 1.3, gap: '2px' };
    }
  }
}

export default function PosterModal({ item, dateStr, onClose }) {
  const [selectedFormat, setSelectedFormat] = useState('story');
  const [selectedTemplate, setSelectedTemplate] = useState('emerald_gold');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState('');

  // Hidden 1080px node for html2canvas export
  const exportNodeRef = useRef(null);

  const formatObj = POSTER_FORMATS.find(f => f.id === selectedFormat) || POSTER_FORMATS[0];
  const templateObj = POSTER_TEMPLATES.find(t => t.id === selectedTemplate) || POSTER_TEMPLATES[0];

  const currentDateStr = dateStr || getLocalDateString();
  const formattedDate = formatDisplayDate(currentDateStr, 'ta');

  const typography = getAdaptiveTypography(item.arabic, item.meaning_tamil, selectedFormat);
  const previewType = getPreviewTypography(item.arabic, item.meaning_tamil, selectedFormat);

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && !isExporting) onClose();
    };
    const handleBack = e => {
      if (!isExporting) {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pbuh:back', handleBack);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('poster-modal-active');
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pbuh:back', handleBack);
      document.body.style.overflow = '';
      document.body.classList.remove('poster-modal-active');
    };
  }, [onClose, isExporting]);

  const handleDownload = async () => {
    if (isExporting || !exportNodeRef.current) return;
    setIsExporting(true);
    setExportSuccess('');

    try {
      const blob = await exportPosterAsBlob(exportNodeRef.current, {
        width: formatObj.width,
        height: formatObj.height,
      });
      const filename = `peace-${item.type}-${selectedFormat}-${Date.now()}.png`;
      await downloadPosterBlob(blob, filename);
      setExportSuccess('படமாக சேமிக்கப்பட்டது!');
      setTimeout(() => setExportSuccess(''), 2500);
    } catch (err) {
      console.error('Export failed:', err);
      alert('படத்தை உருவாக்குவதில் பிழை ஏற்பட்டது.');
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeLabel = () => {
    if (item.type === 'quran') return 'திருக்குர்ஆன் வசனம்';
    if (item.type === 'hadith') return 'நபிமொழி பொன்மொழி';
    return 'தினசரி துஆ';
  };

  const modalContent = (
    <div className="ios-sheet-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ios-sheet-dialog" onClick={e => e.stopPropagation()}>
        {/* Apple Sheet Grabber Handle */}
        <div className="ios-sheet-grabber-bar">
          <span className="ios-sheet-grabber" />
        </div>

        {/* Header */}
        <div className="ios-sheet-header">
          <div className="ios-sheet-title-box">
            <h3 className="ios-sheet-title">போஸ்டர் தயார் செய்க</h3>
            <span className="ios-sheet-sub">1080px HD Export</span>
          </div>
          <button className="ios-sheet-close-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="ios-sheet-body">
          {/* Live Preview Card */}
          <div className="ios-sheet-preview-wrap">
            <div
              className={`ios-sheet-preview-stage ${selectedFormat}`}
              style={{
                aspectRatio: formatObj.cssAspect,
                background: templateObj.bg,
                borderColor: templateObj.border,
              }}
            >
              <div
                className="ios-sheet-preview-inner"
                style={{
                  borderColor: templateObj.border,
                  backgroundColor: templateObj.bgCard,
                }}
              >
                {/* Corner Ornaments */}
                <div className="poster-corner top-left" style={{ borderColor: templateObj.ornamentColor }} />
                <div className="poster-corner top-right" style={{ borderColor: templateObj.ornamentColor }} />
                <div className="poster-corner bottom-left" style={{ borderColor: templateObj.ornamentColor }} />
                <div className="poster-corner bottom-right" style={{ borderColor: templateObj.ornamentColor }} />

                <div className="sheet-poster-header">
                  <span
                    className="sheet-poster-type"
                    style={{
                      background: templateObj.badgeBg,
                      borderColor: templateObj.badgeBorder,
                      color: templateObj.badgeText,
                    }}
                  >
                    ✦ {getTypeLabel()}
                  </span>
                  <span className="sheet-poster-date" style={{ color: templateObj.textSecondary }}>
                    {formattedDate}
                  </span>
                </div>

                <div className="sheet-poster-content" style={{ gap: previewType.gap }}>
                  {item.arabic && (
                    <div
                      className="sheet-arabic"
                      dir="rtl"
                      style={{
                        color: templateObj.textArabic,
                        fontSize: previewType.arabicSize,
                        lineHeight: previewType.arabicLine,
                      }}
                    >
                      {item.arabic}
                    </div>
                  )}

                  <div className="sheet-flourish" style={{ color: templateObj.ornamentColor }}>
                    <svg width="44" height="6" viewBox="0 0 44 6" fill="none">
                      <path d="M0 3H16M28 3H44M22 0L24.5 3L22 6L19.5 3L22 0Z" stroke="currentColor" strokeWidth="1" />
                      <circle cx="17" cy="3" r="1" fill="currentColor" />
                      <circle cx="27" cy="3" r="1" fill="currentColor" />
                    </svg>
                  </div>

                  <div
                    className="sheet-tamil"
                    style={{
                      color: templateObj.textTamil,
                      fontSize: previewType.tamilSize,
                      lineHeight: previewType.tamilLine,
                    }}
                  >
                    {item.meaning_tamil}
                  </div>

                  <div
                    className="sheet-source-pill"
                    style={{
                      borderColor: templateObj.border,
                      background: templateObj.badgeBg,
                      color: templateObj.badgeText,
                    }}
                  >
                    <span>{item.source}</span>
                  </div>
                </div>

                {/* Watermark Logo */}
                <div
                  className="sheet-watermark"
                  style={{
                    backgroundColor: templateObj.watermarkBg,
                    borderColor: templateObj.border,
                  }}
                >
                  <img
                    src="/channels4_profile.jpg"
                    alt="Logo"
                    className="sheet-watermark-logo"
                  />
                  <div className="sheet-watermark-copy">
                    <span className="sheet-watermark-name" style={{ color: templateObj.watermarkText }}>
                      Peace Be Upon Him
                    </span>
                    <span className="sheet-watermark-tag" style={{ color: templateObj.watermarkSubtext }}>
                      Tamil Islamic Knowledge Platform
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls: Clean Dropdowns Row */}
          <div className="sheet-dropdowns-row">
            <div className="sheet-select-field">
              <label htmlFor="format-select" className="sheet-select-label">வடிவம் (Ratio)</label>
              <div className="sheet-select-wrapper">
                <select
                  id="format-select"
                  className="sheet-select"
                  value={selectedFormat}
                  onChange={e => setSelectedFormat(e.target.value)}
                >
                  {POSTER_FORMATS.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.aspect} ({f.id === 'story' ? 'Story' : f.id === 'portrait' ? 'Feed' : 'Square'})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="sheet-select-chevron" />
              </div>
            </div>

            <div className="sheet-select-field">
              <label htmlFor="theme-select" className="sheet-select-label">தீம் (Theme)</label>
              <div className="sheet-select-wrapper">
                <select
                  id="theme-select"
                  className="sheet-select"
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                >
                  {POSTER_TEMPLATES.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.id === 'emerald_gold' ? 'Emerald • பச்சை' : t.id === 'cream_emerald' ? 'Cream • கிரீம்' : 'Midnight • கருப்பு'}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="sheet-select-chevron" />
              </div>
            </div>
          </div>
        </div>

        {/* Docked Actions Footer */}
        <div className="ios-sheet-footer">
          <button
            type="button"
            className="sheet-btn-primary"
            onClick={handleDownload}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="spin-icon" />
                <span>உருவாக்குகிறது...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>பதிவிறக்கம் (Download)</span>
              </>
            )}
          </button>

          {exportSuccess && (
            <div className="sheet-toast-success">
              <Check size={14} />
              <span>{exportSuccess}</span>
            </div>
          )}
        </div>

        {/* -------------------------------------------------------------
            HIDDEN 1080px NODE FOR HTML2CANVAS EXPORT
        ------------------------------------------------------------- */}
        <div
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: `${formatObj.width}px`,
            height: `${formatObj.height}px`,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: -9999,
            opacity: 0,
          }}
        >
          <div
            ref={exportNodeRef}
            style={{
              width: `${formatObj.width}px`,
              height: `${formatObj.height}px`,
              background: templateObj.bg,
              padding: selectedFormat === 'story' ? '80px 70px' : '65px 60px',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: "'Inter', 'Noto Sans Tamil', sans-serif",
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                border: `3px solid ${templateObj.border}`,
                borderRadius: '24px',
                backgroundColor: templateObj.bgCard,
                boxSizing: 'border-box',
                padding: selectedFormat === 'story' ? '60px 50px' : '45px 40px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
              }}
            >
              {/* Corner Ornaments */}
              <div style={{ position: 'absolute', top: '12px', left: '12px', width: '32px', height: '32px', borderTop: `4px solid ${templateObj.ornamentColor}`, borderLeft: `4px solid ${templateObj.ornamentColor}` }} />
              <div style={{ position: 'absolute', top: '12px', right: '12px', width: '32px', height: '32px', borderTop: `4px solid ${templateObj.ornamentColor}`, borderRight: `4px solid ${templateObj.ornamentColor}` }} />
              <div style={{ position: 'absolute', bottom: '12px', left: '12px', width: '32px', height: '32px', borderBottom: `4px solid ${templateObj.ornamentColor}`, borderLeft: `4px solid ${templateObj.ornamentColor}` }} />
              <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '32px', height: '32px', borderBottom: `4px solid ${templateObj.ornamentColor}`, borderRight: `4px solid ${templateObj.ornamentColor}` }} />

              {/* Header */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
                  <span style={{ background: templateObj.badgeBg, border: `1.5px solid ${templateObj.badgeBorder}`, color: templateObj.badgeText, padding: '12px 28px', borderRadius: '999px', fontSize: '22px', fontWeight: '700' }}>
                    ✦ {getTypeLabel()}
                  </span>
                  <span style={{ color: templateObj.textSecondary, fontSize: '20px', fontWeight: '500' }}>
                    {formattedDate}
                  </span>
                </div>
                <div style={{ textAlign: 'center', color: templateObj.ornamentColor, marginBottom: '35px' }}>
                  <svg width="240" height="20" viewBox="0 0 120 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 7H45M75 7H120M60 1L64 7L60 13L56 7L60 1Z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="50" cy="7" r="2.5" fill="currentColor" />
                    <circle cx="70" cy="7" r="2.5" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* Center */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', flex: 1 }}>
                {item.arabic && (
                  <div
                    dir="rtl"
                    style={{
                      fontFamily: "'Amiri', 'Traditional Arabic', serif",
                      color: templateObj.textArabic,
                      fontSize: `${typography.arabicSize}px`,
                      lineHeight: typography.arabicLine,
                      fontWeight: '700',
                      marginBottom: '35px',
                      maxWidth: '92%',
                      textShadow: templateObj.type === 'dark' ? '0 2px 12px rgba(0,0,0,0.45)' : 'none',
                    }}
                  >
                    {item.arabic}
                  </div>
                )}
                <div style={{ color: templateObj.ornamentColor, margin: '20px 0 35px 0', opacity: 0.85, display: 'flex', justifyContent: 'center' }}>
                  <svg width="180" height="16" viewBox="0 0 120 14" fill="none">
                    <path d="M0 7H45M75 7H120M60 1L64 7L60 13L56 7L60 1Z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="50" cy="7" r="2.5" fill="currentColor" />
                    <circle cx="70" cy="7" r="2.5" fill="currentColor" />
                  </svg>
                </div>
                <div
                  style={{
                    fontFamily: "'Noto Sans Tamil', 'Inter', sans-serif",
                    color: templateObj.textTamil,
                    fontSize: `${typography.tamilSize}px`,
                    lineHeight: typography.tamilLine,
                    fontWeight: '500',
                    maxWidth: '94%',
                    marginBottom: '40px',
                    textWrap: 'balance',
                  }}
                >
                  {item.meaning_tamil}
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', background: templateObj.badgeBg, border: `1.5px solid ${templateObj.border}`, borderRadius: '999px', padding: '12px 28px', color: templateObj.badgeText, fontSize: '20px', fontWeight: '600' }}>
                  <span>{item.source}</span>
                </div>
              </div>

              {/* Watermark Footer */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: templateObj.watermarkBg, border: `1.5px solid ${templateObj.border}`, borderRadius: '16px', padding: '18px 24px', boxSizing: 'border-box' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                  <img
                    src="/channels4_profile.jpg"
                    alt="Logo"
                    style={{ width: '60px', height: '60px', borderRadius: '50%', border: `2px solid ${templateObj.ornamentColor}`, objectFit: 'cover' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '22px', fontWeight: '700', color: templateObj.watermarkText }}>
                      Peace Be Upon Him
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: '500', color: templateObj.watermarkSubtext }}>
                      Tamil Islamic Knowledge Platform
                    </span>
                  </div>
                </div>
                <span style={{ color: templateObj.ornamentColor, fontSize: '14px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  Daily Reminder
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
