import { useCallback, useEffect, useRef, useState } from 'react';

interface DebounceOptions {
  /** If true, executes the callback immediately on the first call, then debounces subsequent calls */
  eager?: boolean;
}

/**
 * Debounce a callback function
 */
export function useDebounce<T extends (...args: unknown[]) => void>(
  callback: T,
  delay: number = 300,
  options?: DebounceOptions,
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef<T>(callback);
  const lastCallRef = useRef<number>(0);
  const isEager = options?.eager ?? false;

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const stableFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      // If eager and enough time has passed, execute immediately
      if (isEager && timeSinceLastCall > delay) {
        callbackRef.current(...args);
        lastCallRef.current = now;
      } else {
        // Otherwise, schedule execution after delay
        timeoutRef.current = setTimeout(() => {
          callbackRef.current(...args);
          lastCallRef.current = Date.now();
        }, delay);
      }
    },
    [delay, isEager],
  );

  return stableFn as T;
}

/**
 * Debounce a value (returns the debounced value)
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
