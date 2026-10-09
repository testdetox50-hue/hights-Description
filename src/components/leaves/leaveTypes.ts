export const LEAVE_TYPES = ["Casual", "Sick", "Earned", "Unpaid"] as const;
export const LEAVE_STATUSES = ["Pending", "Approved", "Rejected", "Cancelled"] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];
export type LeaveRole = "admin" | "employee";

export interface LeaveRequest {
  _id: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  days: number;
  status: LeaveStatus;
}

export interface BalanceBucket {
  total: number;
  used: number;
  remaining: number;
}

export interface LeaveBalance {
  _id: string;
  employeeName: string;
  casual: BalanceBucket;
  sick: BalanceBucket;
  earned: BalanceBucket;
  unpaid: BalanceBucket;
}

export interface LeaveFilterState {
  search: string;
  status: LeaveStatus | "All";
  leaveType: LeaveType | "All";
  from: string;
  to: string;
}

export const DEFAULT_FILTERS: LeaveFilterState = {
  search: "",
  status: "All",
  leaveType: "All",
  from: "",
  to: ""
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  Casual: "Casual Leave",
  Sick: "Sick Leave",
  Earned: "Earned Leave",
  Unpaid: "Unpaid Leave"
};

type Raw = Record<string, unknown>;

function isRecord(value: unknown): value is Raw {
  return typeof value === "object" && value !== null;
}

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function isLeaveType(value: unknown): value is LeaveType {
  return typeof value === "string" && (LEAVE_TYPES as readonly string[]).includes(value);
}

export function isLeaveStatus(value: unknown): value is LeaveStatus {
  return typeof value === "string" && (LEAVE_STATUSES as readonly string[]).includes(value);
}

/** Converts any API row (camelCase or snake_case) into a safe LeaveRequest. */
export function normalizeLeave(row: unknown, index = 0): LeaveRequest {
  const raw: Raw = isRecord(row) ? row : {};
  const pick = (...keys: string[]): unknown => {
    for (const key of keys) {
      if (raw[key] !== undefined && raw[key] !== null && raw[key] !== "") return raw[key];
    }
    return undefined;
  };
  const type = pick("leaveType", "leave_type", "leavetype");
  const status = pick("status");

  return {
    _id: String(pick("_id", "id", "leave_id", "leaveid") ?? `leave-${index}`),
    employeeName: String(pick("employeeName", "employee_name", "employeename") ?? "Unknown"),
    leaveType: isLeaveType(type) ? type : "Casual",
    startDate: String(pick("startDate", "start_date", "startdate") ?? ""),
    endDate: String(pick("endDate", "end_date", "enddate") ?? ""),
    reason: String(pick("reason") ?? ""),
    days: asNumber(pick("days")),
    status: isLeaveStatus(status) ? status : "Pending"
  };
}

export function normalizeLeaves(payload: unknown): LeaveRequest[] {
  const items = isRecord(payload) && Array.isArray(payload.items) ? payload.items : [];
  return items.map((row, index) => normalizeLeave(row, index));
}

function normalizeBucket(value: unknown): BalanceBucket {
  const raw: Raw = isRecord(value) ? value : {};
  const total = asNumber(raw.total);
  const used = asNumber(raw.used);
  return { total, used, remaining: asNumber(raw.remaining, Math.max(total - used, 0)) };
}

export function normalizeBalance(row: unknown, index = 0): LeaveBalance {
  const raw: Raw = isRecord(row) ? row : {};
  return {
    _id: String(raw._id ?? raw.id ?? `balance-${index}`),
    employeeName: String(raw.employeeName ?? "Unknown"),
    casual: normalizeBucket(raw.casual),
    sick: normalizeBucket(raw.sick),
    earned: normalizeBucket(raw.earned),
    unpaid: normalizeBucket(raw.unpaid)
  };
}

export function normalizeBalances(payload: unknown): LeaveBalance[] {
  const items = isRecord(payload) && Array.isArray(payload.items) ? payload.items : [];
  return items.map((row, index) => normalizeBalance(row, index));
}
