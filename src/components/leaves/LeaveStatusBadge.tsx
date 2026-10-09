import type { LeaveStatus, LeaveType } from "./leaveTypes";

interface StatusStyle {
  badge: string;
  dot: string;
  description: string;
}

export const STATUS_STYLES: Record<LeaveStatus, StatusStyle> = {
  Pending: {
    badge: "border-amber-400/25 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-300",
    description: "Waiting for a manager decision"
  },
  Approved: {
    badge: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-300",
    description: "Approved and deducted from balance"
  },
  Rejected: {
    badge: "border-rose-400/25 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-300",
    description: "Declined by a manager"
  },
  Cancelled: {
    badge: "border-white/10 bg-white/5 text-slate-300",
    dot: "bg-slate-400",
    description: "Withdrawn by the requester"
  }
};

export const TYPE_STYLES: Record<LeaveType, string> = {
  Casual: "border-violet-400/25 bg-violet-500/10 text-violet-200",
  Sick: "border-rose-400/25 bg-rose-500/10 text-rose-200",
  Earned: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  Unpaid: "border-slate-400/25 bg-slate-500/10 text-slate-300"
};

interface LeaveStatusBadgeProps {
  status: LeaveStatus;
  showDot?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function LeaveStatusBadge({ status, showDot = true, size = "md", className = "" }: LeaveStatusBadgeProps) {
  const style = STATUS_STYLES[status];
  const sizing = size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs";

  return (
    <span
      title={style.description}
      className={`inline-flex items-center gap-2 rounded-full border font-semibold uppercase tracking-[0.18em] ${sizing} ${style.badge} ${className}`}
    >
      {showDot ? <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${style.dot}`} /> : null}
      {status}
    </span>
  );
}

interface LeaveTypeBadgeProps {
  type: LeaveType;
  className?: string;
}

export function LeaveTypeBadge({ type, className = "" }: LeaveTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${TYPE_STYLES[type]} ${className}`}
    >
      {type}
    </span>
  );
}

interface LeaveStatusLegendProps {
  statuses?: LeaveStatus[];
}

/** Compact legend used beside calendars and charts. */
export function LeaveStatusLegend({ statuses = ["Pending", "Approved", "Rejected", "Cancelled"] }: LeaveStatusLegendProps) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400" aria-label="Leave status legend">
      {statuses.map((status) => (
        <li key={status} className="flex items-center gap-2">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`} />
          {status}
        </li>
      ))}
    </ul>
  );
}

export default LeaveStatusBadge;
