import { ArrowLeft } from 'lucide-react';
import { useAppBack } from '../../hooks/useAppNavigation';

/**
 * Production-ready back button for secondary screens.
 * Uses consistent touch targets, emerald active state, accessibility labels,
 * and smart session-history back navigation with fallback.
 */
export default function BackButton({
  fallback = '/',
  label = 'Back',
  className = '',
  style,
  iconSize = 22,
  strokeWidth = 2.2,
}) {
  const handleBack = useAppBack(fallback);

  return (
    <button
      type="button"
      className={`app-back-btn ${className}`.trim()}
      onClick={handleBack}
      aria-label={label}
      title={label}
      style={style}
    >
      <ArrowLeft size={iconSize} strokeWidth={strokeWidth} aria-hidden="true" />
    </button>
  );
}
