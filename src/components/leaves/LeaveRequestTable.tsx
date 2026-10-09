"use client";

import { useMemo, useState } from "react";

import { LeaveActionButtons } from "./LeaveActionButtons";
import { LeaveStatusBadge, LeaveTypeBadge } from "./LeaveStatusBadge";
import { formatRange, parseDate } from "./leaveCalculations";
import type { LeaveRequest, LeaveRole } from "./leaveTypes";

type SortKey = "employeeName" | "leaveType" | "startDate" | "days" | "status";
type SortDir = "asc" | "desc";

interface LeaveRequestTableProps {
  leaves: LeaveRequest[];
  role: LeaveRole;
  showReason?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  onUpdated?: (message: string, leaveId: string) => void;
  onError?: (message: string, leaveId: string) => void;
}

function compare(a: LeaveRequest, b: LeaveRequest, key: SortKey): number {
  if (key === "days") return a.days - b.days;
  if (key === "startDate") return (parseDate(a.startDate)?.getTime() ?? 0) - (parseDate(b.startDate)?.getTime() ?? 0);
  return a[key].localeCompare(b[key]);
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "employeeName", label: "Employee" },
  { key: "leaveType", label: "Type" },
  { key: "startDate", label: "Dates" },
  { key: "days", label: "Days" },
  { key: "status", label: "Status" }
];

export function LeaveRequestTable({
  leaves,
  role,
  showReason = true,
  emptyMessage = "No leave requests available yet.",
  pageSize = 10,
  onUpdated,
  onError
}: LeaveRequestTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const direction = sortDir === "asc" ? 1 : -1;
    return [...leaves].sort((a, b) => compare(a, b, sortKey) * direction);
  }, [leaves, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const rows = sorted.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const columnCount = COLUMNS.length + (showReason ? 1 : 0) + 1;

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.22em] text-slate-400">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key} className="px-5 py-4" aria-sort={column.key === sortKey ? (sortDir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => toggleSort(column.key)} className="uppercase tracking-[0.22em] hover:text-white">
                    {column.label}
                    {column.key === sortKey ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
              {showReason ? <th className="px-5 py-4">Reason</th> : null}
              <th className="px-5 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8 bg-slate-950/40 text-sm text-slate-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-5 py-14 text-center text-slate-400">{emptyMessage}</td>
              </tr>
            ) : (
              rows.map((leave) => (
                <tr key={leave._id} className="hover:bg-white/[0.03]">
                  <td className="px-5 py-4 font-medium text-white">{leave.employeeName}</td>
                  <td className="px-5 py-4"><LeaveTypeBadge type={leave.leaveType} /></td>
                  <td className="whitespace-nowrap px-5 py-4">{formatRange(leave.startDate, leave.endDate)}</td>
                  <td className="px-5 py-4">{leave.days}</td>
                  <td className="px-5 py-4"><LeaveStatusBadge status={leave.status} /></td>
                  {showReason ? <td className="max-w-[240px] truncate px-5 py-4 text-slate-300" title={leave.reason}>{leave.reason || "-"}</td> : null}
                  <td className="px-5 py-4">
                    <LeaveActionButtons leave={leave} role={role} onUpdated={onUpdated} onError={onError} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.02] px-5 py-3 text-xs text-slate-400">
          <span>Page {currentPage + 1} of {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40">Previous</button>
            <button type="button" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)} className="rounded-lg border border-white/10 px-3 py-1.5 disabled:opacity-40">Next</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default LeaveRequestTable;
