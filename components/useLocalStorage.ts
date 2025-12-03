import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const stored = window.localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Use a ref to track whether we've skipped the initial save
  const isFirstRunRef = useRef(true);

  // Save to localStorage when value changes (but not on initial load)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isFirstRunRef.current) {
      // Skip the initial write because state was populated from storage
      isFirstRunRef.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors
    }
  }, [key, value]);

  // Stable setter function that doesn't change on every render
  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof newValue === 'function' ? (newValue as (p: T) => T)(prev) : newValue,
    );
  }, []);

  return [value, setStoredValue] as const;
}
