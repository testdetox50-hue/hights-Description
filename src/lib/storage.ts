// Safe JSON wrapper around localStorage. Never throws; safe during SSR,
// in private windows, or when the quota is exceeded.

interface Envelope<T> {
  v: T;
  exp?: number; // epoch ms
}

function getStore(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function isStorageAvailable(): boolean {
  const store = getStore();
  if (!store) return false;
  try {
    const probe = "__storage_probe__";
    store.setItem(probe, "1");
    store.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Read and parse a JSON value; returns `fallback` if missing, expired or corrupt. */
export function getItem<T>(key: string, fallback: T): T {
  const store = getStore();
  if (!store) return fallback;
  try {
    const raw = store.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw) as Envelope<T>;
    if (parsed && typeof parsed === "object" && "v" in parsed) {
      if (parsed.exp !== undefined && parsed.exp < Date.now()) {
        store.removeItem(key);
        return fallback;
      }
      return parsed.v;
    }
    return fallback;
  } catch {
    return fallback;
  }
}

/** Serialize and store a value; optional TTL in seconds. Returns false on failure. */
export function setItem<T>(key: string, value: T, ttlSeconds?: number): boolean {
  const store = getStore();
  if (!store) return false;
  try {
    const envelope: Envelope<T> = { v: value };
    if (ttlSeconds && ttlSeconds > 0) envelope.exp = Date.now() + ttlSeconds * 1000;
    store.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key: string): void {
  try {
    getStore()?.removeItem(key);
  } catch {
    // ignore
  }
}

/** Read-modify-write helper: `updateItem("cart", [], (c) => [...c, id])`. */
export function updateItem<T>(key: string, fallback: T, updater: (current: T) => T): T {
  const next = updater(getItem(key, fallback));
  setItem(key, next);
  return next;
}

/** Remove every key that starts with a prefix; returns how many were removed. */
export function clearByPrefix(prefix: string): number {
  const store = getStore();
  if (!store) return 0;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (key && key.startsWith(prefix)) keys.push(key);
    }
    keys.forEach((k) => store.removeItem(k));
    return keys.length;
  } catch {
    return 0;
  }
}

/** Namespaced storage so features cannot collide: `createStorage("hr:")`. */
export function createStorage(namespace: string) {
  const k = (key: string) => `${namespace}${key}`;
  return {
    get: <T>(key: string, fallback: T) => getItem(k(key), fallback),
    set: <T>(key: string, value: T, ttlSeconds?: number) => setItem(k(key), value, ttlSeconds),
    remove: (key: string) => removeItem(k(key)),
    update: <T>(key: string, fallback: T, updater: (current: T) => T) =>
      updateItem(k(key), fallback, updater),
    clear: () => clearByPrefix(namespace),
  };
}
