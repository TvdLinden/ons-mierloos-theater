import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored));
      }
      setIsInitialized(true);
    }
  }, [key]);

  // Save to localStorage when value changes (but not on initial load)
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  }, [key, value, isInitialized]);

  // Stable setter function that doesn't change on every render
  const setStoredValue = useCallback((newValue: T | ((prev: T) => T)) => {
    setValue(newValue);
  }, []);

  return [value, setStoredValue] as const;
}
