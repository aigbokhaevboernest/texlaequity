import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

/**
 * useLiveData
 * Refreshes the supplied async fetcher whenever:
 *  - the component mounts
 *  - the user navigates (route pathname change)
 *  - the browser tab regains focus / becomes visible
 *  - an optional polling interval elapses
 *
 * Exposes data, loading, refresh() and a refreshing flag.
 */
export function useLiveData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  opts: { intervalMs?: number; refreshOnFocus?: boolean; refreshOnRoute?: boolean } = {},
) {
  const { intervalMs, refreshOnFocus = true, refreshOnRoute = true } = opts;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mounted = useRef(true);

  const run = useCallback(async (initial = false) => {
    if (initial) setLoading(true); else setRefreshing(true);
    try {
      const v = await fetcherRef.current();
      if (mounted.current) setData(v);
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // initial + dependency-driven fetch
  useEffect(() => {
    mounted.current = true;
    run(true);
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // route change refresh
  useEffect(() => {
    if (!refreshOnRoute) return;
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // visibility / focus refresh
  useEffect(() => {
    if (!refreshOnFocus) return;
    const onVis = () => { if (document.visibilityState === "visible") run(false); };
    const onFocus = () => run(false);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshOnFocus]);

  // optional polling
  useEffect(() => {
    if (!intervalMs) return;
    const id = window.setInterval(() => run(false), intervalMs);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { data, loading, refreshing, refresh: () => run(false) };
}