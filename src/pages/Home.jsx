import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, Play, Users, Eye, Video,
  ChevronRight
} from 'lucide-react';
import {
  getChannelInfo, getLatestVideos, formatCount, formatRelativeDate, formatDuration, isConfigured
} from '../services/youtube';
import PrayerTimes from '../components/prayer/PrayerTimes';
import { useLang } from '../context/AppContext';
import { useAutoRefresh } from '../context/NetworkContext';
import hadithBookIcon from '../assets/hadith-book.svg';
import quranBookIcon from '../assets/quran-book.svg';
import duaBookIcon from '../assets/dua-book.svg';
import dhikrTasbihIcon from '../assets/dhikr-tasbih.svg';
import afterSalahBookIcon from '../assets/after-salah-book.svg';
import libraryBooksIcon from '../assets/library-books.svg';
import './Home.css';

import FriendlyError from '../components/ui/FriendlyError';
import { parseError } from '../utils/errorHandling';

/* ── Skeleton helpers ── */
function StatSkeleton() {
  return (
    <div className="hm-stat-card skeleton-pulse" style={{ height: '80px' }}></div>
  );
}

function VideoSkeleton() {
  return (
    <div className="hm-video-row skeleton-pulse" style={{ height: '80px', borderRadius: '12px' }}></div>
  );
}

function NotConfigured({ t }) {
  return (
    <div className="empty-state">
      <p className="empty-state-title">YouTube Integration Not Configured</p>
      <p className="empty-state-desc">Please set your YouTube API key in the configuration.</p>
    </div>
  );
}

/* ── Video Card ── */
function VideoCard({ video }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="hm-video-row"
      aria-label={`Watch: ${video.title}`}
    >
      <div className="hm-video-thumb-wrap">
        {video.thumbnail
          ? <img src={video.thumbnail} alt="" className="hm-video-thumb" loading="lazy" />
          : <div className="hm-video-thumb hm-video-thumb-placeholder"><Play size={24} /></div>
        }
        {video.duration && (
          <span className="hm-video-duration">{formatDuration(video.duration)}</span>
        )}
      </div>
      <div className="hm-video-info">
        <h4 className="hm-video-title">
          {video.title ? video.title.replace(/#\S+/g, '').replace(/\s+/g, ' ').trim() : ''}
        </h4>
        <div className="hm-video-meta">
          {video.viewCount && <span>{formatCount(video.viewCount)} views</span>}
          {video.viewCount && video.publishedAt && <span>•</span>}
          {video.publishedAt && <span>{formatRelativeDate(video.publishedAt)}</span>}
        </div>
      </div>
    </a>
  );
}

/* ── Feature items config ── */
const FEATURES = [
  { to: '/quran',       key: 'quran',       arabic: 'قرآن',      image: quranBookIcon,       accentColor: '#e9a825' },
  { to: '/hadith',      key: 'hadith',      arabic: 'حديث',      image: hadithBookIcon,      accentColor: '#df94be' },
  { to: '/dua',         key: 'dua',         arabic: 'دعاء',      image: duaBookIcon,         accentColor: '#6de0b0' },
  { to: '/dhikr',       key: 'dhikr',       arabic: 'ذكر',       image: dhikrTasbihIcon,     accentColor: '#f3ca56' },
  { to: '/after-salah', key: 'afterSalah',  arabic: 'بعد الصلاة', image: afterSalahBookIcon,  accentColor: '#9fd7bb' },
  { to: '/library',     key: 'library',     arabic: 'مكتبة',     image: libraryBooksIcon,    accentColor: '#86baa5' },
];

// In-memory module cache for instant return navigation
let _homeCache = null;

/* ══════════════════════════════════════════════════
   MAIN HOME PAGE
══════════════════════════════════════════════════ */
export default function Home() {
  const [channel, setChannel] = useState(() => _homeCache?.channel || null);
  const [videos, setVideos]   = useState(() => _homeCache?.videos || []);
  const [loading, setLoading] = useState(() => !_homeCache && isConfigured);
  const [error, setError]     = useState(null);
  const { t, lang } = useLang();

  const loadHomeData = useCallback(async (isRetry = false) => {
    if (!_homeCache) setLoading(true);
    if (!isRetry) setError('');
    try {
      const [ch, vids] = await Promise.all([getChannelInfo(), getLatestVideos({ maxResults: 4 })]);
      _homeCache = { channel: ch, videos: vids.videos || [] };
      setChannel(ch);
      setVideos(vids.videos || []);
      setError('');
    } catch (e) {
      if (!_homeCache) {
        setError(parseError(e, 'YouTube content'));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    loadHomeData();
  }, [loadHomeData]);

  // Automatically retry loading home YouTube content when network connectivity returns
  useAutoRefresh('home-content', () => loadHomeData(true), {
    enabled: isConfigured && (!!error || !videos.length || !channel),
    deps: [isConfigured, !!error, videos.length, !!channel],
  });

  return (
    <main className="hm-page fade-in" id="main-content">

      {/* ── HERO BANNER ── */}
      <section className="hm-hero" aria-label="Channel introduction">
        {/* Decorative background icon */}
        <span className="hm-hero-bg-icon" aria-hidden="true">📖</span>

        <div className="hm-hero-inner">
          <div className="hm-hero-pill arabic-text notranslate" dir="rtl" translate="no">
            قُرْآن • حَدِيث • سُنَّة
          </div>
          <h1 className="hm-hero-title">Peace Be Upon Him</h1>
          <p className="hm-hero-desc">{t('heroDesc')}</p>
          <div className="hm-hero-actions">
            <a
              href={channel?.customUrl
                ? `https://www.youtube.com/${channel.customUrl}`
                : `https://www.youtube.com/channel/UCqqdcoMxWpjUltJExFyZ9AQ`}
              target="_blank"
              rel="noopener noreferrer"
              className="hm-btn-yt"
              id="hero-watch-btn"
            >
              <Play size={15} aria-hidden="true" fill="currentColor" />
              {t('watchOnYouTube')}
            </a>
            <a
              href="https://www.instagram.com/peace_be_upon_him__?stkn=MW5uY2RrNWZqbXc1Ng=="
              target="_blank"
              rel="noopener noreferrer"
              className="hm-btn-ig"
              id="hero-instagram-btn"
            >
              <Camera size={15} aria-hidden="true" />
              {t('instagram')}
            </a>
          </div>
        </div>
      </section>

      {/* ── PRAYER TIMES ── */}
      <section className="hm-section" aria-label="Prayer Times">
        <PrayerTimes />
      </section>

      {/* ── FEATURES GRID ── */}
      <section className="hm-section" aria-label="Quick access to Islamic resources">
        <div className="hm-section-header">
          <h2 className="hm-section-title">{t('features')}</h2>
        </div>
        <div className="hm-features-grid">
          {FEATURES.map(({ to, key, arabic, icon: Icon, image, accentColor }) => (
            <Link key={to} to={to} className="hm-feature-card" id={`feature-${key}`}>
              <div className="hm-feature-icon-wrap" style={{ '--feature-accent': accentColor }}>
                {image ? (
                  <img
                    src={image}
                    alt={t(key)}
                    className="hm-feature-icon-img"
                    aria-hidden="true"
                  />
                ) : (
                  <Icon size={20} aria-hidden="true" />
                )}
              </div>
              <div className="hm-feature-text">
                <div className="hm-feature-name">
                  {t(key)}
                  {lang !== 'ar' && (
                    <span className="hm-feature-arabic arabic-text notranslate" dir="rtl" translate="no" style={{ color: accentColor }}>
                      {arabic}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── CHANNEL STATS ── */}
      <section className="hm-section" aria-label={t('channelStats')}>
        <div className="hm-section-header">
          <div>
            <h2 className="hm-section-title">{t('channelStats')}</h2>
            <p className="hm-section-sub">{t('liveFromYoutube')}</p>
          </div>
          <a
            href={channel?.customUrl
              ? `https://youtube.com/${channel.customUrl}`
              : `https://www.youtube.com/channel/UCqqdcoMxWpjUltJExFyZ9AQ`}
            target="_blank"
            rel="noopener noreferrer"
            className="hm-link-sm"
          >
            {t('visitChannel')} <ChevronRight size={12} />
          </a>
        </div>

        {!isConfigured
          ? <NotConfigured />
          : loading && !error
          ? (
            <div className="hm-stats-wrap">
              <div className="hm-stats-grid">
                <StatSkeleton /><StatSkeleton /><StatSkeleton />
              </div>
            </div>
          )
          : error
          ? (
            <FriendlyError 
              title={error.title} 
              message={error.message} 
              icon={error.icon} 
              onRetry={() => loadHomeData(true)} 
              isRetrying={loading}
            />
          )
          : channel && (
            <div className="hm-stats-wrap">
              <div className="hm-stats-grid">
                {!channel.hiddenSubscribers && channel.subscriberCount && (
                  <div className="hm-stat-card">
                    <Users size={18} className="hm-stat-icon" aria-hidden="true" />
                    <p className="hm-stat-number">{formatCount(channel.subscriberCount)}</p>
                    <p className="hm-stat-label">{t('subscribers')}</p>
                  </div>
                )}
                {channel.viewCount && (
                  <div className="hm-stat-card">
                    <Eye size={18} className="hm-stat-icon" aria-hidden="true" />
                    <p className="hm-stat-number">{formatCount(channel.viewCount)}</p>
                    <p className="hm-stat-label">{t('totalViews')}</p>
                  </div>
                )}
                {channel.videoCount && (
                  <div className="hm-stat-card">
                    <Video size={18} className="hm-stat-icon" aria-hidden="true" />
                    <p className="hm-stat-number">{formatCount(channel.videoCount)}</p>
                    <p className="hm-stat-label">{t('videos')}</p>
                  </div>
                )}
              </div>
            </div>
          )
        }
      </section>

      {/* ── LATEST VIDEOS ── */}
      <section className="hm-section" aria-label={t('latestVideos')}>
        <div className="hm-section-header">
          <div>
            <h2 className="hm-section-title">{t('latestVideos')}</h2>
          </div>
        </div>

        {!isConfigured
          ? <NotConfigured />
          : loading && !error
          ? (
            <div className="hm-videos-list">
              {Array(3).fill(0).map((_, i) => <VideoSkeleton key={i} />)}
            </div>
          )
          : error
          ? (
            <FriendlyError 
              title={error.title} 
              message={error.message} 
              icon={error.icon} 
              onRetry={() => loadHomeData(true)} 
              isRetrying={loading}
            />
          )
          : videos.length > 0
          ? <div className="hm-videos-list">{videos.map(v => <VideoCard key={v.id} video={v} />)}</div>
          : <div className="empty-state"><p className="empty-state-title">{t('noVideos')}</p></div>
        }
      </section>

    </main>
  );
}
