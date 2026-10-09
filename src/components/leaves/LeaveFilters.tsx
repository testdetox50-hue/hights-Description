"use client";

import type { ChangeEvent } from "react";

import { isEndBeforeStart } from "./leaveCalculations";
import type { LeaveFilterState, LeaveStatus, LeaveType } from "./leaveTypes";
import { DEFAULT_FILTERS, LEAVE_STATUSES, LEAVE_TYPES, isLeaveStatus, isLeaveType } from "./leaveTypes";

interface LeaveFiltersProps {
  value: LeaveFilterState;
  onChange: (next: LeaveFilterState) => void;
  resultCount?: number;
}

const FIELD = "h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/40 focus:bg-white/[0.07]";
const LABEL = "mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400";

export function countActiveFilters(filters: LeaveFilterState): number {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.status !== "All") count += 1;
  if (filters.leaveType !== "All") count += 1;
  if (filters.from) count += 1;
  if (filters.to) count += 1;
  return count;
}

export function LeaveFilters({ value, onChange, resultCount }: LeaveFiltersProps) {
  const active = countActiveFilters(value);
  const rangeInvalid = isEndBeforeStart(value.from, value.to);

  const patch = (partial: Partial<LeaveFilterState>) => onChange({ ...value, ...partial });

  const handleStatus = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    patch({ status: isLeaveStatus(next) ? (next as LeaveStatus) : "All" });
  };

  const handleType = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    patch({ leaveType: isLeaveType(next) ? (next as LeaveType) : "All" });
  };

  return (
    <section aria-label="Leave filters" className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="block xl:col-span-2">
          <span className={LABEL}>Search</span>
          <input
            type="search"
            value={value.search}
            onChange={(event) => patch({ search: event.target.value })}
            placeholder="Employee or reason"
            className={FIELD}
          />
        </label>
        <label className="block">
          <span className={LABEL}>Status</span>
          <select value={value.status} onChange={handleStatus} className={FIELD}>
            <option className="bg-slate-950" value="All">All statuses</option>
            {LEAVE_STATUSES.map((status) => (
              <option key={status} className="bg-slate-950" value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={LABEL}>Type</span>
          <select value={value.leaveType} onChange={handleType} className={FIELD}>
            <option className="bg-slate-950" value="All">All types</option>
            {LEAVE_TYPES.map((type) => (
              <option key={type} className="bg-slate-950" value={type}>{type}</option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={LABEL}>From</span>
            <input type="date" value={value.from} onChange={(event) => patch({ from: event.target.value })} className={FIELD} />
          </label>
          <label className="block">
            <span className={LABEL}>To</span>
            <input type="date" value={value.to} min={value.from || undefined} onChange={(event) => patch({ to: event.target.value })} className={FIELD} />
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span role="status">
          {rangeInvalid ? <span className="text-rose-300">The end date is before the start date.</span> : null}
          {!rangeInvalid && resultCount !== undefined ? `${resultCount} request${resultCount === 1 ? "" : "s"} match` : null}
        </span>
        <button
          type="button"
          disabled={active === 0}
          onClick={() => onChange({ ...DEFAULT_FILTERS })}
          className="rounded-xl border border-white/10 px-3 py-2 font-semibold uppercase tracking-[0.16em] text-slate-200 hover:border-violet-400/30 hover:bg-violet-500/10 disabled:opacity-40"
        >
          Clear filters{active > 0 ? ` (${active})` : ""}
        </button>
      </div>
    </section>
  );
}

export default LeaveFilters;
