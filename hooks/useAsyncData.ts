import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Calls an async fetcher (a service function like getUpcomingEvents) and
 * tracks loading state. Works identically whether the fetcher resolves
 * mock data instantly or hits Firebase over the network.
 *
 * `refetch` re-runs the fetcher *silently* — it updates the data without
 * flipping `loading` back to true, so pull-to-refresh doesn't blank the
 * screen out and replace it with a spinner.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const isMounted = useRef(true);
  // Kept in a ref so `load` stays stable even though callers usually pass a
  // freshly-created arrow function on every render.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current();
      if (isMounted.current) setData(result);
    } catch (err) {
      if (isMounted.current) {
        console.error('useAsyncData error:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (isMounted.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    load();
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => load(true), [load]);

  return { data, loading, error, refetch };
}