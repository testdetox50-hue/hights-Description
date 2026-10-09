import { useCallback, useMemo, useState } from "react";

export type SortDirection = "asc" | "desc";

export type SortKey<T> = {
  key: keyof T & string;
  direction: SortDirection;
};

export type UseSortOptions<T> = {
  /** Initial sort keys, highest priority first. */
  initialSort?: SortKey<T>[];
  /** Per-key comparers that override the default comparison. */
  comparers?: Partial<Record<keyof T & string, (a: T, b: T) => number>>;
};

export type UseSortResult<T> = {
  sortKeys: SortKey<T>[];
  sorted: T[];
  /** Direction of a key, or undefined when it is not sorted. */
  getDirection: (key: keyof T & string) => SortDirection | undefined;
  /**
   * Cycles a key asc -> desc -> off. Without `additive` it replaces the
   * current sort; with it (e.g. shift-click) it becomes a secondary key.
   */
  toggleSort: (key: keyof T & string, additive?: boolean) => void;
  clearSort: () => void;
};

/** Default comparison: nullish last, numbers/dates numerically, text locale-aware. */
export function defaultCompare(a: unknown, b: unknown): number {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty || bEmpty) {
    return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Generic multi-key sorting for arrays of objects. Does not mutate `items`.
 *
 * @example
 * const { sorted, toggleSort, getDirection } = useSort(employees, {
 *   initialSort: [{ key: "fullName", direction: "asc" }]
 * });
 */
export function useSort<T extends Record<string, unknown>>(
  items: readonly T[],
  options: UseSortOptions<T> = {}
): UseSortResult<T> {
  const { initialSort = [], comparers } = options;
  const [sortKeys, setSortKeys] = useState<SortKey<T>[]>(initialSort);

  const sorted = useMemo(() => {
    if (sortKeys.length === 0) {
      return [...items];
    }
    return [...items].sort((a, b) => {
      for (const { key, direction } of sortKeys) {
        const compare = comparers?.[key];
        const result = compare ? compare(a, b) : defaultCompare(a[key], b[key]);
        if (result !== 0) {
          return direction === "asc" ? result : -result;
        }
      }
      return 0;
    });
  }, [items, sortKeys, comparers]);

  const getDirection = useCallback(
    (key: keyof T & string) => sortKeys.find((entry) => entry.key === key)?.direction,
    [sortKeys]
  );

  const toggleSort = useCallback((key: keyof T & string, additive = false) => {
    setSortKeys((current) => {
      const existing = current.find((entry) => entry.key === key);
      const others = additive ? current.filter((entry) => entry.key !== key) : [];
      if (!existing) {
        return [...others, { key, direction: "asc" }];
      }
      if (existing.direction === "asc") {
        return additive
          ? current.map((entry) => (entry.key === key ? { key, direction: "desc" as const } : entry))
          : [{ key, direction: "desc" }];
      }
      return others;
    });
  }, []);

  const clearSort = useCallback(() => setSortKeys([]), []);

  return { sortKeys, sorted, getDirection, toggleSort, clearSort };
}
