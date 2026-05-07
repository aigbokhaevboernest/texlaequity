import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useLiveData
 * Per project requirement: NO auto-refresh anywhere.
 * Data is fetched once on mount and only re-fetched when:
 *  - dependencies change
 *  - refresh() is called manually
 *
 * Optional `cacheKey` enables localStorage caching to eliminate flicker
 * on refresh: the cached value is used as the initial state synchronously
 * (lazy initializer), then silently replaced when the API responds.
 */
export function useLiveData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  opts: { intervalMs?: number; refreshOnFocus?: boolean; refreshOnRoute?: boolean; cacheKey?: string } = {},
) {
  const { cacheKey } = opts;

  const [data, setData] = useState<T | null>(() => {
    if (!cacheKey || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!cacheKey || typeof window === "undefined") return true;
    return !localStorage.getItem(cacheKey);
  });
  const [refreshing, setRefreshing] = useState(false);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const mounted = useRef(true);

  const run = useCallback(async (initial = false) => {
    if (initial) setLoading((prev) => prev); else setRefreshing(true);
    try {
      const v = await fetcherRef.current();
      if (mounted.current) {
        setData(v);
        if (cacheKey && typeof window !== "undefined") {
          try { localStorage.setItem(cacheKey, JSON.stringify(v)); } catch { /* ignore quota */ }
        }
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [cacheKey]);

  useEffect(() => {
    mounted.current = true;
    run(true);
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, refreshing, refresh: () => run(false) };
}
