// ============================================
// YOUTUBE SERVICE
// All API calls handled server-side via proxy
// to avoid exposing API key in browser
// ============================================

// Proxy endpoint — API key stays server-side
const PROXY = '/api/youtube';
const CHANNEL_ID = import.meta.env.VITE_YOUTUBE_CHANNEL_ID;

export const isConfigured = !!CHANNEL_ID;

const ytCache = new Map();
const CACHE_TTL = 15 * 60 * 1000;

async function fetchYT(endpoint, params = {}) {
  if (!isConfigured) throw new Error('YouTube channel ID not configured');

  const baseUrl = import.meta.env.VITE_API_BASE_URL || window.location.origin;
  const url = new URL(PROXY, baseUrl);
  url.searchParams.set('endpoint', endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const cacheKey = url.toString();
  const cached = ytCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // Check persistent storage for quick warm-up
  const storageKey = `yt_cache_${endpoint}_${JSON.stringify(params)}`;

  try {
    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status >= 500) {
        throw new Error("Unable to connect to the server. Please try again later.");
      }
      if (res.status === 403 || res.status === 429) {
        throw new Error("YouTube API limit reached. Please try again later.");
      }
      throw new Error(err?.error?.message || `Failed to load data (Error ${res.status}).`);
    }
    const data = await res.json();
    ytCache.set(cacheKey, { data, ts: Date.now() });
    try {
      localStorage.setItem(storageKey, JSON.stringify({ data, ts: Date.now() }));
    } catch {
      // ignore quota
    }
    return data;
  } catch (err) {
    // If network fails (e.g. airplane mode or offline), check persistent fallback cache
    try {
      const persisted = localStorage.getItem(storageKey);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        if (parsed?.data) {
          ytCache.set(cacheKey, { data: parsed.data, ts: parsed.ts || Date.now() });
          return parsed.data;
        }
      }
    } catch {
      // ignore
    }

    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error("Please check your internet connection and try again.");
    }
    throw err;
  }
}

// Get channel info + statistics
export async function getChannelInfo() {
  const data = await fetchYT('channels', {
    part: 'snippet,statistics,brandingSettings',
    id: CHANNEL_ID,
  });
  const channel = data.items?.[0];
  if (!channel) throw new Error('Channel not found');

  return {
    id: channel.id,
    title: channel.snippet?.title,
    description: channel.snippet?.description,
    customUrl: channel.snippet?.customUrl,
    thumbnail: channel.snippet?.thumbnails?.high?.url || channel.snippet?.thumbnails?.default?.url,
    banner: channel.brandingSettings?.image?.bannerExternalUrl,
    subscriberCount: channel.statistics?.subscriberCount,
    viewCount: channel.statistics?.viewCount,
    videoCount: channel.statistics?.videoCount,
    hiddenSubscribers: channel.statistics?.hiddenSubscriberCount,
    uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
    country: channel.snippet?.country,
    publishedAt: channel.snippet?.publishedAt,
  };
}

// Get uploads playlist ID
export async function getUploadsPlaylistId() {
  const data = await fetchYT('channels', {
    part: 'contentDetails',
    id: CHANNEL_ID,
  });
  return data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || null;
}

async function getUploadsPage(playlistId, { maxResults, pageToken = '' }) {
  const params = {
    part: 'snippet',
    playlistId,
    maxResults,
  };
  if (pageToken) params.pageToken = pageToken;

  const data = await fetchYT('playlistItems', params);

  const videoIds = (data.items || [])
    .map(item => item.snippet?.resourceId?.videoId)
    .filter(Boolean);

  // Get video stats in a single batch call
  const statsMap = {};
  if (videoIds.length) {
    const statsData = await fetchYT('videos', {
      part: 'statistics,contentDetails',
      id: videoIds.join(','),
    });
    (statsData.items || []).forEach(v => {
      statsMap[v.id] = {
        viewCount: v.statistics?.viewCount,
        likeCount: v.statistics?.likeCount,
        commentCount: v.statistics?.commentCount,
        duration: v.contentDetails?.duration,
      };
    });
  }

  const videos = (data.items || []).map(item => {
    const videoId = item.snippet?.resourceId?.videoId;
    return {
      id: videoId,
      title: item.snippet?.title,
      description: item.snippet?.description,
      thumbnail:
        item.snippet?.thumbnails?.maxres?.url ||
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.medium?.url,
      publishedAt: item.snippet?.publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      ...(statsMap[videoId] || {}),
    };
  });

  return {
    videos,
    nextPageToken: data.nextPageToken,
    totalResults: data.pageInfo?.totalResults,
  };
}

// Get latest uploads
export async function getLatestVideos({ maxResults = 12, pageToken = '' } = {}) {
  const playlistId = await getUploadsPlaylistId();
  if (!playlistId) throw new Error('Could not find uploads playlist');

  const data = await getUploadsPage(playlistId, { maxResults, pageToken });
  return data;
}

function durationInSeconds(duration = '') {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (Number(match[1] || 0) * 3600) + (Number(match[2] || 0) * 60) + Number(match[3] || 0);
}

// Find full-length videos even when newer Shorts fill the first upload pages.
export async function getLatestFullVideos({ maxResults = 12, pageToken = '' } = {}) {
  const playlistId = await getUploadsPlaylistId();
  if (!playlistId) throw new Error('Could not find uploads playlist');

  const videos = [];
  let nextPageToken = pageToken;
  let pagesScanned = 0;
  do {
    const page = await getUploadsPage(playlistId, {
      maxResults: 50,
      pageToken: nextPageToken,
    });
    videos.push(...page.videos.filter(video => durationInSeconds(video.duration) > 180));
    nextPageToken = page.nextPageToken || '';
    pagesScanned += 1;
  } while (videos.length < maxResults && nextPageToken && pagesScanned < 5);

  return { videos, nextPageToken };
}

// Format numbers for display
export function formatCount(count) {
  if (!count) return null;
  const n = parseInt(count, 10);
  if (isNaN(n)) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// Format duration from ISO 8601
export function formatDuration(iso) {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = match[1] ? `${match[1]}:` : '';
  const m = match[2] ? (match[1] ? match[2].padStart(2, '0') : match[2]) : '0';
  const s = (match[3] || '0').padStart(2, '0');
  return `${h}${m}:${s}`;
}

// Format relative date
export function formatRelativeDate(isoDate) {
  if (!isoDate) return '';
  const diff = Date.now() - new Date(isoDate).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}
