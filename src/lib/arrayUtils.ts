// Generic array helpers. None of these mutate their input.

export type SortDirection = "asc" | "desc";

export function groupBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of items) {
    const key = getKey(item);
    (result[key] ??= []).push(item);
  }
  return result;
}

export function countBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, number> {
  const result = {} as Record<K, number>;
  for (const item of items) {
    const key = getKey(item);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

export function indexBy<T, K extends string | number>(
  items: T[],
  getKey: (item: T) => K
): Record<K, T> {
  const result = {} as Record<K, T>;
  for (const item of items) result[getKey(item)] = item;
  return result;
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return 1; // nullish values always sort last
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/** Stable sort by a derived key. */
export function sortBy<T>(
  items: T[],
  getValue: (item: T) => string | number | Date | null | undefined,
  direction: SortDirection = "asc"
): T[] {
  const sign = direction === "asc" ? 1 : -1;
  const normalize = (v: ReturnType<typeof getValue>) => (v instanceof Date ? v.getTime() : v);
  return items
    .map((item, index) => ({ item, index, value: normalize(getValue(item)) }))
    .sort((a, b) => {
      if (a.value == null || b.value == null) return compareValues(a.value, b.value);
      return sign * compareValues(a.value, b.value) || a.index - b.index;
    })
    .map((entry) => entry.item);
}

export function unique<T>(items: T[], getKey: (item: T) => unknown = (item) => item): T[] {
  const seen = new Set<unknown>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function chunk<T>(items: T[], size: number): T[][] {
  if (size < 1) return [];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export interface Page<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

/** 1-based pagination; the page number is clamped into range. */
export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const size = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages);
  const start = (current - 1) * size;
  return {
    items: items.slice(start, start + size),
    page: current,
    pageSize: size,
    totalItems: items.length,
    totalPages,
    hasPrev: current > 1,
    hasNext: current < totalPages,
  };
}

/** Split into [matching, rest]. */
export function partition<T>(items: T[], predicate: (item: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  items.forEach((item) => (predicate(item) ? pass : fail).push(item));
  return [pass, fail];
}

/** Items in `a` that are not in `b`, compared by key. */
export function difference<T>(a: T[], b: T[], getKey: (item: T) => unknown = (x) => x): T[] {
  const exclude = new Set(b.map(getKey));
  return a.filter((item) => !exclude.has(getKey(item)));
}

export function toggleItem<T>(items: T[], item: T): T[] {
  return items.includes(item) ? items.filter((x) => x !== item) : [...items, item];
}
