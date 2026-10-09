export type UserRole = "admin" | "employee";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
};

export type StoredAuth = {
  token: string;
  user: AuthUser;
};

export type AuthErrors = Partial<Record<"fullName" | "email" | "password" | "role", string>>;

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function isUserRole(value: unknown): value is UserRole {
  return value === "admin" || value === "employee";
}

export function isAuthUser(value: unknown): value is AuthUser {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.fullName === "string" &&
    typeof value.email === "string" &&
    isUserRole(value.role)
  );
}

export function isStoredAuth(value: unknown): value is StoredAuth {
  return isRecord(value) && typeof value.token === "string" && value.token.length > 0 && isAuthUser(value.user);
}

export function normalizeAuthUser(raw: Record<string, unknown>): AuthUser {
  const meta = isRecord(raw.user_metadata) ? raw.user_metadata : {};
  const role = str(firstDefined(raw, ["role"]) ?? meta.role).toLowerCase();
  return {
    id: str(firstDefined(raw, ["_id", "id", "userid", "user_id"])),
    fullName: str(firstDefined(raw, ["fullName", "fullname", "full_name", "name"]) ?? meta.full_name ?? meta.fullName),
    email: str(raw.email).toLowerCase(),
    role: isUserRole(role) ? role : "employee"
  };
}

export function normalizeStoredAuth(raw: Record<string, unknown>): StoredAuth | null {
  const token = str(firstDefined(raw, ["token", "access_token", "accessToken"]));
  const user = isRecord(raw.user) ? normalizeAuthUser(raw.user) : null;
  return token && user?.id ? { token, user } : null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return `Password must be at least ${8} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}

export function validateAuthInput(raw: Record<string, unknown>, mode: "login" | "register" = "login"): AuthErrors {
  const user = normalizeAuthUser(raw);
  const password = str(raw.password);
  const errors: AuthErrors = {};

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.email = "Enter a valid email address.";
  }
  const passwordError = mode === "login" ? (password ? null : "Password is required.") : validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }
  if (mode === "login") {
    return errors;
  }
  if (user.fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }
  return errors;
}

export const isAdmin = (auth: StoredAuth | AuthUser | null | undefined): boolean =>
  (auth && "user" in auth ? auth.user : auth)?.role === "admin";

/** Reads the expiry (ms epoch) from a JWT payload; returns null when the token is opaque or malformed. */
export function getTokenExpiry(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) {
    return null;
  }
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, now = Date.now()): boolean {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry <= now;
}
