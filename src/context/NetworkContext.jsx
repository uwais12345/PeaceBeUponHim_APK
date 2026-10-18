// ============================================
// NETWORK CONTEXT & AUTO-REFRESH HOOKS
// ============================================

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  initNetworkMonitoring,
  subscribeToConnectivity,
  registerRefreshHandler,
  validateConnection,
  triggerAutoRefresh,
  getCurrentNetworkState,
} from '../services/networkManager';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [networkState, setNetworkState] = useState(() => getCurrentNetworkState());
  const [wasOfflineRecently, setWasOfflineRecently] = useState(false);
  const toastTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize global browser & native listeners
    const cleanupMonitoring = initNetworkMonitoring();

    // Subscribe to state updates
    const unsubscribe = subscribeToConnectivity(state => {
      setNetworkState({
        isOnline: state.isOnline,
        isReachable: state.isReachable,
        isReconnecting: state.isReconnecting,
      });

      if (state.wasOffline) {
        setWasOfflineRecently(true);
        clearTimeout(toastTimeoutRef.current);
        toastTimeoutRef.current = setTimeout(() => {
          setWasOfflineRecently(false);
        }, 3200);
      }
    });

    return () => {
      clearTimeout(toastTimeoutRef.current);
      unsubscribe();
      if (typeof cleanupMonitoring === 'function') {
        cleanupMonitoring();
      }
    };
  }, []);

  const manualRefresh = useCallback(() => {
    return validateConnection({ force: true, triggerRefresh: true });
  }, []);

  const value = {
    isOnline: networkState.isOnline,
    isReachable: networkState.isReachable,
    isReconnecting: networkState.isReconnecting,
    isOffline: !networkState.isOnline || !networkState.isReachable,
    wasOfflineRecently,
    manualRefresh,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return ctx;
}

/**
 * Hook to automatically retry/refresh data when internet connectivity returns
 *
 * @param {string} id Unique identifier for this refresh target (e.g. 'home-videos', 'hadith-chapter-1')
 * @param {Function} refreshFn Async function to execute when online connectivity is restored
 * @param {object} options Configuration options
 */
export function useAutoRefresh(id, refreshFn, { enabled = true, deps = [] } = {}) {
  const refreshRef = useRef(refreshFn);

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  useEffect(() => {
    if (!enabled || !id) return;

    const unregister = registerRefreshHandler(id, async () => {
      if (refreshRef.current) {
        await refreshRef.current();
      }
    });

    return () => {
      unregister();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, enabled, ...deps]);
}
