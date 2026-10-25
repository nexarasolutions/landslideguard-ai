import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dataRef = useRef<T | null>(null);
  dataRef.current = data;

  const run = useCallback((silent = false) => {
    // Only show full loading if we have NO data yet and it's not a silent reload
    if (!silent && dataRef.current === null) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    fn()
      .then((res) => {
        setData(res);
        dataRef.current = res;
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => {
        setLoading(false);
        setIsRefreshing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run(false);
  }, [run]);

  const silentReload = useCallback(() => run(true), [run]);

  return {
    data,
    error,
    loading,
    isRefreshing,
    reload: run,
    silentReload
  };
}

