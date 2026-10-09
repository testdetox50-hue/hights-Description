"use client";

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  siblings?: number;
}

type Item = number | "gap-start" | "gap-end";

export function getPageItems(
  page: number,
  pageCount: number,
  siblings: number
): Item[] {
  const start = Math.max(2, page - siblings);
  const end = Math.min(pageCount - 1, page + siblings);
  const items: Item[] = [1];
  if (start > 2) items.push("gap-start");
  for (let p = start; p <= end; p += 1) items.push(p);
  if (end < pageCount - 1) items.push("gap-end");
  if (pageCount > 1) items.push(pageCount);
  return items;
}

const base =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 disabled:cursor-not-allowed disabled:opacity-40";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  siblings = 1,
}: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);
  const items = getPageItems(current, pageCount, siblings);

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300"
    >
      <p aria-live="polite">
        Showing <span className="text-white">{from}</span>-
        <span className="text-white">{to}</span> of{" "}
        <span className="text-white">{total}</span>
      </p>
      <ul className="flex items-center gap-1.5">
        <li>
          <button
            type="button"
            className={`${base} border-white/10 bg-white/5 hover:bg-white/10`}
            disabled={current === 1}
            onClick={() => onPageChange(current - 1)}
            aria-label="Previous page"
          >
            <span aria-hidden="true">&lsaquo;</span>
          </button>
        </li>
        {items.map((item) =>
          typeof item === "string" ? (
            <li key={item} aria-hidden="true" className="px-1 text-slate-500">
              &hellip;
            </li>
          ) : (
            <li key={item}>
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === current ? "page" : undefined}
                className={`${base} ${
                  item === current
                    ? "border-violet-400/40 bg-violet-500/20 text-white"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            </li>
          )
        )}
        <li>
          <button
            type="button"
            className={`${base} border-white/10 bg-white/5 hover:bg-white/10`}
            disabled={current === pageCount}
            onClick={() => onPageChange(current + 1)}
            aria-label="Next page"
          >
            <span aria-hidden="true">&rsaquo;</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
