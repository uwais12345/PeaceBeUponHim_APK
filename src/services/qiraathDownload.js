// ============================================================
// QIRAATH AUDIO DOWNLOAD SERVICE
// Persistent full-surah audio downloading & offline playback
// Native: App-private internal storage via QiraathDownload plugin
// Web/PWA: CacheStorage ('qiraath-audio-cache') with Blob URL
// ============================================================

import { Capacitor, registerPlugin } from '@capacitor/core';

const NativeQiraathDownload = registerPlugin('QiraathDownload');
const AUDIO_CACHE_NAME = 'qiraath-audio-cache';
const METADATA_KEY = 'qiraath_downloads_meta';

/* ── Format helpers ── */
export function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function getAudioFilename(reciterId, surahId) {
  const pad = String(surahId).padStart(3, '0');
  return `${reciterId}_${pad}.mp3`;
}

export function getDownloadKey(reciterId, surahId) {
  return `${reciterId}_${surahId}`;
}

/* ── Metadata Persistence ── */
export function getQiraathDownloadMeta() {
  try {
    const raw = localStorage.getItem(METADATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveQiraathDownloadMeta(meta) {
  try {
    localStorage.setItem(METADATA_KEY, JSON.stringify(meta));
  } catch (e) {
    console.warn('[QiraathDownload] Failed to save metadata to localStorage:', e);
  }
}

export function getSurahDownloadStatus(reciterId, surahId) {
  if (!reciterId || !surahId) return { status: 'none', progress: 0 };
  const meta = getQiraathDownloadMeta();
  const key = getDownloadKey(reciterId, surahId);
  return meta[key] || { status: 'none', progress: 0 };
}

export function getDownloadedSurahIdsForReciter(reciterId) {
  if (!reciterId) return new Set();
  const meta = getQiraathDownloadMeta();
  const set = new Set();
  Object.values(meta).forEach(item => {
    if (item.reciterId === reciterId && item.status === 'downloaded') {
      set.add(item.surahId);
    }
  });
  return set;
}

/* ── Event Subscribers ── */
const listeners = new Set();

export function subscribeToQiraathDownload(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function emitProgress(key, status, progress, extra = {}) {
  const meta = getQiraathDownloadMeta();
  if (status === 'downloaded' || status === 'error' || status === 'none' || status === 'cancelled') {
    if (status === 'downloaded') {
      meta[key] = {
        ...meta[key],
        ...extra,
        status: 'downloaded',
        progress: 100,
        completedAt: Date.now(),
      };
    } else if (status === 'error') {
      meta[key] = {
        ...meta[key],
        status: 'error',
        progress: 0,
        error: extra.error || 'Download failed',
      };
    } else if (status === 'cancelled') {
      delete meta[key];
    }
    saveQiraathDownloadMeta(meta);
  }

  listeners.forEach(cb => {
    try {
      cb({ key, status, progress, ...extra });
    } catch (e) {
      console.error('[QiraathDownload] Subscriber callback error:', e);
    }
  });
}

/* ── Initialize Native Plugin Listeners ── */
if (Capacitor.isNativePlatform()) {
  NativeQiraathDownload.addListener('qiraathDownloadProgress', (data) => {
    if (!data || !data.key) return;
    emitProgress(data.key, data.status, data.progress || 0, {
      bytesDownloaded: data.bytesDownloaded,
      totalBytes: data.totalBytes,
      filePath: data.filePath,
      error: data.error,
    });
  }).catch(() => {});
}

/* ── Active Web AbortControllers ── */
const webAbortControllers = new Map();

/* ════════════════════════════════════════════════════════════
   DOWNLOAD SURAH AUDIO
   ════════════════════════════════════════════════════════════ */
export async function downloadSurahAudio(reciter, surah) {
  if (!reciter?.id || !surah?.id) {
    throw new Error('Reciter and Surah are required to download');
  }

  const key = getDownloadKey(reciter.id, surah.id);
  const filename = getAudioFilename(reciter.id, surah.id);
  const audioUrl = surah.audioUrl;

  const currentStatus = getSurahDownloadStatus(reciter.id, surah.id);
  if (currentStatus.status === 'downloading') {
    return; // Prevent duplicate simultaneous requests
  }

  // Update initial status
  const meta = getQiraathDownloadMeta();
  meta[key] = {
    key,
    reciterId: reciter.id,
    surahId: surah.id,
    surahName: surah.name,
    reciterName: reciter.name,
    audioUrl,
    filename,
    status: 'downloading',
    progress: 0,
    startedAt: Date.now(),
  };
  saveQiraathDownloadMeta(meta);
  emitProgress(key, 'downloading', 0);

  // 1. NATIVE ANDROID DOWNLOAD
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeQiraathDownload.downloadSurahAudio({
        url: audioUrl,
        filename,
        key,
      });

      emitProgress(key, 'downloaded', 100, {
        filePath: res.filePath,
        fileSize: res.fileSize,
        formattedSize: formatBytes(res.fileSize),
      });
      return res;
    } catch (err) {
      emitProgress(key, 'error', 0, { error: err?.message || 'Download failed' });
      throw err;
    }
  }

  // 2. WEB / PWA BROWSER FALLBACK
  try {
    const controller = new AbortController();
    webAbortControllers.set(key, controller);

    const response = await fetch(audioUrl, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = Number(response.headers.get('content-length')) || 0;
    const reader = response.body?.getReader();

    if (!reader) {
      // Fallback if ReadableStream is not available
      const blob = await response.blob();
      const cache = await caches.open(AUDIO_CACHE_NAME);
      await cache.put(audioUrl, new Response(blob));
      emitProgress(key, 'downloaded', 100, {
        fileSize: blob.size,
        formattedSize: formatBytes(blob.size),
      });
      return;
    }

    const chunks = [];
    let receivedBytes = 0;
    let lastEmitTime = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      chunks.push(value);
      receivedBytes += value.length;

      const now = Date.now();
      if (now - lastEmitTime > 250) {
        lastEmitTime = now;
        const progress = contentLength > 0 ? Math.round((receivedBytes * 100) / contentLength) : 0;
        emitProgress(key, 'downloading', progress, {
          bytesDownloaded: receivedBytes,
          totalBytes: contentLength,
        });
      }
    }

    const fullBlob = new Blob(chunks, { type: 'audio/mpeg' });
    const cache = await caches.open(AUDIO_CACHE_NAME);
    await cache.put(audioUrl, new Response(fullBlob, {
      headers: { 'Content-Type': 'audio/mpeg', 'Content-Length': String(fullBlob.size) },
    }));

    emitProgress(key, 'downloaded', 100, {
      fileSize: fullBlob.size,
      formattedSize: formatBytes(fullBlob.size),
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      emitProgress(key, 'cancelled', 0);
      return;
    }
    emitProgress(key, 'error', 0, { error: err.message || 'Download failed' });
    throw err;
  } finally {
    webAbortControllers.delete(key);
  }
}

/* ════════════════════════════════════════════════════════════
   CANCEL ACTIVE DOWNLOAD
   ════════════════════════════════════════════════════════════ */
export async function cancelSurahAudioDownload(reciterId, surahId) {
  const key = getDownloadKey(reciterId, surahId);

  if (Capacitor.isNativePlatform()) {
    try {
      await NativeQiraathDownload.cancelDownload({ key });
    } catch (e) {
      console.warn('[QiraathDownload] Native cancel error:', e);
    }
  } else {
    const controller = webAbortControllers.get(key);
    if (controller) {
      controller.abort();
      webAbortControllers.delete(key);
    }
  }

  emitProgress(key, 'cancelled', 0);
}

/* ════════════════════════════════════════════════════════════
   DELETE DOWNLOADED AUDIO
   ════════════════════════════════════════════════════════════ */
export async function deleteSurahAudioDownload(reciterId, surahId) {
  const key = getDownloadKey(reciterId, surahId);
  const filename = getAudioFilename(reciterId, surahId);
  const meta = getQiraathDownloadMeta();
  const item = meta[key];

  if (Capacitor.isNativePlatform()) {
    try {
      await NativeQiraathDownload.deleteAudioFile({ filename });
    } catch (e) {
      console.warn('[QiraathDownload] Native delete error:', e);
    }
  } else if (item?.audioUrl) {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      await cache.delete(item.audioUrl);
    } catch (e) {
      console.warn('[QiraathDownload] Cache delete error:', e);
    }
  }

  delete meta[key];
  saveQiraathDownloadMeta(meta);
  emitProgress(key, 'none', 0);
}

/* ════════════════════════════════════════════════════════════
   GET PLAYABLE AUDIO URL (Local file if available, else online)
   ════════════════════════════════════════════════════════════ */
export async function getPlayableAudioUrl(reciterId, surahId, remoteUrl) {
  if (!reciterId || !surahId) return remoteUrl;

  const key = getDownloadKey(reciterId, surahId);
  const filename = getAudioFilename(reciterId, surahId);
  const meta = getQiraathDownloadMeta();
  const entry = meta[key];

  // 1. NATIVE ANDROID: Check local file existence on disk
  if (Capacitor.isNativePlatform()) {
    try {
      const res = await NativeQiraathDownload.checkAudioFile({ filename });
      if (res && res.exists && res.filePath) {
        // Convert to local server URL supported by WebView asset loader
        return Capacitor.convertFileSrc(res.filePath);
      }
    } catch (e) {
      console.warn('[QiraathDownload] Check native file failed:', e);
    }
    return remoteUrl;
  }

  // 2. WEB / PWA: Check CacheStorage
  if (entry?.status === 'downloaded' && typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      const matched = await cache.match(remoteUrl);
      if (matched) {
        const blob = await matched.blob();
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('[QiraathDownload] Cache matching failed:', e);
    }
  }

  return remoteUrl;
}
