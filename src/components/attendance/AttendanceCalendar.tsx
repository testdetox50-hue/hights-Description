"use client";

import { useMemo } from "react";

import { STATUS_STYLES, toDateKey } from "./attendanceTypes";
import type { AttendanceRecord, AttendanceStatus } from "./attendanceTypes";

type AttendanceCalendarProps = {
  rows: AttendanceRecord[];
  // Month in <input type="month"> format, e.g. "2026-10".
  month: string;
  onSelectDate?: (dateKey: string, records: AttendanceRecord[]) => void;
  selectedDate?: string | null;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// When several employees have a record on the same day, show the "worst" visible status.
const STATUS_PRIORITY: AttendanceStatus[] = ["Missed", "Half Day", "In Progress", "Present"];

function dominantStatus(records: AttendanceRecord[]): AttendanceStatus | null {
  for (const status of STATUS_PRIORITY) {
    if (records.some((record) => record.status === status)) {
      return status;
    }
  }
  return null;
}

export default function AttendanceCalendar({ rows, month, onSelectDate, selectedDate = null }: AttendanceCalendarProps) {
  const { cells, byDay } = useMemo(() => {
    const [year, monthNumber] = month.split("-").map(Number);
    const first = new Date(year, monthNumber - 1, 1);
    const daysInMonth = new Date(year, monthNumber, 0).getDate();
    const grouped = new Map<string, AttendanceRecord[]>();

    rows.forEach((row) => {
      const key = toDateKey(row.workDate);
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    });

    const blanks: (Date | null)[] = Array.from({ length: first.getDay() }, () => null);
    const days = Array.from({ length: daysInMonth }, (_, index) => new Date(year, monthNumber - 1, index + 1));
    return { cells: [...blanks, ...days], byDay: grouped };
  }, [rows, month]);

  const todayKey = toDateKey(new Date());

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {WEEKDAYS.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-7 gap-2">
        {cells.map((date, index) => {
          if (!date) {
            return <div key={`blank-${index}`} aria-hidden="true" />;
          }

          const key = toDateKey(date);
          const records = byDay.get(key) ?? [];
          const status = dominantStatus(records);
          const isSelected = selectedDate === key;
          const tone = status ? STATUS_STYLES[status].cell : "border-white/5 bg-white/[0.02] text-slate-500";

          return (
            <button
              key={key}
              type="button"
              disabled={!onSelectDate}
              onClick={() => onSelectDate?.(key, records)}
              title={status ? `${status} - ${records.length} record${records.length === 1 ? "" : "s"}` : "No records"}
              aria-pressed={isSelected}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-semibold transition ${tone} ${
                isSelected ? "ring-2 ring-violet-400" : ""
              } ${key === todayKey ? "outline outline-1 outline-violet-300/60" : ""} ${onSelectDate ? "hover:brightness-125" : "cursor-default"}`}
            >
              {date.getDate()}
              {records.length > 1 ? <span className="text-[10px] font-medium opacity-70">x{records.length}</span> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
