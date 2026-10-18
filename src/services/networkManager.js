// ============================================
// NETWORK & CONNECTIVITY MANAGER
// Real reachability probes • Debounced events • Deduplication • Retry with backoff
// ============================================

import { App as CapApp } from '@capacitor/app';

// In-flight refresh promises map to prevent duplicate requests
const inFlightRequests = new Map();

// Registered refresh handlers by component/page ID
const refreshHandlers = new Map();

// Connectivity listeners
const listeners = new Set();

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let isReachable = isOnline;
let isReconnecting = false;
let lastOnlineAt = isOnline ? Date.now() : 0;
let lastRefreshedAt = 0;
let debounceTimer = null;

// Probe endpoints to test actual internet reachability
// Probes a lightweight local asset or public CDN with short timeout
async function probeConnectivity(timeoutMs = 3500) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return false;
  }

  // Attempt a fast HEAD request to probe real internet access
  const probeUrls = [
    '/favicon.svg?_probe=' + Date.now(),
    'https://cdn.jsdelivr.net/favicon.ico?_probe=' + Date.now(),
  ];

  for (const url of probeUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
        mode: 'no-cors', // ensures no CORS block for CDN probe
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      // If we got a response (or opaque response from no-cors), internet is reachable!
      return true;
    } catch {
      // try next probe
    }
  }

  return false;
}

/**
 * Notifies all registered listeners of a connectivity change
 */
function notifyListeners(state) {
  listeners.forEach(cb => {
    try {
      cb(state);
    } catch (err) {
      console.error('[NetworkManager] Listener error:', err);
    }
  });
}

/**
 * Validates actual connection status with debouncing
 */
export async function validateConnection({ force = false, triggerRefresh = true } = {}) {
  const browserOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!browserOnline) {
    const wasReachable = isReachable;
    isOnline = false;
    isReachable = false;
    isReconnecting = false;
    notifyListeners({ isOnline: false, isReachable: false, isReconnecting: false, wasOffline: false });
    return false;
  }

  isOnline = true;

  // If already verified recently and not forced, return cached status
  if (!force && isReachable && Date.now() - lastOnlineAt < 10000) {
    return true;
  }

  isReconnecting = true;
  notifyListeners({ isOnline: true, isReachable, isReconnecting: true, wasOffline: false });

  const reachable = await probeConnectivity(3500);
  const wasOffline = !isReachable && reachable;

  isReachable = reachable;
  isReconnecting = false;
  if (reachable) {
    lastOnlineAt = Date.now();
  }

  notifyListeners({
    isOnline,
    isReachable,
    isReconnecting: false,
    wasOffline,
  });

  // If connection was restored, trigger auto-refresh for registered handlers
  if (wasOffline && triggerRefresh) {
    triggerAutoRefresh();
  }

  return reachable;
}

/**
 * Executes registered refresh handlers with rate-limiting and deduplication
 */
export async function triggerAutoRefresh() {
  const now = Date.now();
  // Minimum 8 seconds between mass auto-refresh triggers to respect rate limits
  if (now - lastRefreshedAt < 8000) {
    return;
  }
  lastRefreshedAt = now;

  console.log(`[NetworkManager] Internet restored. Triggering ${refreshHandlers.size} registered refresh handlers...`);

  const promises = [];
  for (const [id, handler] of refreshHandlers.entries()) {
    if (typeof handler === 'function') {
      // Check if this handler is already executing
      if (inFlightRequests.has(id)) {
        continue;
      }

      const p = Promise.resolve()
        .then(() => handler())
        .catch(err => {
          console.warn(`[NetworkManager] Refresh handler '${id}' failed:`, err);
        })
        .finally(() => {
          inFlightRequests.delete(id);
        });

      inFlightRequests.set(id, p);
      promises.push(p);
    }
  }

  await Promise.allSettled(promises);
}

/**
 * Register a component refresh callback when connection returns
 * Returns an unregister function for component unmounting cleanup
 */
export function registerRefreshHandler(id, handlerFn) {
  if (!id || typeof handlerFn !== 'function') return () => {};
  refreshHandlers.set(id, handlerFn);

  return () => {
    refreshHandlers.delete(id);
    inFlightRequests.delete(id);
  };
}

/**
 * Subscribe to connectivity state changes
 * Returns an unsubscribe function
 */
export function subscribeToConnectivity(callback) {
  listeners.add(callback);
  // Send immediate initial state
  callback({
    isOnline,
    isReachable,
    isReconnecting,
    wasOffline: false,
  });

  return () => {
    listeners.delete(callback);
  };
}

/**
 * Exponential backoff fetch retry helper
 * Differentiates network errors (retried) from client errors (not retried)
 */
export async function fetchWithRetry(url, options = {}, { retries = 2, backoff = 1000, timeout = 9000 } = {}) {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // Successful or client-error (4xx like 404/400) should not be retried blindly
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429)) {
        return response;
      }

      // If server error (5xx) or rate limit (429), retry with backoff if attempts remain
      if (attempt === retries) {
        return response; // return final response so caller can parseError
      }
    } catch (err) {
      // Network error, DNS failure, or AbortError
      if (attempt >= retries) {
        throw err;
      }
    }

    attempt++;
    const delay = backoff * Math.pow(2, attempt - 1);
    await new Promise(res => setTimeout(res, delay));
  }
}

/**
 * Initializes global browser and native event listeners
 */
export function initNetworkMonitoring() {
  if (typeof window === 'undefined') return;

  const handleOnline = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      validateConnection({ force: true, triggerRefresh: true });
    }, 1200);
  };

  const handleOffline = () => {
    clearTimeout(debounceTimer);
    isOnline = false;
    isReachable = false;
    isReconnecting = false;
    notifyListeners({ isOnline: false, isReachable: false, isReconnecting: false, wasOffline: false });
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // When user brings app to foreground, check if connectivity status is fresh
      validateConnection({ force: false, triggerRefresh: true });
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Native Android App foreground resume listener
  let nativeAppListener = null;
  try {
    nativeAppListener = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        validateConnection({ force: false, triggerRefresh: true });
      }
    });
  } catch {
    // web fallback
  }

  // Initial connectivity probe
  validateConnection({ force: true, triggerRefresh: false });

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    if (nativeAppListener) {
      nativeAppListener.then(h => h.remove?.()).catch(() => {});
    }
  };
}

export function getCurrentNetworkState() {
  return {
    isOnline,
    isReachable,
    isReconnecting,
  };
}
