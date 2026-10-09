"use client";

import { useEffect, useState } from "react";

import { ATTENDANCE_STATUSES, DEFAULT_FILTERS } from "./attendanceTypes";
import type { AttendanceFilterState, AttendanceStatus } from "./attendanceTypes";

type AttendanceFiltersProps = {
  value: AttendanceFilterState;
  onChange: (next: AttendanceFilterState) => void;
  counts?: Partial<Record<AttendanceStatus, number>>;
  debounceMs?: number;
  showSearch?: boolean;
};

export default function AttendanceFilters({ value, onChange, counts, debounceMs = 250, showSearch = true }: AttendanceFiltersProps) {
  const [draft, setDraft] = useState(value.query);
  const [syncedQuery, setSyncedQuery] = useState(value.query);

  // Keep the input in sync when the parent resets filters (adjusting state during render).
  if (syncedQuery !== value.query) {
    setSyncedQuery(value.query);
    setDraft(value.query);
  }

  // Debounce typing so large ledgers are not re-filtered on every keystroke.
  useEffect(() => {
    if (draft === value.query) {
      return;
    }
    const timer = window.setTimeout(() => onChange({ ...value, query: draft }), debounceMs);
    return () => window.clearTimeout(timer);
  }, [draft, debounceMs, onChange, value]);

  const isDirty = value.query !== DEFAULT_FILTERS.query || value.status !== DEFAULT_FILTERS.status;
  const options: (AttendanceStatus | "All")[] = ["All", ...ATTENDANCE_STATUSES];

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      {showSearch ? (
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Search employees</span>
          <input
            type="search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search name or email"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none"
          />
        </label>
      ) : null}

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
        {options.map((option) => {
          const active = value.status === option;
          const count = option !== "All" ? counts?.[option] : undefined;

          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...value, status: option })}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-violet-400/50 bg-violet-500/25 text-violet-100"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-violet-400/30"
              }`}
            >
              {option}
              {typeof count === "number" ? <span className="ml-1.5 text-slate-400">{count}</span> : null}
            </button>
          );
        })}

        {isDirty ? (
          <button
            type="button"
            onClick={() => {
              setDraft("");
              onChange(DEFAULT_FILTERS);
            }}
            className="px-2 text-xs font-semibold text-violet-300 hover:text-violet-100"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
