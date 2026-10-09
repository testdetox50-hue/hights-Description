export type AttendanceStatus = "Present" | "Half Day" | "In Progress" | "Absent";

export type AttendanceRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workedMinutes: number;
  status: AttendanceStatus;
};

export type AttendanceErrors = Partial<Record<keyof AttendanceRecord, string>>;

export const FULL_DAY_MINUTES = 480;

export const ATTENDANCE_STATUSES: readonly AttendanceStatus[] = ["Present", "Half Day", "In Progress", "Absent"];

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const num = (value: unknown, fallback = 0): number => (Number.isFinite(Number(value)) ? Number(value) : fallback);

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

const toIsoOrNull = (value: unknown): string | null => {
  const date = new Date(str(value) || NaN);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const isAttendanceStatus = (value: unknown): value is AttendanceStatus => (ATTENDANCE_STATUSES as readonly string[]).includes(value as string);

export function isAttendanceRecord(value: unknown): value is AttendanceRecord {
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.workDate === "string" &&
    typeof record.workedMinutes === "number" &&
    isAttendanceStatus(record.status)
  );
}

export function minutesBetween(startIso: string | null, endIso: string | null): number {
  if (!startIso || !endIso) {
    return 0;
  }
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Number.isFinite(diff) && diff > 0 ? Math.round(diff / 60000) : 0;
}

export function statusFromMinutes(workedMinutes: number): "Present" | "Half Day" {
  return workedMinutes >= FULL_DAY_MINUTES ? "Present" : "Half Day";
}

export function normalizeAttendance(raw: Record<string, unknown>): AttendanceRecord {
  const checkInAt = toIsoOrNull(firstDefined(raw, ["checkInAt", "checkinat", "check_in_at"]));
  const checkOutAt = toIsoOrNull(firstDefined(raw, ["checkOutAt", "checkoutat", "check_out_at"]));
  const stored = num(firstDefined(raw, ["workedMinutes", "workedminutes", "worked_minutes"]), -1);
  const workedMinutes = stored >= 0 ? stored : minutesBetween(checkInAt, checkOutAt);
  const rawStatus = str(raw.status);
  const fallbackStatus: AttendanceStatus = checkInAt && !checkOutAt ? "In Progress" : checkOutAt ? statusFromMinutes(workedMinutes) : "Absent";

  return {
    id: str(firstDefined(raw, ["_id", "id", "attendanceid", "attendance_id"])),
    employeeId: str(firstDefined(raw, ["employeeId", "employeeid", "employee_id"])),
    employeeName: str(firstDefined(raw, ["employeeName", "employeename", "employee_name"])),
    employeeEmail: str(firstDefined(raw, ["employeeEmail", "employeeemail", "employee_email"])).toLowerCase(),
    workDate: str(firstDefined(raw, ["workDate", "workdate", "work_date"])).slice(0, 10),
    checkInAt,
    checkOutAt,
    workedMinutes,
    status: isAttendanceStatus(rawStatus) ? rawStatus : fallbackStatus
  };
}

export function validateAttendanceInput(raw: Record<string, unknown>): AttendanceErrors {
  const record = normalizeAttendance(raw);
  const errors: AttendanceErrors = {};

  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.workDate)) {
    errors.workDate = "Work date must be in YYYY-MM-DD format.";
  }
  if (!record.employeeEmail && !record.employeeId) {
    errors.employeeEmail = "An employee email or id is required.";
  }
  if (record.checkOutAt && !record.checkInAt) {
    errors.checkInAt = "Check-out requires a check-in time.";
  } else if (record.checkInAt && record.checkOutAt && record.checkOutAt <= record.checkInAt) {
    errors.checkOutAt = "Check-out must be after check-in.";
  }
  if (record.workedMinutes < 0 || record.workedMinutes > 24 * 60) {
    errors.workedMinutes = "Worked minutes must be between 0 and 1440.";
  }
  return errors;
}

export function summarizeAttendance(records: AttendanceRecord[]) {
  const count = (status: AttendanceStatus) => records.filter((row) => row.status === status).length;
  const worked = records.reduce((total, row) => total + row.workedMinutes, 0);
  return {
    totalDays: records.length,
    presentDays: count("Present"),
    halfDays: count("Half Day"),
    inProgress: count("In Progress"),
    averageMinutes: records.length > 0 ? Math.round(worked / records.length) : 0
  };
}
