// Composable validators. A validator returns an error message, or null when valid.

export type Validator<T = string> = (value: T) => string | null;

export interface ValidationResult<K extends string = string> {
  valid: boolean;
  errors: Partial<Record<K, string>>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INDIAN_MOBILE_RE = /^(?:\+91|91|0)?[6-9]\d{9}$/;

export function required(message = "This field is required"): Validator<string> {
  return (value) => (value == null || String(value).trim() === "" ? message : null);
}

export function isEmail(message = "Enter a valid email address"): Validator<string> {
  return (value) => (!value || EMAIL_RE.test(value.trim()) ? null : message);
}

/** Indian mobile number, optional +91/91/0 prefix; spaces and dashes ignored. */
export function isPhone(message = "Enter a valid 10-digit mobile number"): Validator<string> {
  return (value) => {
    if (!value) return null;
    const digits = value.replace(/[\s-]/g, "");
    return INDIAN_MOBILE_RE.test(digits) ? null : message;
  };
}

export function minLength(min: number, message?: string): Validator<string> {
  return (value) =>
    !value || value.trim().length >= min ? null : message ?? `Must be at least ${min} characters`;
}

export function maxLength(max: number, message?: string): Validator<string> {
  return (value) =>
    !value || value.trim().length <= max ? null : message ?? `Must be at most ${max} characters`;
}

export function matches(pattern: RegExp, message = "Invalid format"): Validator<string> {
  return (value) => (!value || pattern.test(value) ? null : message);
}

export function numberInRange(min: number, max: number, message?: string): Validator<number> {
  return (value) =>
    Number.isFinite(value) && value >= min && value <= max
      ? null
      : message ?? `Must be between ${min} and ${max}`;
}

function toIsoTime(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return null;
  const time = new Date(`${value.slice(0, 10)}T00:00:00`).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Validate that a YYYY-MM-DD range is well-formed and start <= end. */
export function dateRange(
  start: string,
  end: string,
  options: { maxDays?: number } = {}
): string | null {
  const s = toIsoTime(start);
  const e = toIsoTime(end);
  if (s === null) return "Start date is invalid";
  if (e === null) return "End date is invalid";
  if (e < s) return "End date cannot be before start date";
  const days = Math.round((e - s) / 86_400_000) + 1;
  if (options.maxDays && days > options.maxDays) {
    return `Range cannot exceed ${options.maxDays} days`;
  }
  return null;
}

/** Combine validators; returns the first error found. */
export function compose<T>(...validators: Validator<T>[]): Validator<T> {
  return (value) => {
    for (const validate of validators) {
      const error = validate(value);
      if (error) return error;
    }
    return null;
  };
}

/** Validate an object against a per-field validator map. */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  rules: { [K in keyof T]?: Validator<T[K]> }
): ValidationResult<Extract<keyof T, string>> {
  const errors: Partial<Record<Extract<keyof T, string>, string>> = {};
  (Object.keys(rules) as Array<Extract<keyof T, string>>).forEach((key) => {
    const validate = rules[key];
    const error = validate ? validate(values[key]) : null;
    if (error) errors[key] = error;
  });
  return { valid: Object.keys(errors).length === 0, errors };
}
