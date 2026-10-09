import { toDateKey } from "./attendanceTypes";
import type { AttendanceFilterState, AttendanceRecord, AttendanceStatus } from "./attendanceTypes";

export const LATE_AFTER_MINUTES = 9 * 60 + 30;

export type DailyHours = { dateKey: string; day: number; hours: number; status: AttendanceStatus };

export function minutesOfDay(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getHours() * 60 + date.getMinutes();
}

export function isLate(row: AttendanceRecord, threshold = LATE_AFTER_MINUTES): boolean {
  const minutes = minutesOfDay(row.checkInAt);
  return minutes !== null && minutes > threshold;
}

export function countLate(rows: AttendanceRecord[], threshold = LATE_AFTER_MINUTES): number {
  return rows.filter((row) => isLate(row, threshold)).length;
}

export function countByStatus(rows: AttendanceRecord[]): Record<AttendanceStatus, number> {
  const counts: Record<AttendanceStatus, number> = { Present: 0, "Half Day": 0, "In Progress": 0, Missed: 0 };
  rows.forEach((row) => {
    counts[row.status] += 1;
  });
  return counts;
}

// Share of finished days that counted as fully present (half days count 50%). Returns 0-100.
export function attendanceRate(rows: AttendanceRecord[]): number {
  const finished = rows.filter((row) => row.status !== "In Progress");
  if (finished.length === 0) {
    return 0;
  }
  const score = finished.reduce((sum, row) => sum + (row.status === "Present" ? 1 : row.status === "Half Day" ? 0.5 : 0), 0);
  return Math.round((score / finished.length) * 100);
}

// Average hours across days that actually logged time.
export function averageHours(rows: AttendanceRecord[]): number {
  const worked = rows.filter((row) => row.workedMinutes > 0);
  if (worked.length === 0) {
    return 0;
  }
  const total = worked.reduce((sum, row) => sum + row.workedMinutes, 0);
  return Math.round((total / worked.length / 60) * 10) / 10;
}

export function totalHours(rows: AttendanceRecord[]): number {
  return Math.round((rows.reduce((sum, row) => sum + row.workedMinutes, 0) / 60) * 10) / 10;
}

// Longest and current run of consecutive calendar days with a Present record.
export function presentStreaks(rows: AttendanceRecord[]): { current: number; longest: number } {
  const days = Array.from(new Set(rows.filter((row) => row.status === "Present").map((row) => toDateKey(row.workDate)))).sort();
  let longest = 0;
  let run = 0;
  let previous: Date | null = null;

  days.forEach((key) => {
    const [year, month, day] = key.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const gap = previous ? Math.round((date.getTime() - previous.getTime()) / 86400000) : 0;
    run = previous && gap === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = date;
  });

  return { current: run, longest };
}

// One entry per calendar day (latest record wins), ordered by date.
export function dailyHours(rows: AttendanceRecord[]): DailyHours[] {
  const byDay = new Map<string, DailyHours>();
  rows.forEach((row) => {
    const date = new Date(row.workDate);
    const key = toDateKey(date);
    const existing = byDay.get(key);
    const hours = Math.round((row.workedMinutes / 60) * 10) / 10;
    byDay.set(key, { dateKey: key, day: date.getDate(), hours: existing ? Math.max(existing.hours, hours) : hours, status: row.status });
  });
  return Array.from(byDay.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}

export function filterRecords(rows: AttendanceRecord[], filters: AttendanceFilterState): AttendanceRecord[] {
  const query = filters.query.trim().toLowerCase();
  return rows.filter((row) => {
    const statusOk = filters.status === "All" || row.status === filters.status;
    const queryOk = !query || row.employeeName.toLowerCase().includes(query) || row.employeeEmail.toLowerCase().includes(query);
    return statusOk && queryOk;
  });
}
