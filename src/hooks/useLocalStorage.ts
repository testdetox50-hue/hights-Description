import { useCallback, useEffect, useRef, useState } from "react";

export type UseLocalStorageOptions<T> = {
  /** Custom serializer. Defaults to JSON.stringify. */
  serialize?: (value: T) => string;
  /** Custom deserializer. Defaults to JSON.parse. */
  deserialize?: (raw: string) => T;
  /** Keep other tabs/windows in sync via the `storage` event. Default true. */
  syncTabs?: boolean;
};

type SetValue<T> = (value: T | ((previous: T) => T)) => void;

/**
 * Persists state in localStorage.
 *
 * - SSR-safe: the first render always uses `initialValue` (no hydration
 *   mismatch); the stored value is read after mount.
 * - Every storage access is wrapped in try/catch (private mode, quota, bad JSON).
 * - Syncs across browser tabs when `syncTabs` is enabled.
 *
 * @returns `[value, setValue, remove]`
 * @example
 * const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, SetValue<T>, () => void] {
  const { syncTabs = true } = options;
  const serializeRef = useRef(options.serialize ?? ((v: T) => JSON.stringify(v)));
  const deserializeRef = useRef(options.deserialize ?? ((raw: string) => JSON.parse(raw) as T));
  const initialRef = useRef(initialValue);
  const [value, setValue] = useState<T>(initialValue);
  const valueRef = useRef<T>(initialValue);

  useEffect(() => {
    serializeRef.current = options.serialize ?? ((v: T) => JSON.stringify(v));
    deserializeRef.current = options.deserialize ?? ((raw: string) => JSON.parse(raw) as T);
  });

  const read = useCallback((): T => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initialRef.current : deserializeRef.current(raw);
    } catch {
      return initialRef.current;
    }
  }, [key]);

  // Load the stored value after mount (and whenever the key changes).
  useEffect(() => {
    let cancelled = false;
    // Deferred so the first client render still matches the server render.
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      const stored = read();
      valueRef.current = stored;
      setValue(stored);
    });
    return () => {
      cancelled = true;
    };
  }, [read]);

  const set = useCallback<SetValue<T>>(
    (next) => {
      const resolved =
        typeof next === "function" ? (next as (previous: T) => T)(valueRef.current) : next;
      valueRef.current = resolved;
      setValue(resolved);
      try {
        window.localStorage.setItem(key, serializeRef.current(resolved));
      } catch {
        // Storage unavailable or full: keep the in-memory value only.
      }
    },
    [key]
  );

  const remove = useCallback(() => {
    valueRef.current = initialRef.current;
    setValue(initialRef.current);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore.
    }
  }, [key]);

  useEffect(() => {
    if (!syncTabs) {
      return;
    }
    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage || event.key !== key) {
        return;
      }
      const next = read();
      valueRef.current = next;
      setValue(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key, read, syncTabs]);

  return [value, set, remove];
}
