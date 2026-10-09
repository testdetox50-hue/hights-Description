import type { MonthAttendanceRow } from "@/src/utils/attendanceMonth";

export type AttendanceStatus = MonthAttendanceRow["status"];

export type AttendanceRecord = {
  _id: string;
  employeeName: string;
  employeeEmail: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workedMinutes: number;
  status: AttendanceStatus;
};

export type AttendanceFilterState = {
  query: string;
  status: AttendanceStatus | "All";
};

export const ATTENDANCE_STATUSES: AttendanceStatus[] = ["Present", "Half Day", "In Progress", "Missed"];

export const DEFAULT_FILTERS: AttendanceFilterState = { query: "", status: "All" };

// Tailwind classes shared by the badge, calendar cells and legend.
export const STATUS_STYLES: Record<AttendanceStatus, { badge: string; cell: string; bar: string }> = {
  Present: {
    badge: "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    cell: "border-emerald-400/30 bg-emerald-500/20 text-emerald-100",
    bar: "bg-emerald-400"
  },
  "Half Day": {
    badge: "border border-amber-400/20 bg-amber-500/10 text-amber-200",
    cell: "border-amber-400/30 bg-amber-500/20 text-amber-100",
    bar: "bg-amber-400"
  },
  "In Progress": {
    badge: "border border-sky-400/20 bg-sky-500/10 text-sky-200",
    cell: "border-sky-400/30 bg-sky-500/20 text-sky-100",
    bar: "bg-sky-400"
  },
  Missed: {
    badge: "border border-rose-400/20 bg-rose-500/10 text-rose-200",
    cell: "border-rose-400/30 bg-rose-500/20 text-rose-100",
    bar: "bg-rose-400"
  }
};

function isStatus(value: unknown): value is AttendanceStatus {
  return typeof value === "string" && (ATTENDANCE_STATUSES as string[]).includes(value);
}

function asIsoOrNull(value: unknown): string | null {
  if (typeof value !== "string" || !value) {
    return null;
  }
  return Number.isNaN(new Date(value).getTime()) ? null : value;
}

// Turns an unknown API row into a safe AttendanceRecord; returns null if it has no usable date.
export function normalizeAttendanceRow(raw: unknown, index = 0): AttendanceRecord | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const row = raw as Record<string, unknown>;
  const workDate = asIsoOrNull(row.workDate);
  if (!workDate) {
    return null;
  }

  const minutes = Number(row.workedMinutes);
  return {
    _id: String(row._id ?? row.id ?? `${row.employeeEmail ?? "row"}-${workDate}-${index}`),
    employeeName: String(row.employeeName ?? "Unknown"),
    employeeEmail: String(row.employeeEmail ?? ""),
    workDate,
    checkInAt: asIsoOrNull(row.checkInAt),
    checkOutAt: asIsoOrNull(row.checkOutAt),
    workedMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : 0,
    status: isStatus(row.status) ? row.status : "Missed"
  };
}

export function normalizeAttendanceRows(raw: unknown): AttendanceRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.map((item, index) => normalizeAttendanceRow(item, index)).filter((row): row is AttendanceRecord => row !== null);
}

// Local-time YYYY-MM-DD key used to group records by calendar day.
export function toDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function formatTime(value: string | null): string {
  return value ? new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--";
}

export function formatHours(minutes: number): string {
  return `${(minutes / 60).toFixed(1)} hrs`;
}
