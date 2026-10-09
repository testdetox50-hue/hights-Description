import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms
 * have passed without the value changing.
 *
 * @example
 * const debouncedQuery = useDebounce(query, 300);
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export type DebouncedCallback<Args extends unknown[]> = {
  (...args: Args): void;
  /** Drops any pending invocation. */
  cancel: () => void;
  /** Runs the pending invocation immediately (if there is one). */
  flush: () => void;
};

/**
 * Returns a stable debounced function. The latest `callback` is always used,
 * so it never goes stale, and pending calls are cancelled on unmount.
 *
 * @example
 * const save = useDebouncedCallback((text: string) => api.save(text), 500);
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delay = 300
): DebouncedCallback<Args> {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingArgsRef = useRef<Args | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    const args = pendingArgsRef.current;
    if (!args) {
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingArgsRef.current = null;
    callbackRef.current(...args);
  }, []);

  const debounced = useCallback(
    (...args: Args) => {
      pendingArgsRef.current = args;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        const pending = pendingArgsRef.current;
        pendingArgsRef.current = null;
        if (pending) {
          callbackRef.current(...pending);
        }
      }, delay);
    },
    [delay]
  );

  useEffect(() => cancel, [cancel]);

  return useMemo(
    () => Object.assign((...args: Args) => debounced(...args), { cancel, flush }) as DebouncedCallback<Args>,
    [debounced, cancel, flush]
  );
}
