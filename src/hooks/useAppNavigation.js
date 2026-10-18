import { useNavigate, useLocation, useNavigationType } from 'react-router-dom';
import { useCallback, useEffect } from 'react';

// In-memory stack of routes visited during the current app session
const routeStack = typeof window !== 'undefined' && window.location?.pathname
  ? [window.location.pathname]
  : ['/'];

/**
 * Tracks route changes in the app navigation stack.
 * Prevents consecutive duplicates and keeps the stack synchronized with browser history.
 */
export function trackAppRoute(pathname, navigationType) {
  if (!pathname) return;

  if (navigationType === 'PUSH') {
    routeStack.push(pathname);
  } else if (navigationType === 'REPLACE') {
    if (routeStack.length > 0) {
      routeStack[routeStack.length - 1] = pathname;
    } else {
      routeStack.push(pathname);
    }
  } else if (navigationType === 'POP') {
    // User navigated via Back/Forward or history.go
    const lastIdx = routeStack.lastIndexOf(pathname);
    if (lastIdx !== -1) {
      // Truncate forward history
      routeStack.splice(lastIdx + 1);
    } else {
      // Route was not found in our history stack (e.g. pop into new state)
      if (routeStack.length > 1) {
        routeStack.pop();
      } else {
        routeStack[0] = pathname;
      }
    }
  }
}

/**
 * Returns the current route stack snapshot (for debugging/testing).
 */
export function getRouteStack() {
  return [...routeStack];
}

/**
 * Finds the previous in-app route before entering the Quran section.
 * Skips all consecutive or nested /quran* routes so Back on /quran leaves Quran cleanly.
 */
export function getPreviousNonQuranRoute() {
  for (let i = routeStack.length - 2; i >= 0; i--) {
    const route = routeStack[i];
    if (route && !route.startsWith('/quran')) {
      return {
        route,
        stepsBack: (routeStack.length - 1) - i,
      };
    }
  }
  return null;
}

/**
 * Checks if browser history has a valid prior entry in the current session.
 * We specifically check window.history.state.idx > 0 because window.history.length
 * is often > 1 even on a fresh tab/reload from browser session history.
 */
export function hasValidHistoryBack() {
  if (typeof window === 'undefined') return false;
  const hasHistoryIdx =
    window.history.state &&
    typeof window.history.state.idx === 'number' &&
    window.history.state.idx > 0;
  return Boolean(hasHistoryIdx && routeStack.length > 1);
}

let isBackNavigating = false;
let backNavTimer = null;

export function performAppBack(navigate, currentPath, fallbackPath = '/') {
  if (!navigate || isBackNavigating) return;
  isBackNavigating = true;
  clearTimeout(backNavTimer);
  backNavTimer = setTimeout(() => {
    isBackNavigating = false;
  }, 320);

  // 1. Quran Juz Index (/quran) - Must navigate out of Quran without reopening /quran
  if (currentPath === '/quran' || currentPath.startsWith('/quran?')) {
    const nonQuranTarget = getPreviousNonQuranRoute();
    if (
      nonQuranTarget &&
      hasValidHistoryBack() &&
      (window.history.state?.idx ?? 0) >= nonQuranTarget.stepsBack
    ) {
      navigate(-nonQuranTarget.stepsBack);
    } else if (nonQuranTarget) {
      navigate(nonQuranTarget.route, { replace: true });
    } else {
      navigate(fallbackPath || '/', { replace: true });
    }
    return;
  }

  // 2. Mushaf Reader (/quran/mushaf/page/:num) - Returns to /quran
  if (currentPath.startsWith('/quran/mushaf/page/')) {
    const prevRoute = routeStack.length >= 2 ? routeStack[routeStack.length - 2] : null;
    if (prevRoute === '/quran' && hasValidHistoryBack()) {
      navigate(-1);
    } else {
      navigate('/quran', { replace: true });
    }
    return;
  }

  // 3. General in-app back with safe session check
  if (hasValidHistoryBack()) {
    navigate(-1);
  } else {
    navigate(fallbackPath, { replace: true });
  }
}

/**
 * Custom hook for resilient in-app back navigation.
 */
export function useAppBack(fallbackPath = '/') {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = useCallback(() => {
    performAppBack(navigate, location.pathname, fallbackPath);
  }, [navigate, location.pathname, fallbackPath]);

  return handleBack;
}

/**
 * React Router component to sync route navigation with routeStack.
 */
export function AppNavigationTracker() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    trackAppRoute(location.pathname, navigationType);
  }, [location.pathname, navigationType]);

  return null;
}
