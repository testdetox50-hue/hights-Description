import { useMemo } from "react";

import { dailyHours } from "./attendanceStats";
import { STATUS_STYLES } from "./attendanceTypes";
import type { AttendanceRecord } from "./attendanceTypes";

type AttendanceTrendBarsProps = {
  rows: AttendanceRecord[];
  // Hours that count as a full working day; drawn as a dashed target line.
  targetHours?: number;
  height?: number;
  title?: string;
};

export default function AttendanceTrendBars({ rows, targetHours = 8, height = 160, title = "Daily hours" }: AttendanceTrendBarsProps) {
  const days = useMemo(() => dailyHours(rows), [rows]);
  const maxHours = Math.max(targetHours, ...days.map((day) => day.hours), 1);
  const targetOffset = (targetHours / maxHours) * 100;
  const average = days.length ? days.reduce((sum, day) => sum + day.hours, 0) / days.length : 0;

  if (days.length === 0) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-400">
        No hours to chart for this period.
      </div>
    );
  }

  return (
    <figure className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <figcaption className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">{title}</span>
        <span className="text-xs text-slate-400">avg {average.toFixed(1)}h / target {targetHours}h</span>
      </figcaption>

      <div className="relative mt-4" style={{ height }} role="img" aria-label={`${title} bar chart with ${days.length} days`}>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 border-t border-dashed border-violet-300/40"
          style={{ bottom: `${targetOffset}%` }}
        />
        <div className="absolute inset-0 flex items-end gap-1">
          {days.map((day) => {
            const barHeight = day.hours > 0 ? Math.max(3, (day.hours / maxHours) * 100) : 0;

            return (
              <div key={day.dateKey} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${day.dateKey}: ${day.hours}h (${day.status})`}>
                <div
                  className={`w-full rounded-t-md opacity-80 transition group-hover:opacity-100 ${STATUS_STYLES[day.status].bar}`}
                  style={{ height: `${barHeight}%` }}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex gap-1 text-[10px] text-slate-500">
        {days.map((day) => (
          <span key={day.dateKey} className="min-w-0 flex-1 text-center">
            {days.length <= 16 || day.day % 5 === 0 ? day.day : ""}
          </span>
        ))}
      </div>
    </figure>
  );
}
