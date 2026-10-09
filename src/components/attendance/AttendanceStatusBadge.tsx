import { STATUS_STYLES } from "./attendanceTypes";
import type { AttendanceStatus } from "./attendanceTypes";

type AttendanceStatusBadgeProps = {
  status: AttendanceStatus;
  size?: "sm" | "md";
  showDot?: boolean;
  className?: string;
};

const DOT_COLORS: Record<AttendanceStatus, string> = {
  Present: "bg-emerald-400",
  "Half Day": "bg-amber-400",
  "In Progress": "bg-sky-400 animate-pulse",
  Missed: "bg-rose-400"
};

const SIZE_CLASSES = {
  sm: "px-2.5 py-0.5 text-[10px] tracking-[0.16em]",
  md: "px-3 py-1 text-xs tracking-[0.2em]"
} as const;

export default function AttendanceStatusBadge({ status, size = "md", showDot = false, className = "" }: AttendanceStatusBadgeProps) {
  const styles = STATUS_STYLES[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold uppercase ${SIZE_CLASSES[size]} ${styles.badge} ${className}`.trim()}
      data-status={status}
    >
      {showDot ? <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[status]}`} /> : null}
      {status}
    </span>
  );
}

type AttendanceStatusLegendProps = {
  statuses?: AttendanceStatus[];
  counts?: Partial<Record<AttendanceStatus, number>>;
};

const ALL_STATUSES: AttendanceStatus[] = ["Present", "Half Day", "In Progress", "Missed"];

// Compact legend: a row of small badges, optionally with per-status counts.
export function AttendanceStatusLegend({ statuses = ALL_STATUSES, counts }: AttendanceStatusLegendProps) {
  return (
    <ul className="flex flex-wrap items-center gap-2" aria-label="Attendance status legend">
      {statuses.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <AttendanceStatusBadge status={status} size="sm" showDot />
          {counts && typeof counts[status] === "number" ? (
            <span className="text-xs font-medium text-slate-400">{counts[status]}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
