"use client";

import { useMemo } from "react";

import { parseDate } from "./leaveCalculations";
import type { LeaveRequest, LeaveStatus } from "./leaveTypes";

interface LeaveSummaryCardsProps {
  leaves: LeaveRequest[];
  /** Reference date for "on leave today"; defaults to now. */
  today?: Date;
}

interface SummaryStat {
  label: string;
  value: number;
  hint: string;
  tone: string;
}

function countByStatus(leaves: LeaveRequest[], status: LeaveStatus): number {
  return leaves.filter((leave) => leave.status === status).length;
}

export function summarizeLeaves(leaves: LeaveRequest[], today: Date = new Date()): SummaryStat[] {
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const approved = leaves.filter((leave) => leave.status === "Approved");

  const onLeaveToday = approved.filter((leave) => {
    const start = parseDate(leave.startDate);
    const end = parseDate(leave.endDate);
    return Boolean(start && end && start <= midnight && midnight <= end);
  }).length;

  const approvedDays = approved.reduce((sum, leave) => sum + leave.days, 0);

  return [
    { label: "Pending", value: countByStatus(leaves, "Pending"), hint: "Awaiting review", tone: "text-amber-300" },
    { label: "Approved", value: countByStatus(leaves, "Approved"), hint: `${approvedDays} days booked`, tone: "text-emerald-300" },
    { label: "Rejected", value: countByStatus(leaves, "Rejected"), hint: "Declined requests", tone: "text-rose-300" },
    { label: "On leave today", value: onLeaveToday, hint: "Approved and active", tone: "text-violet-200" }
  ];
}

export function LeaveSummaryCards({ leaves, today }: LeaveSummaryCardsProps) {
  const stats = useMemo(() => summarizeLeaves(leaves, today), [leaves, today]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">{stat.label}</p>
          <div className={`mt-3 text-4xl font-black tracking-tight ${stat.tone}`}>{stat.value}</div>
          <p className="mt-2 text-xs text-slate-500">{stat.hint}</p>
        </div>
      ))}
    </div>
  );
}

interface LeaveTypeBreakdownProps {
  leaves: LeaveRequest[];
}

/** Horizontal bars showing approved days per leave type. */
export function LeaveTypeBreakdown({ leaves }: LeaveTypeBreakdownProps) {
  const rows = useMemo(() => {
    const totals = new Map<string, number>();
    for (const leave of leaves) {
      if (leave.status !== "Approved") continue;
      totals.set(leave.leaveType, (totals.get(leave.leaveType) ?? 0) + leave.days);
    }
    const entries = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...entries.map(([, days]) => days));
    return entries.map(([type, days]) => ({ type, days, width: Math.round((days / max) * 100) }));
  }, [leaves]);

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No approved leave to break down yet.</p>;
  }

  return (
    <ul className="grid gap-3">
      {rows.map((row) => (
        <li key={row.type}>
          <div className="mb-1 flex justify-between text-xs text-slate-300">
            <span>{row.type}</span>
            <span>{row.days} days</span>
          </div>
          <div className="h-2 rounded-full bg-white/8">
            <div className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" style={{ width: `${row.width}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default LeaveSummaryCards;
