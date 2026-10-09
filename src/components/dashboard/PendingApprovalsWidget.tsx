"use client";

import Link from "next/link";
import { useState } from "react";

export interface PendingLeave {
  _id: string;
  employeeName: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface PendingApprovalsWidgetProps {
  leaves: PendingLeave[];
  /** Admin-only decision handlers. May be async; rejections are surfaced inline. */
  onApprove?: (id: string) => void | Promise<void>;
  onReject?: (id: string) => void | Promise<void>;
  limit?: number;
  reviewHref?: string;
}

export function leaveDays(start: string, end: string): number {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return 1;
  return Math.round((e - s) / 86_400_000) + 1;
}

function formatRange(start: string, end: string): string {
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime())) return "Dates unavailable";
  const from = s.toLocaleDateString(undefined, opts);
  return Number.isNaN(e.getTime()) || s.toDateString() === e.toDateString() ? from : `${from} - ${e.toLocaleDateString(undefined, opts)}`;
}

export function PendingApprovalsWidget({ leaves, onApprove, onReject, limit = 4, reviewHref = "/leaves/apply" }: PendingApprovalsWidgetProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canDecide = Boolean(onApprove && onReject);
  const visible = leaves.slice(0, limit);

  const decide = async (id: string, handler?: (id: string) => void | Promise<void>) => {
    if (!handler) return;
    setBusyId(id);
    setError(null);
    try {
      await handler(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this request.");
    } finally {
      setBusyId(null);
    }
  };

  if (leaves.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">All caught up. No requests are waiting.</p>;
  }

  return (
    <div>
      {error ? <p role="alert" className="mb-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
      <ul className="space-y-3" aria-label="Pending leave requests">
        {visible.map((leave) => {
          const days = leaveDays(leave.startDate, leave.endDate);
          const busy = busyId === leave._id;
          return (
            <li key={leave._id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4" aria-busy={busy}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{leave.employeeName}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {formatRange(leave.startDate, leave.endDate)} &middot; {days} {days === 1 ? "day" : "days"}
                    {leave.leaveType ? ` · ${leave.leaveType}` : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">Pending</span>
              </div>
              {leave.reason ? <p className="mt-2 line-clamp-2 text-sm text-slate-300">{leave.reason}</p> : null}
              {canDecide ? (
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={busy} onClick={() => void decide(leave._id, onApprove)} aria-label={`Approve leave for ${leave.employeeName}`} className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50">Approve</button>
                  <button type="button" disabled={busy} onClick={() => void decide(leave._id, onReject)} aria-label={`Reject leave for ${leave.employeeName}`} className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-rose-200 hover:bg-rose-500/20 disabled:opacity-50">Reject</button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <Link href={reviewHref} className="mt-4 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200">
        {leaves.length > limit ? `View all ${leaves.length} requests` : "Open leave center"}
      </Link>
    </div>
  );
}

export default PendingApprovalsWidget;
