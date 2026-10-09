"use client";

import {
  EMPTY_FILTERS,
  type EmployeeFilterState,
  type ExperienceLevel,
  type SortKey
} from "./employeeTypes";

type EmployeeFiltersProps = {
  filters: EmployeeFilterState;
  roles: string[];
  sortKey: SortKey;
  resultCount: number;
  totalCount: number;
  onFiltersChange: (next: EmployeeFilterState) => void;
  onSortChange: (key: SortKey) => void;
};

const EXPERIENCE_OPTIONS: Array<ExperienceLevel | "All"> = ["All", "Fresher", "Experienced"];

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "name", label: "Name (A-Z)" },
  { value: "role", label: "Role" },
  { value: "joining", label: "Newest joiners" }
];

const controlClass =
  "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/60 focus:bg-white/[0.07]";

export function EmployeeFilters({
  filters,
  roles,
  sortKey,
  resultCount,
  totalCount,
  onFiltersChange,
  onSortChange
}: EmployeeFiltersProps) {
  const isDirty = filters.search !== "" || filters.role !== "All" || filters.experience !== "All";

  const update = (patch: Partial<EmployeeFilterState>) => onFiltersChange({ ...filters, ...patch });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block xl:col-span-1">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Search</span>
          <input
            type="search"
            value={filters.search}
            onChange={(event) => update({ search: event.target.value })}
            placeholder="Name, email, role or phone"
            className={controlClass}
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Role</span>
          <select value={filters.role} onChange={(event) => update({ role: event.target.value })} className={controlClass}>
            <option value="All" className="bg-slate-900">
              All roles
            </option>
            {roles.map((role) => (
              <option key={role} value={role} className="bg-slate-900">
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Experience</span>
          <select
            value={filters.experience}
            onChange={(event) => update({ experience: event.target.value as ExperienceLevel | "All" })}
            className={controlClass}
          >
            {EXPERIENCE_OPTIONS.map((option) => (
              <option key={option} value={option} className="bg-slate-900">
                {option === "All" ? "All levels" : option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Sort by</span>
          <select value={sortKey} onChange={(event) => onSortChange(event.target.value as SortKey)} className={controlClass}>
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-slate-900">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Showing <span className="font-semibold text-white">{resultCount}</span> of {totalCount} employees
        </span>
        {isDirty ? (
          <button type="button" onClick={() => onFiltersChange(EMPTY_FILTERS)} className="font-semibold text-violet-300 hover:text-violet-200">
            Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
