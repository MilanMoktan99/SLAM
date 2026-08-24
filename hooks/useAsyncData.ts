import { useEffect, useState } from 'react';

/**
 * Calls an async fetcher (a service function like getUpcomingEvents) and
 * tracks loading state. Works identically whether the fetcher resolves
 * mock data instantly or hits Firebase over the network.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (isMounted) setData(result);
      })
      .catch((err) => {
        if (isMounted) {
          console.error('useAsyncData error:', err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}