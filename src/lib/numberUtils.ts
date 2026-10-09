// Numeric helpers for stats and dashboards. All functions are safe on empty input.

export function clamp(value: number, min: number, max: number): number {
  if (min > max) [min, max] = [max, min];
  return Math.min(Math.max(value, min), max);
}

export function sum(values: number[]): number {
  return values.reduce((total, v) => total + v, 0);
}

export function average(values: number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function min(values: number[]): number {
  return values.length === 0 ? 0 : Math.min(...values);
}

export function max(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values);
}

/** Most frequent value; ties resolve to the smallest. Returns null when empty. */
export function mode(values: number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  let best: number | null = null;
  let bestCount = 0;
  counts.forEach((count, value) => {
    if (count > bestCount || (count === bestCount && best !== null && value < best)) {
      best = value;
      bestCount = count;
    }
  });
  return best;
}

/** Population standard deviation. */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((v) => (v - mean) ** 2)));
}

/** part / total as a percentage; 0 when total is 0. */
export function percent(part: number, total: number, decimals = 1): number {
  if (!total) return 0;
  const factor = 10 ** decimals;
  return Math.round((part / total) * 100 * factor) / factor;
}

/** Percentage change from previous to current; null when previous is 0. */
export function percentChange(previous: number, current: number, decimals = 1): number | null {
  if (!previous) return null;
  const factor = 10 ** decimals;
  return Math.round(((current - previous) / Math.abs(previous)) * 100 * factor) / factor;
}

/** Linear interpolation between a and b by t (0..1, clamped). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

/** Percentile using linear interpolation (p in 0..100). */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = (clamp(p, 0, 100) / 100) * (sorted.length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (rank - lower);
}

export function isNumeric(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Safe numeric coercion with fallback for NaN/undefined/empty strings. */
export function toNumber(value: unknown, fallback = 0): number {
  if (isNumeric(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/,/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

/** Inclusive integer range: range(1, 5) -> [1,2,3,4,5]. */
export function range(start: number, end: number, step = 1): number[] {
  if (step <= 0) return [];
  const out: number[] = [];
  for (let n = start; n <= end; n += step) out.push(n);
  return out;
}
