// ============================================
// POSTER GENERATOR ENGINE
// High-resolution (1080px) Islamic Poster Renderer & Exporter
// Formats: Story (1080x1920), Portrait (1080x1350), Square (1080x1080)
// Templates: Emerald & Gold, Cream & Emerald, Midnight Obsidian
import { Capacitor, registerPlugin } from '@capacitor/core';

const MediaDownload = registerPlugin('MediaDownload');

export const POSTER_FORMATS = [
  {
    id: 'story',
    name: 'Story / Status',
    subtitle: 'Instagram Story • WhatsApp Status',
    width: 1080,
    height: 1920,
    aspect: '9:16',
    cssAspect: '9 / 16',
    previewMaxHeight: 520,
  },
  {
    id: 'portrait',
    name: 'Portrait Post',
    subtitle: 'Instagram Feed (4:5)',
    width: 1080,
    height: 1350,
    aspect: '4:5',
    cssAspect: '4 / 5',
    previewMaxHeight: 460,
  },
  {
    id: 'square',
    name: 'Square Post',
    subtitle: 'Instagram Square (1:1)',
    width: 1080,
    height: 1080,
    aspect: '1:1',
    cssAspect: '1 / 1',
    previewMaxHeight: 400,
  },
];

export const POSTER_TEMPLATES = [
  {
    id: 'emerald_gold',
    name: 'Emerald & Gold',
    tamilName: 'மரகத பச்சை & தங்கம்',
    type: 'dark',
    bg: 'linear-gradient(165deg, #072219 0%, #0e3a2d 45%, #051912 100%)',
    bgCard: 'rgba(12, 45, 35, 0.72)',
    border: 'rgba(232, 185, 106, 0.45)',
    accentGold: '#e8b96a',
    accentGreen: '#3dab68',
    textArabic: '#ffffff',
    textTamil: '#f3f6f4',
    textSecondary: '#d0ddd6',
    badgeBg: 'rgba(232, 185, 106, 0.16)',
    badgeBorder: 'rgba(232, 185, 106, 0.4)',
    badgeText: '#f0ca8a',
    ornamentColor: '#e8b96a',
    watermarkBg: 'rgba(5, 25, 18, 0.85)',
    watermarkText: '#e8b96a',
    watermarkSubtext: '#a6c2b5',
  },
  {
    id: 'cream_emerald',
    name: 'Illuminated Cream',
    tamilName: 'வெளிர் கிரீம் & பச்சை',
    type: 'light',
    bg: 'linear-gradient(165deg, #fdfbf7 0%, #f5eee2 50%, #eae1d0 100%)',
    bgCard: 'rgba(255, 255, 255, 0.82)',
    border: 'rgba(18, 77, 43, 0.35)',
    accentGold: '#b8862d',
    accentGreen: '#124d2b',
    textArabic: '#0e3a2d',
    textTamil: '#1f2d24',
    textSecondary: '#485c50',
    badgeBg: 'rgba(18, 77, 43, 0.1)',
    badgeBorder: 'rgba(18, 77, 43, 0.3)',
    badgeText: '#124d2b',
    ornamentColor: '#b8862d',
    watermarkBg: 'rgba(240, 233, 220, 0.92)',
    watermarkText: '#124d2b',
    watermarkSubtext: '#506658',
  },
  {
    id: 'midnight_obsidian',
    name: 'Midnight Obsidian',
    tamilName: 'இரவு கருப்பு & பச்சை',
    type: 'dark',
    bg: 'linear-gradient(165deg, #060907 0%, #0d1510 50%, #040605 100%)',
    bgCard: 'rgba(15, 24, 19, 0.78)',
    border: 'rgba(61, 171, 104, 0.35)',
    accentGold: '#e8b96a',
    accentGreen: '#3dab68',
    textArabic: '#ffffff',
    textTamil: '#edf2ee',
    textSecondary: '#aab8af',
    badgeBg: 'rgba(61, 171, 104, 0.15)',
    badgeBorder: 'rgba(61, 171, 104, 0.45)',
    badgeText: '#4ec47c',
    ornamentColor: '#3dab68',
    watermarkBg: 'rgba(7, 12, 9, 0.92)',
    watermarkText: '#4ec47c',
    watermarkSubtext: '#8fa898',
  },
];

/**
 * Calculates adaptive font sizes based on text character count and format
 */
export function getAdaptiveTypography(arabicText = '', tamilText = '', formatId = 'story') {
  const arabicLength = (arabicText || '').length;
  const tamilLength = (tamilText || '').length;
  const totalLength = arabicLength + tamilLength;

  if (formatId === 'story') {
    // 1080 x 1920 (Plenty of vertical room)
    if (totalLength < 180) {
      return { arabicSize: 52, arabicLine: 2.2, tamilSize: 34, tamilLine: 1.75 };
    } else if (totalLength < 350) {
      return { arabicSize: 44, arabicLine: 2.1, tamilSize: 30, tamilLine: 1.7 };
    } else {
      return { arabicSize: 38, arabicLine: 2.0, tamilSize: 26, tamilLine: 1.65 };
    }
  } else if (formatId === 'portrait') {
    // 1080 x 1350 (Balanced)
    if (totalLength < 180) {
      return { arabicSize: 46, arabicLine: 2.1, tamilSize: 30, tamilLine: 1.7 };
    } else if (totalLength < 350) {
      return { arabicSize: 38, arabicLine: 2.0, tamilSize: 26, tamilLine: 1.65 };
    } else {
      return { arabicSize: 32, arabicLine: 1.9, tamilSize: 22, tamilLine: 1.6 };
    }
  } else {
    // 1080 x 1080 (Compact)
    if (totalLength < 180) {
      return { arabicSize: 40, arabicLine: 2.0, tamilSize: 26, tamilLine: 1.65 };
    } else if (totalLength < 350) {
      return { arabicSize: 32, arabicLine: 1.9, tamilSize: 22, tamilLine: 1.6 };
    } else {
      return { arabicSize: 26, arabicLine: 1.85, tamilSize: 19, tamilLine: 1.55 };
    }
  }
}

/**
 * Render the element using html2canvas into a high-res PNG Blob
 */
export async function exportPosterAsBlob(element, { width = 1080, height = 1920 }) {
  if (!element) throw new Error('Poster element not found');

  // Wait for Google fonts to finish loading
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // fallback
    }
  }

  const { default: html2canvas } = await import('html2canvas');

  const canvas = await html2canvas(element, {
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    scale: 1, // exact 1:1 pixel rendering for target width/height
    useCORS: true,
    allowTaint: true,
    backgroundColor: null,
    logging: false,
    imageTimeout: 5000,
    scrollX: 0,
    scrollY: 0,
    x: 0,
    y: 0,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to blob conversion failed'));
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Trigger immediate download/save of a Blob file to the user's device
 */
export async function downloadPosterBlob(blob, filename = 'peace-daily-inspiration.png') {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      await MediaDownload.saveImage({
        base64Data,
        filename,
      });
      return { success: true, native: true };
    } catch (err) {
      console.warn('Native MediaDownload failed, falling back to web download:', err);
    }
  }

  // Fallback for standard browsers
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { success: true, native: false };
}

/**
 * Native Web Share API integration (Android share sheet for Instagram, WhatsApp, etc.)
 */
export async function sharePosterBlob(blob, { title, text, filename = 'peace-inspiration.png' }) {
  const file = new File([blob], filename, { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: title || 'Daily Islamic Inspiration',
        text: text || 'Peace Be Upon Him - Daily Islamic Inspiration',
      });
      return { shared: true, method: 'native' };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { shared: false, cancelled: true };
      }
      // If native sharing fails for another reason, fallback to download
      downloadPosterBlob(blob, filename);
      return { shared: true, method: 'download_fallback' };
    }
  } else {
    // If files sharing not supported in current browser, trigger direct download
    downloadPosterBlob(blob, filename);
    return { shared: true, method: 'download_fallback' };
  }
}

/**
 * Copies source reference and texts to clipboard
 */
export async function copyInspirationText(item) {
  const text = `${item.arabic ? item.arabic + '\n\n' : ''}${item.meaning_tamil}\n\n— ${item.source}\n(Peace Be Upon Him)`;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  // Fallback for older webviews
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  return true;
}
