import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getStoredAuth } from "../services/api/client";

const AUTH_STORAGE_KEY = "staffhub_auth";
const AUTH_CHANGE_EVENT = "staffhub-auth-change";

/** Shape of the persisted session, derived from the API client. */
export type StoredAuthSession = NonNullable<ReturnType<typeof getStoredAuth>>;
export type AuthUser = StoredAuthSession["user"];

export type UseAuthResult = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** Whether the user has one of the given roles. */
  hasRole: (...roles: AuthUser["role"][]) => boolean;
  /** Removes the stored session and notifies all hook consumers. */
  clear: () => void;
};

/**
 * The snapshot is the raw localStorage string: primitives compare by value,
 * so useSyncExternalStore stays stable (parsing every time would loop).
 */
function getSnapshot(): string | null {
  try {
    return window.localStorage.getItem(AUTH_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Server and hydration render: nobody is signed in. */
function getServerSnapshot(): string | null {
  return null;
}

function subscribe(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === AUTH_STORAGE_KEY) {
      onChange();
    }
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(AUTH_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(AUTH_CHANGE_EVENT, onChange);
  };
}

/**
 * Call after writing or removing the session in the same tab (the native
 * `storage` event only fires in other tabs) so every useAuth consumer updates.
 */
export function notifyAuthChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
  }
}

/**
 * Reactive, SSR-safe view of the stored auth session.
 * Renders as signed out on the server and during hydration, then updates.
 *
 * @example
 * const { user, isAdmin } = useAuth();
 */
export function useAuth(): UseAuthResult {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Re-read through the client helper whenever the raw value changes.
  const session = useMemo(() => (raw === null ? null : getStoredAuth()), [raw]);

  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Storage unavailable: nothing to clear.
    }
    notifyAuthChange();
  }, []);

  const user = session?.user ?? null;

  return {
    user,
    token: session?.token ?? null,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === "admin",
    hasRole: (...roles) => (user ? roles.includes(user.role) : false),
    clear
  };
}
