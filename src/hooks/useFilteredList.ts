import { useCallback, useMemo, useState } from "react";

export type FilterPredicate<T> = (item: T) => boolean;

export type UseFilteredListOptions<T> = {
  /** Fields (or getters) searched by the text query. */
  searchFields: ReadonlyArray<keyof T | ((item: T) => unknown)>;
  /** Initial search text. */
  initialQuery?: string;
  /** Named predicate filters that can be switched on and off. */
  filters?: Record<string, FilterPredicate<T>>;
  /** Initially active filter names. */
  initialActiveFilters?: readonly string[];
  /** Match every search word (AND) instead of any (OR). Default true. */
  matchAll?: boolean;
};

export type UseFilteredListResult<T> = {
  query: string;
  setQuery: (query: string) => void;
  /** Items passing the search and all active filters. */
  filtered: T[];
  total: number;
  activeFilters: ReadonlySet<string>;
  isFilterActive: (name: string) => boolean;
  toggleFilter: (name: string) => void;
  setFilter: (name: string, active: boolean) => void;
  /** Resets the query and all filters. */
  reset: () => void;
  hasActiveCriteria: boolean;
};

/** Lowercases and strips diacritics so "José" matches "jose". */
const normalize = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/**
 * Generic text search plus named predicate filters over a list.
 * The query is split into words; by default every word must match some field.
 *
 * @example
 * const list = useFilteredList(employees, {
 *   searchFields: ["fullName", "email"],
 *   filters: { admins: (e) => e.role === "admin" }
 * });
 */
export function useFilteredList<T>(
  items: readonly T[],
  options: UseFilteredListOptions<T>
): UseFilteredListResult<T> {
  const { searchFields, filters, initialQuery = "", initialActiveFilters = [], matchAll = true } = options;
  const [query, setQuery] = useState(initialQuery);
  const [activeFilters, setActiveFilters] = useState<ReadonlySet<string>>(
    () => new Set(initialActiveFilters)
  );

  const filtered = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    const predicates = [...activeFilters]
      .map((name) => filters?.[name])
      .filter((predicate): predicate is FilterPredicate<T> => Boolean(predicate));

    return items.filter((item) => {
      if (!predicates.every((predicate) => predicate(item))) {
        return false;
      }
      if (words.length === 0) {
        return true;
      }
      const haystack = searchFields
        .map((field) => normalize(typeof field === "function" ? field(item) : item[field]))
        .join("\n");
      return matchAll ? words.every((word) => haystack.includes(word)) : words.some((word) => haystack.includes(word));
    });
  }, [items, query, activeFilters, filters, searchFields, matchAll]);

  const setFilter = useCallback((name: string, active: boolean) => {
    setActiveFilters((current) => {
      if (current.has(name) === active) {
        return current;
      }
      const next = new Set(current);
      if (active) {
        next.add(name);
      } else {
        next.delete(name);
      }
      return next;
    });
  }, []);

  const toggleFilter = useCallback((name: string) => {
    setActiveFilters((current) => {
      const next = new Set(current);
      if (!next.delete(name)) {
        next.add(name);
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setQuery("");
    setActiveFilters(new Set());
  }, []);

  return {
    query,
    setQuery,
    filtered,
    total: items.length,
    activeFilters,
    isFilterActive: (name) => activeFilters.has(name),
    toggleFilter,
    setFilter,
    reset,
    hasActiveCriteria: query.trim() !== "" || activeFilters.size > 0
  };
}
