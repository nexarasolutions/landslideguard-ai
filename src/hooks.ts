import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync<T>(
  fn: () => Promise<T>,
  deps: unknown[] = [],
  pollIntervalMs?: number
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dataRef = useRef<T | null>(null);
  dataRef.current = data;

  const fnRef = useRef(fn);
  fnRef.current = fn;

  const run = useCallback((silent = false) => {
    // Only show full blocking loading if we have NO data at all
    if (!silent && dataRef.current === null) {
      setLoading(true);
    }
    setError(null);

    return fnRef.current()
      .then((res) => {
        // Prevent re-rendering if data has not changed
        setData((prev) => {
          if (prev !== null && JSON.stringify(prev) === JSON.stringify(res)) {
            return prev;
          }
          dataRef.current = res;
          return res;
        });
      })
      .catch((e) => setError(String(e?.message ?? e)))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Fetch when dependencies change
  useEffect(() => {
    run(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Background polling interval - completely stable, never re-created unnecessarily
  useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs <= 0) return;
    const timer = setInterval(() => {
      run(true);
    }, pollIntervalMs);
    return () => clearInterval(timer);
  }, [pollIntervalMs, run]);

  const silentReload = useCallback(() => run(true), [run]);

  return {
    data,
    error,
    loading,
    reload: run,
    silentReload
  };
}
