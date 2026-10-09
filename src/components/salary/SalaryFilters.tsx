"use client";

import { useMemo } from "react";

import { uniqueEmployees, uniqueMonths } from "./salaryCalculations";
import { EMPTY_FILTERS, type SalaryFilterState, type SalarySlip } from "./salaryTypes";

type SalaryFiltersProps = {
  rows: SalarySlip[];
  value: SalaryFilterState;
  onChange: (next: SalaryFilterState) => void;
  showEmployeeFilter?: boolean;
  resultCount?: number;
};

const controlClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30";

export function SalaryFilters({ rows, value, onChange, showEmployeeFilter = true, resultCount }: SalaryFiltersProps) {
  const months = useMemo(() => uniqueMonths(rows), [rows]);
  const employees = useMemo(() => uniqueEmployees(rows), [rows]);
  const isDirty = value.month !== EMPTY_FILTERS.month || value.employee !== EMPTY_FILTERS.employee || value.search !== "";

  const patch = (partial: Partial<SalaryFilterState>) => onChange({ ...value, ...partial });

  return (
    <section aria-label="Salary filters" className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className={`grid gap-4 ${showEmployeeFilter ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Search
          <input
            type="search"
            value={value.search}
            onChange={(event) => patch({ search: event.target.value })}
            placeholder="Name, email or month"
            className={`${controlClass} mt-2 normal-case tracking-normal`}
          />
        </label>

        <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Month
          <select value={value.month} onChange={(event) => patch({ month: event.target.value })} className={`${controlClass} mt-2 normal-case tracking-normal`}>
            <option value="all">All months</option>
            {months.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </label>

        {showEmployeeFilter ? (
          <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Employee
            <select value={value.employee} onChange={(event) => patch({ employee: event.target.value })} className={`${controlClass} mt-2 normal-case tracking-normal`}>
              <option value="all">All employees</option>
              {employees.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{typeof resultCount === "number" ? `${resultCount} of ${rows.length} slips shown` : `${rows.length} slips`}</span>
        <button
          type="button"
          disabled={!isDirty}
          onClick={() => onChange(EMPTY_FILTERS)}
          className="rounded-xl border border-white/10 px-3 py-1 font-semibold text-violet-200 hover:bg-white/10 disabled:opacity-40"
        >
          Reset filters
        </button>
      </div>
    </section>
  );
}
