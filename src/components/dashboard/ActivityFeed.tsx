export type ActivityKind = "employee" | "leave" | "attendance" | "salary" | "project";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  description?: string;
  /** ISO date string or timestamp. */
  timestamp: string | number | Date;
}

export interface ActivityFeedProps {
  items: ActivityItem[];
  /** Maximum rows to render. */
  limit?: number;
  /** Reference time, mainly useful for tests. Defaults to now. */
  now?: Date;
  emptyMessage?: string;
}

const kindStyles: Record<ActivityKind, { dot: string; label: string }> = {
  employee: { dot: "bg-violet-400", label: "Employee" },
  leave: { dot: "bg-amber-400", label: "Leave" },
  attendance: { dot: "bg-sky-400", label: "Attendance" },
  salary: { dot: "bg-emerald-400", label: "Salary" },
  project: { dot: "bg-fuchsia-400", label: "Project" }
};

/** Returns a short relative time such as "5m ago", "3h ago" or a locale date for older items. */
export function timeAgo(input: string | number | Date, now: Date = new Date()): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "Unknown time";

  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 0) return "Upcoming";
  if (seconds < 45) return "Just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

/** Counts items per kind, handy for rendering filter chips above the feed. */
export function countByKind(items: ActivityItem[]): Record<ActivityKind, number> {
  const counts: Record<ActivityKind, number> = { employee: 0, leave: 0, attendance: 0, salary: 0, project: 0 };
  for (const item of items) counts[item.kind] += 1;
  return counts;
}

/** Buckets a timestamp into "Today", "Yesterday" or "Earlier". */
export function dayBucket(input: string | number | Date, now: Date = new Date()): "Today" | "Yesterday" | "Earlier" {
  const date = new Date(input);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (date.getTime() >= startOfToday) return "Today";
  if (date.getTime() >= startOfToday - 86_400_000) return "Yesterday";
  return "Earlier";
}

export function ActivityFeed({ items, limit = 8, now, emptyMessage = "No recent activity." }: ActivityFeedProps) {
  const reference = now ?? new Date();
  const sorted = [...items]
    .filter((item) => !Number.isNaN(new Date(item.timestamp).getTime()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);

  if (sorted.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">{emptyMessage}</p>;
  }

  return (
    <ol className="relative space-y-1" aria-label="Recent activity">
      <span className="absolute bottom-3 left-[7px] top-3 w-px bg-white/10" aria-hidden="true" />
      {sorted.map((item) => {
        const style = kindStyles[item.kind];
        const date = new Date(item.timestamp);
        return (
          <li key={item.id} className="relative flex gap-4 rounded-2xl px-1 py-3 hover:bg-white/[0.03]">
            <span className={`relative z-10 mt-1.5 h-[15px] w-[15px] shrink-0 rounded-full ring-4 ring-slate-950 ${style.dot}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="truncate text-sm font-semibold text-white">{item.title}</p>
                <time dateTime={date.toISOString()} title={date.toLocaleString()} className="shrink-0 text-xs text-slate-500">
                  {timeAgo(date, reference)}
                </time>
              </div>
              {item.description ? <p className="mt-0.5 line-clamp-2 text-sm text-slate-400">{item.description}</p> : null}
              <span className="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{style.label}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default ActivityFeed;
