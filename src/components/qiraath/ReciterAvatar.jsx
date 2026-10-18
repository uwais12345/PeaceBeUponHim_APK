import { useState, useEffect, memo } from 'react';
import './ReciterAvatar.css';

// In-memory module cache to eliminate re-fade flickering across route changes
const _loadedReciterCache = new Set();

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (!parts.length || !parts[0]) return 'Q';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * High-performance reciter profile photo component.
 * - Enforces zero layout shift by strictly reserving width & height.
 * - Shows an instantaneous branded initials placeholder while loading.
 * - Uses eager loading and high fetch priority for above-the-fold cards.
 * - Uses lazy loading for below-the-fold cards.
 * - Employs a local offline-safe fallback on network failure (no third-party requests).
 */
const ReciterAvatar = memo(function ReciterAvatar({
  src,
  name = '',
  size = 56,
  priority = false,
  className = '',
  style = {},
  onClick,
}) {
  const isPrecached = _loadedReciterCache.has(src);
  const [isLoaded, setIsLoaded] = useState(isPrecached);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (_loadedReciterCache.has(src)) {
      setIsLoaded(true);
      setHasError(false);
    }
  }, [src]);

  const handleLoad = () => {
    if (src) _loadedReciterCache.add(src);
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoaded(true);
  };

  const initials = getInitials(name);
  const fontSize = Math.max(10, Math.round(size * 0.32));

  return (
    <div
      className={`reciter-avatar-container ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        ...style,
      }}
      onClick={onClick}
    >
      {/* Background Initials & Shimmer Placeholder */}
      {!isLoaded && !hasError && (
        <>
          <div className="reciter-avatar-placeholder" style={{ fontSize: `${fontSize}px` }}>
            {initials}
          </div>
          <div className="reciter-avatar-shimmer" />
        </>
      )}

      {/* Actual Image */}
      {!hasError && src && (
        <img
          src={src}
          alt={name}
          width={size}
          height={size}
          loading={priority ? 'eager' : 'lazy'}
          fetchpriority={priority ? 'high' : 'low'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={`reciter-avatar-img${isLoaded ? ' is-loaded' : ''}`}
        />
      )}

      {/* Offline-Safe Graceful Fallback (if image fails) */}
      {hasError && (
        <div className="reciter-avatar-fallback" style={{ fontSize: `${fontSize}px` }}>
          {initials}
        </div>
      )}
    </div>
  );
});

export default ReciterAvatar;
