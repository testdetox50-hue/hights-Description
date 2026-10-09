"use client";

import { useMemo, useState } from "react";

import AttendanceStatusBadge from "./AttendanceStatusBadge";
import { formatHours, formatTime } from "./attendanceTypes";
import type { AttendanceRecord } from "./attendanceTypes";

type SortKey = "date" | "employee" | "hours";

type AttendanceTableProps = {
  rows: AttendanceRecord[];
  showEmployee?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  onDelete?: (id: string) => void;
};

const SORTERS: Record<SortKey, (a: AttendanceRecord, b: AttendanceRecord) => number> = {
  date: (a, b) => new Date(a.workDate).getTime() - new Date(b.workDate).getTime(),
  employee: (a, b) => a.employeeName.localeCompare(b.employeeName),
  hours: (a, b) => a.workedMinutes - b.workedMinutes
};

export default function AttendanceTable({ rows, showEmployee = false, pageSize = 15, emptyMessage = "No attendance records found.", onDelete }: AttendanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [descending, setDescending] = useState(true);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const copy = [...rows].sort(SORTERS[sortKey]);
    return descending ? copy.reverse() : copy;
  }, [rows, sortKey, descending]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);
  const columns = 5 + (showEmployee ? 1 : 0) + (onDelete ? 1 : 0);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDescending((value) => !value);
    } else {
      setSortKey(key);
      setDescending(key !== "employee");
    }
    setPage(0);
  };

  const sortHeader = (key: SortKey, label: string) => (
    <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 uppercase tracking-[0.22em] hover:text-violet-200">
      {label}
      {sortKey === key ? <span aria-hidden="true">{descending ? "v" : "^"}</span> : null}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left">
          <thead className="bg-white/[0.03] text-xs text-slate-400">
            <tr>
              {showEmployee ? <th className="px-5 py-4">{sortHeader("employee", "Employee")}</th> : null}
              <th className="px-5 py-4">{sortHeader("date", "Date")}</th>
              <th className="px-5 py-4 uppercase tracking-[0.22em]">Check-in</th>
              <th className="px-5 py-4 uppercase tracking-[0.22em]">Check-out</th>
              <th className="px-5 py-4">{sortHeader("hours", "Hours")}</th>
              <th className="px-5 py-4 uppercase tracking-[0.22em]">Status</th>
              {onDelete ? <th className="px-5 py-4 text-right uppercase tracking-[0.22em]">Action</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.08] bg-slate-950/40 text-sm text-slate-200">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns} className="px-5 py-14 text-center text-slate-400">{emptyMessage}</td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row._id} className="hover:bg-white/[0.03]">
                  {showEmployee ? (
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{row.employeeName}</div>
                      <div className="mt-1 text-sm text-slate-400">{row.employeeEmail}</div>
                    </td>
                  ) : null}
                  <td className="px-5 py-4">{new Date(row.workDate).toLocaleDateString()}</td>
                  <td className="px-5 py-4">{formatTime(row.checkInAt)}</td>
                  <td className="px-5 py-4">{formatTime(row.checkOutAt)}</td>
                  <td className="px-5 py-4">{formatHours(row.workedMinutes)}</td>
                  <td className="px-5 py-4"><AttendanceStatusBadge status={row.status} /></td>
                  {onDelete ? (
                    <td className="px-5 py-4 text-right">
                      <button type="button" onClick={() => onDelete(row._id)} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200 hover:bg-rose-500/20">
                        Delete
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-5 py-3 text-xs text-slate-400">
          <span>Page {safePage + 1} of {pageCount} ({sorted.length} records)</span>
          <div className="flex gap-2">
            <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
