import { useMemo } from "react";

import { LATE_AFTER_MINUTES, minutesOfDay } from "./attendanceStats";
import { formatTime } from "./attendanceTypes";
import type { AttendanceRecord } from "./attendanceTypes";

type LateArrivalsListProps = {
  rows: AttendanceRecord[];
  limit?: number;
  threshold?: number;
};

type LateEntry = {
  record: AttendanceRecord;
  minutesLate: number;
};

type LateOffender = {
  email: string;
  name: string;
  count: number;
};

function describeLateness(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min late`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m late` : `${hours}h late`;
}

function formatThreshold(minutes: number) {
  const date = new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function LateArrivalsList({ rows, limit = 8, threshold = LATE_AFTER_MINUTES }: LateArrivalsListProps) {
  const { entries, offenders } = useMemo(() => {
    const late: LateEntry[] = [];
    rows.forEach((record) => {
      const arrival = minutesOfDay(record.checkInAt);
      if (arrival !== null && arrival > threshold) {
        late.push({ record, minutesLate: arrival - threshold });
      }
    });

    const tally = new Map<string, LateOffender>();
    late.forEach(({ record }) => {
      const key = record.employeeEmail || record.employeeName;
      const current = tally.get(key) ?? { email: record.employeeEmail, name: record.employeeName, count: 0 };
      tally.set(key, { ...current, count: current.count + 1 });
    });

    return {
      entries: late.sort((a, b) => b.minutesLate - a.minutesLate),
      offenders: Array.from(tally.values()).sort((a, b) => b.count - a.count).slice(0, 3)
    };
  }, [rows, threshold]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">Late arrivals</h3>
        <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-200">
          {entries.length} after {formatThreshold(threshold)}
        </span>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">Everyone checked in on time.</p>
      ) : (
        <>
          {offenders.length > 0 && offenders[0].count > 1 ? (
            <p className="mt-3 text-xs text-slate-400">
              Most frequent: {offenders.map((item) => `${item.name} (${item.count})`).join(", ")}
            </p>
          ) : null}
          <ul className="mt-4 divide-y divide-white/[0.08]">
            {entries.slice(0, limit).map(({ record, minutesLate }) => (
              <li key={record._id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium text-white">{record.employeeName}</div>
                  <div className="text-xs text-slate-400">{new Date(record.workDate).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-amber-200">{formatTime(record.checkInAt)}</div>
                  <div className="text-xs text-slate-400">{describeLateness(minutesLate)}</div>
                </div>
              </li>
            ))}
          </ul>
          {entries.length > limit ? <p className="mt-2 text-xs text-slate-500">+{entries.length - limit} more not shown</p> : null}
        </>
      )}
    </section>
  );
}
