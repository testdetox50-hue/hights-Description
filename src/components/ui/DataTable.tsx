"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: "left" | "center" | "right";
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  caption?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

type SortState = { key: string; dir: "asc" | "desc" } | null;

const alignClass = { left: "text-left", center: "text-center", right: "text-right" };

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  emptyMessage = "No records to display.",
  onRowClick,
}: DataTableProps<T>) {
  const [sort, setSort] = useState<SortState>(null);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!sort || !col?.sortValue) return rows;
    const getValue = col.sortValue;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * factor;
      }
      return String(av).localeCompare(String(bv)) * factor;
    });
  }, [rows, columns, sort]);

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null;
    });
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
      <table className="w-full border-collapse text-sm text-slate-200">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
            {columns.map((col) => {
              const active = sort?.key === col.key;
              const sortable = Boolean(col.sortValue);
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={
                    !sortable ? undefined : !active ? "none" : sort?.dir === "asc" ? "ascending" : "descending"
                  }
                  className={`px-4 py-3 font-medium ${alignClass[col.align ?? "left"]}`}
                >
                  {sortable ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 uppercase hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
                    >
                      {col.header}
                      <span aria-hidden="true">
                        {active ? (sort?.dir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-10 text-center text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr
                key={getRowId(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }}
                className={`border-b border-white/5 last:border-0 ${
                  onRowClick
                    ? "cursor-pointer hover:bg-white/5 focus:bg-white/10 focus:outline-none"
                    : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 ${alignClass[col.align ?? "left"]} ${col.className ?? ""}`}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
