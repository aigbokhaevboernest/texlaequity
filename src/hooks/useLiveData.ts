import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useLiveData
 * Per project requirement: NO auto-refresh anywhere.
 * Data is fetched once on mount and only re-fetched when:
 *  - dependencies change
 *  - refresh() is called manually
 * Polling, focus, visibility, and route-change refreshes are intentionally disabled.
 */
export function useLiveData<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
  // Options retained for backward compatibility but ignored on purpose.
  _opts: { intervalMs?: number; refreshOnFocus?: boolean; refreshOnRoute?: boolean } = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  useEffect(() => {
    mounted.current = true;
    run(true);
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, refreshing, refresh: () => run(false) };
}
