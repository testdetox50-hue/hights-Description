import { api } from "../api/client";
import { TtlCache, num, str, type RawRow } from "./employeesService";

export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";
export type LeaveType = "Casual" | "Sick" | "Earned" | "Unpaid";

export type Leave = {
  id: string;
  employeeName: string;
  leaveType: LeaveType | string;
  startDate: string;
  endDate: string;
  reason: string;
  days: number;
  status: LeaveStatus | string;
};

export type LeaveBucket = { total: number; used: number; remaining: number };

export type LeaveBalance = {
  id: string;
  employeeName: string;
  casual: LeaveBucket;
  sick: LeaveBucket;
  earned: LeaveBucket;
  unpaid: LeaveBucket;
};

export type ApplyLeaveInput = {
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
};

export function normalizeLeave(row: RawRow): Leave {
  return {
    id: str(row, "_id", "id", "leaveid", "leave_id"),
    employeeName: str(row, "employeeName", "employeename", "employee_name"),
    leaveType: str(row, "leaveType", "leavetype", "leave_type") || "Casual",
    startDate: str(row, "startDate", "startdate", "start_date"),
    endDate: str(row, "endDate", "enddate", "end_date"),
    reason: str(row, "reason"),
    days: num(row, "days"),
    status: str(row, "status") || "Pending"
  };
}

function normalizeBucket(value: unknown): LeaveBucket {
  const raw = (value ?? {}) as RawRow;
  return { total: num(raw, "total"), used: num(raw, "used"), remaining: num(raw, "remaining") };
}

const cache = new TtlCache<Leave[]>(15_000);

export function invalidateLeaves() {
  cache.clear();
}

export async function listLeaves(force = false): Promise<Leave[]> {
  return cache.get(async () => {
    const res = await api<{ items?: RawRow[] }>("/leaves");
    return (res.items ?? []).map(normalizeLeave);
  }, force);
}

/** Pending queue, oldest start date first so the most urgent requests surface at the top. */
export async function getPendingQueue(): Promise<Leave[]> {
  return (await listLeaves())
    .filter((l) => l.status === "Pending")
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function listLeavesForEmployee(name: string): Promise<Leave[]> {
  const wanted = name.trim().toLowerCase();
  return (await listLeaves()).filter((l) => l.employeeName.toLowerCase() === wanted);
}

export async function applyLeave(input: ApplyLeaveInput): Promise<string> {
  if (new Date(input.endDate).getTime() < new Date(input.startDate).getTime()) {
    throw new Error("End date cannot be before start date");
  }
  const res = await api<{ message: string }>("/leaves/apply", { method: "POST", body: JSON.stringify(input) });
  invalidateLeaves();
  return res.message;
}

export async function setLeaveStatus(id: string, status: LeaveStatus): Promise<string> {
  const res = await api<{ message: string }>(`/leaves/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  invalidateLeaves();
  return res.message;
}

export const approveLeave = (id: string) => setLeaveStatus(id, "Approved");
export const rejectLeave = (id: string) => setLeaveStatus(id, "Rejected");

export async function listBalances(): Promise<LeaveBalance[]> {
  const res = await api<{ items?: RawRow[] }>("/leaves/balances");
  return (res.items ?? []).map((row) => ({
    id: str(row, "_id", "id"),
    employeeName: str(row, "employeeName", "employee_name"),
    casual: normalizeBucket(row.casual),
    sick: normalizeBucket(row.sick),
    earned: normalizeBucket(row.earned),
    unpaid: normalizeBucket(row.unpaid)
  }));
}

export async function getBalanceFor(name: string): Promise<LeaveBalance | undefined> {
  const wanted = name.trim().toLowerCase();
  return (await listBalances()).find((b) => b.employeeName.toLowerCase() === wanted);
}

export async function approvedDaysByType(): Promise<Record<string, number>> {
  const totals: Record<string, number> = {};
  for (const leave of await listLeaves()) {
    if (leave.status === "Approved") {
      totals[leave.leaveType] = (totals[leave.leaveType] ?? 0) + leave.days;
    }
  }
  return totals;
}
