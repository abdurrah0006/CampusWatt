import { useCallback, useEffect, useRef, useState } from 'react';
import { useDataRefresh } from '../context/DataRefreshContext.jsx';
import { useToast } from './useToast.js';

const TOAST_COOLDOWN_MS = 60000;

export function useApi(fetcher, dependencies = []) {
  const { refreshKey, markUpdated, trackRequest } = useDataRefresh();
  const toast = useToast();
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  const latestRequestId = useRef(0);
  const hasData = useRef(false);
  const lastToastTime = useRef(0);

  fetcherRef.current = fetcher;

  // Background error
  const showRefreshError = useCallback((error) => {
    if (Date.now() - lastToastTime.current < TOAST_COOLDOWN_MS) return;
    lastToastTime.current = Date.now();
    toast.error('Live update failed', `${error.message} Showing the last available data.`);
  }, [toast]);

  // Load
  const load = useCallback(async () => {
    latestRequestId.current += 1;
    const requestId = latestRequestId.current;
    const isBackgroundRefresh = hasData.current;
    if (isBackgroundRefresh) setRefreshing(true);
    if (!isBackgroundRefresh) setState((previous) => ({ ...previous, loading: true, error: null }));
    trackRequest(1);

    try {
      const data = await fetcherRef.current();
      if (requestId !== latestRequestId.current) return;
      hasData.current = true;
      setState({ data, error: null, loading: false });
      markUpdated();
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      if (isBackgroundRefresh) {
        showRefreshError(error);
        setState((previous) => ({ ...previous, loading: false }));
      } else {
        setState({ data: null, error, loading: false });
      }
    } finally {
      trackRequest(-1);
      if (requestId === latestRequestId.current) setRefreshing(false);
    }
  }, [markUpdated, showRefreshError, trackRequest]);

  // Effects
  useEffect(() => {
    load();
  }, dependencies);

  useEffect(() => {
    if (refreshKey > 0) load();
  }, [refreshKey]);

  const retry = useCallback(() => {
    hasData.current = false;
    load();
  }, [load]);

  return { ...state, refreshing, reload: load, retry };
}
