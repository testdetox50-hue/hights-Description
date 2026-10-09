"use client";

import { useMemo, useState } from "react";

import { isWeekend, parseDate, toDateKey } from "./leaveCalculations";
import type { LeaveRequest } from "./leaveTypes";

interface LeaveCalendarProps {
  leaves: LeaveRequest[];
  /** Only approved leave is drawn by default; set to include pending ones too. */
  includePending?: boolean;
  initialMonth?: Date;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Builds a map of yyyy-mm-dd to the leaves covering that day within the visible grid. */
export function buildLeaveDayMap(leaves: LeaveRequest[], gridStart: Date, gridEnd: Date, includePending: boolean) {
  const map = new Map<string, LeaveRequest[]>();
  for (const leave of leaves) {
    if (leave.status !== "Approved" && !(includePending && leave.status === "Pending")) continue;
    const start = parseDate(leave.startDate);
    const end = parseDate(leave.endDate);
    if (!start || !end) continue;

    const cursor = new Date(Math.max(start.getTime(), gridStart.getTime()));
    const last = Math.min(end.getTime(), gridEnd.getTime());
    while (cursor.getTime() <= last) {
      const key = toDateKey(cursor);
      map.set(key, [...(map.get(key) ?? []), leave]);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  return map;
}

export function LeaveCalendar({ leaves, includePending = false, initialMonth }: LeaveCalendarProps) {
  const [month, setMonth] = useState(() => {
    const base = initialMonth ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [selected, setSelected] = useState<string | null>(null);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
    for (let day = 1; day <= total; day += 1) cells.push(new Date(month.getFullYear(), month.getMonth(), day));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month]);

  const leaveMap = useMemo(() => {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    return buildLeaveDayMap(leaves, monthStart, monthEnd, includePending);
  }, [leaves, month, includePending]);

  const todayKey = toDateKey(new Date());
  const shift = (delta: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    setSelected(null);
  };
  const selectedLeaves = selected ? leaveMap.get(selected) ?? [] : [];

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => shift(-1)} aria-label="Previous month" className="rounded-xl border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/5">‹</button>
        <h3 className="text-lg font-semibold text-white">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
        <button type="button" onClick={() => shift(1)} aria-label="Next month" className="rounded-xl border border-white/10 px-3 py-2 text-slate-200 hover:bg-white/5">›</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.16em] text-slate-500">
        {WEEKDAYS.map((name) => <div key={name} className="py-2">{name}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} className="h-16" />;
          const key = toDateKey(date);
          const entries = leaveMap.get(key) ?? [];
          const tone = entries.length ? "border-violet-400/40 bg-violet-500/15" : "border-white/5 bg-slate-950/40";
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(selected === key ? null : key)}
              aria-pressed={selected === key}
              className={`flex h-16 flex-col items-start rounded-xl border p-2 text-left text-xs ${tone} ${isWeekend(date) ? "text-slate-500" : "text-slate-200"} ${key === todayKey ? "ring-1 ring-fuchsia-400/60" : ""}`}
            >
              <span>{date.getDate()}</span>
              {entries.length ? <span className="mt-auto rounded-full bg-violet-500/30 px-1.5 text-[10px] text-violet-100">{entries.length} off</span> : null}
            </button>
          );
        })}
      </div>
      {selected ? (
        <ul className="mt-4 grid gap-2 text-sm text-slate-300" aria-live="polite">
          {selectedLeaves.length === 0 ? <li className="text-slate-500">Nobody is on leave on {selected}.</li> : null}
          {selectedLeaves.map((leave) => (
            <li key={leave._id} className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
              <span className="font-medium text-white">{leave.employeeName}</span> - {leave.leaveType} leave
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default LeaveCalendar;
