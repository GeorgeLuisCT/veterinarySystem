"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay = 350
) {
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<number | null>(null);
  const searchFnRef = useRef(searchFn);

  useEffect(() => {
    searchFnRef.current = searchFn;
  }, [searchFn]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const search = useCallback(
    (query: string) => {
      cancel();

      const trimmed = query.trim();
      if (trimmed.length < 2) {
        setOptions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      timerRef.current = window.setTimeout(async () => {
        try {
          const result = await searchFnRef.current(trimmed);
          setOptions(result);
        } catch (error) {
          console.error(error);
          setOptions([]);
        } finally {
          setLoading(false);
        }
      }, delay);
    },
    [cancel, delay]
  );

  useEffect(() => cancel, [cancel]);

  return { options, setOptions, loading, search, cancel };
}
