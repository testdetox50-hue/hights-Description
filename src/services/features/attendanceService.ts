import { api } from "../api/client";
import { TtlCache, num, str, type RawRow } from "./employeesService";

export type AttendanceStatus = "Present" | "Half Day" | "In Progress" | string;

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

export type AttendanceSummary = {
  totalDays: number;
  presentDays: number;
  halfDays: number;
  inProgress: number;
};

export type TodayStatus = "not-checked-in" | "checked-in" | "checked-out";

export function normalizeAttendance(row: RawRow): AttendanceRecord {
  return {
    id: str(row, "_id", "id", "attendanceid", "attendance_id"),
    employeeId: str(row, "employeeId", "employeeid", "employee_id"),
    employeeName: str(row, "employeeName", "employeename", "employee_name"),
    employeeEmail: str(row, "employeeEmail", "employeeemail", "employee_email").toLowerCase(),
    workDate: str(row, "workDate", "workdate", "work_date").slice(0, 10),
    checkInAt: str(row, "checkInAt", "checkinat", "check_in_at") || null,
    checkOutAt: str(row, "checkOutAt", "checkoutat", "check_out_at") || null,
    workedMinutes: num(row, "workedMinutes", "workedminutes", "worked_minutes"),
    status: str(row, "status") || "In Progress"
  };
}

const cache = new TtlCache<AttendanceRecord[]>(10_000);

export function invalidateAttendance() {
  cache.clear();
}

export async function listAttendance(force = false): Promise<AttendanceRecord[]> {
  return cache.get(async () => {
    const res = await api<{ items?: RawRow[] }>("/attendance");
    return (res.items ?? []).map(normalizeAttendance);
  }, force);
}

/** Month is "YYYY-MM"; defaults to the current month. */
export async function getMonth(month = new Date().toISOString().slice(0, 7)): Promise<AttendanceRecord[]> {
  return (await listAttendance())
    .filter((r) => r.workDate.startsWith(month))
    .sort((a, b) => a.workDate.localeCompare(b.workDate));
}

export async function getTodayRecord(email: string): Promise<AttendanceRecord | undefined> {
  const today = new Date().toISOString().slice(0, 10);
  const wanted = email.trim().toLowerCase();
  return (await listAttendance(true)).find((r) => r.workDate === today && r.employeeEmail === wanted);
}

export async function getTodayStatus(email: string): Promise<TodayStatus> {
  const record = await getTodayRecord(email);
  if (!record || !record.checkInAt) {
    return "not-checked-in";
  }
  return record.checkOutAt ? "checked-out" : "checked-in";
}

export async function checkIn(): Promise<string> {
  const res = await api<{ message: string }>("/attendance/check-in", { method: "POST" });
  invalidateAttendance();
  return res.message;
}

export async function checkOut(): Promise<string> {
  const res = await api<{ message: string }>("/attendance/check-out", { method: "POST" });
  invalidateAttendance();
  return res.message;
}

export async function deleteAttendance(id: string): Promise<string> {
  const res = await api<{ message: string }>(`/attendance/${encodeURIComponent(id)}`, { method: "DELETE" });
  invalidateAttendance();
  return res.message;
}

export async function getSummary(): Promise<AttendanceSummary> {
  const res = await api<{ data?: Partial<AttendanceSummary> }>("/attendance/summary");
  const d = res.data ?? {};
  return {
    totalDays: d.totalDays ?? 0,
    presentDays: d.presentDays ?? 0,
    halfDays: d.halfDays ?? 0,
    inProgress: d.inProgress ?? 0
  };
}

export function summarizeRecords(records: AttendanceRecord[]) {
  const finished = records.filter((r) => r.status !== "In Progress");
  const totalMinutes = finished.reduce((sum, r) => sum + r.workedMinutes, 0);
  return {
    days: records.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
    averageHours: finished.length ? Math.round((totalMinutes / finished.length / 60) * 10) / 10 : 0
  };
}

export function formatMinutes(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}
