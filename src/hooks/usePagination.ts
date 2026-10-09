import { useCallback, useMemo, useState } from "react";

export type UsePaginationOptions = {
  /** Total number of items across all pages. */
  totalItems: number;
  /** Initial page size. Default 10. */
  initialPageSize?: number;
  /** Initial 1-based page. Default 1. */
  initialPage?: number;
  /** How many page buttons to show on each side of the current page. Default 1. */
  siblings?: number;
};

export type PageItem = number | "ellipsis";

export type UsePaginationResult = {
  page: number;
  pageSize: number;
  totalPages: number;
  /** Zero-based index of the first item on this page. */
  startIndex: number;
  /** Exclusive end index (use with Array.slice). */
  endIndex: number;
  hasNext: boolean;
  hasPrev: boolean;
  /** Page numbers with "ellipsis" gaps, ready to render. */
  pages: PageItem[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  next: () => void;
  prev: () => void;
  first: () => void;
  last: () => void;
  /** Slices an in-memory array to the current page. */
  paginate: <T>(items: readonly T[]) => T[];
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Client-side pagination state with a compact page list (1 ... 4 5 6 ... 20).
 * The page is clamped automatically when `totalItems` or `pageSize` shrinks.
 */
export function usePagination({
  totalItems,
  initialPageSize = 10,
  initialPage = 1,
  siblings = 1
}: UsePaginationOptions): UsePaginationResult {
  const [pageSize, setPageSizeState] = useState(Math.max(1, initialPageSize));
  const [page, setPageState] = useState(Math.max(1, initialPage));

  const totalPages = Math.max(1, Math.ceil(Math.max(0, totalItems) / pageSize));

  const currentPage = clamp(page, 1, totalPages);

  const setPage = useCallback(
    (p: number) => setPageState(clamp(Math.floor(p) || 1, 1, totalPages)),
    [totalPages]
  );
  const setPageSize = useCallback((size: number) => {
    setPageSizeState(Math.max(1, Math.floor(size) || 1));
    setPageState(1);
  }, []);

  const pages = useMemo<PageItem[]>(() => {
    const slots = siblings * 2 + 5; // first, last, current, 2 ellipses, siblings
    if (totalPages <= slots) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const left = Math.max(currentPage - siblings, 2);
    const right = Math.min(currentPage + siblings, totalPages - 1);
    const result: PageItem[] = [1];
    if (left > 2) {
      result.push("ellipsis");
    } else if (left === 2) {
      result.push(2);
    }
    for (let p = Math.max(left, 3); p <= Math.min(right, totalPages - 2); p += 1) {
      result.push(p);
    }
    if (right < totalPages - 1) {
      result.push("ellipsis");
    } else if (right === totalPages - 1) {
      result.push(totalPages - 1);
    }
    result.push(totalPages);
    return result;
  }, [currentPage, siblings, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, Math.max(0, totalItems));

  return {
    page: currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
    pages,
    setPage,
    setPageSize,
    next: () => setPage(currentPage + 1),
    prev: () => setPage(currentPage - 1),
    first: () => setPage(1),
    last: () => setPage(totalPages),
    paginate: <T,>(items: readonly T[]) => items.slice(startIndex, endIndex)
  };
}
