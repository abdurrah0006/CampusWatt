import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useSettings } from './SettingsContext.jsx';
import { useInterval } from '../hooks/useInterval.js';

const DataRefreshContext = createContext(null);

export function DataRefreshProvider({ children }) {
  const { refreshSeconds } = useSettings();
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [requestsInFlight, setRequestsInFlight] = useState(0);
  const requestCountRef = useRef(0);

  // Actions
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const markUpdated = useCallback(() => setLastUpdated(new Date()), []);
  const trackRequest = useCallback((change) => {
    requestCountRef.current = Math.max(0, requestCountRef.current + change);
    setRequestsInFlight(requestCountRef.current);
  }, []);

  // Auto refresh
  useInterval(() => {
    if (document.visibilityState === 'visible') refresh();
  }, refreshSeconds * 1000);

  const value = useMemo(() => ({
    refreshKey,
    refresh,
    lastUpdated,
    markUpdated,
    isRefreshing: requestsInFlight > 0,
    trackRequest,
    refreshSeconds,
  }), [refreshKey, refresh, lastUpdated, markUpdated, requestsInFlight, trackRequest, refreshSeconds]);

  return <DataRefreshContext.Provider value={value}>{children}</DataRefreshContext.Provider>;
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext);
  if (!context) throw new Error('useDataRefresh must be used inside <DataRefreshProvider>');
  return context;
}
