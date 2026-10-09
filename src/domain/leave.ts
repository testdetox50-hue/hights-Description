export type LeaveType = "Casual" | "Sick" | "Earned" | "Unpaid";
export type LeaveStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export type Leave = {
  id: string;
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  days: number;
  status: LeaveStatus;
};

export type LeaveErrors = Partial<Record<keyof Leave, string>>;

export type LeaveBalance = { total: number; used: number; remaining: number };

export const LEAVE_TYPES: readonly LeaveType[] = ["Casual", "Sick", "Earned", "Unpaid"];
export const LEAVE_STATUSES: readonly LeaveStatus[] = ["Pending", "Approved", "Rejected", "Cancelled"];
export const LEAVE_ALLOWANCE: Record<LeaveType, number> = { Casual: 12, Sick: 12, Earned: 12, Unpaid: 0 };

const DAY_MS = 24 * 60 * 60 * 1000;

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const num = (value: unknown, fallback = 0): number => (Number.isFinite(Number(value)) ? Number(value) : fallback);

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

const toDateOnly = (value: unknown): string => {
  const date = new Date(str(value) || NaN);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export const isLeaveType = (value: unknown): value is LeaveType => (LEAVE_TYPES as readonly string[]).includes(value as string);

export const isLeaveStatus = (value: unknown): value is LeaveStatus => (LEAVE_STATUSES as readonly string[]).includes(value as string);

export function isLeave(value: unknown): value is Leave {
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.startDate === "string" &&
    typeof record.endDate === "string" &&
    typeof record.days === "number" &&
    isLeaveType(record.leaveType) &&
    isLeaveStatus(record.status)
  );
}

export function countLeaveDays(startDate: string, endDate: string): number {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    return 0;
  }
  return Math.floor((end - start) / DAY_MS) + 1;
}

export function normalizeLeave(raw: Record<string, unknown>): Leave {
  const type = str(firstDefined(raw, ["leaveType", "leavetype", "leave_type"]), "Casual");
  const status = str(raw.status, "Pending");
  const startDate = toDateOnly(firstDefined(raw, ["startDate", "startdate", "start_date"]));
  const endDate = toDateOnly(firstDefined(raw, ["endDate", "enddate", "end_date"]));
  const storedDays = num(raw.days, 0);

  return {
    id: str(firstDefined(raw, ["_id", "id", "leaveid", "leave_id"])),
    employeeName: str(firstDefined(raw, ["employeeName", "employeename", "employee_name"])),
    leaveType: isLeaveType(type) ? type : "Casual",
    startDate,
    endDate,
    reason: str(raw.reason),
    days: storedDays > 0 ? storedDays : countLeaveDays(startDate, endDate),
    status: isLeaveStatus(status) ? status : "Pending"
  };
}

export function validateLeaveInput(raw: Record<string, unknown>): LeaveErrors {
  const leave = normalizeLeave(raw);
  const errors: LeaveErrors = {};

  if (!leave.employeeName) {
    errors.employeeName = "Employee name is required.";
  }
  if (!leave.startDate) {
    errors.startDate = "A valid start date is required.";
  }
  if (!leave.endDate) {
    errors.endDate = "A valid end date is required.";
  } else if (leave.startDate && leave.endDate < leave.startDate) {
    errors.endDate = "End date cannot be before the start date.";
  }
  if (leave.days > 60) {
    errors.days = "A single request cannot exceed 60 days.";
  }
  if (leave.reason.length < 5) {
    errors.reason = "Please give a reason of at least 5 characters.";
  }
  return errors;
}

export function calculateBalances(leaves: Leave[]): Record<LeaveType, LeaveBalance> {
  const balances = {} as Record<LeaveType, LeaveBalance>;
  for (const type of LEAVE_TYPES) {
    const used = leaves
      .filter((leave) => leave.status === "Approved" && leave.leaveType === type)
      .reduce((total, leave) => total + Math.max(0, leave.days), 0);
    const total = LEAVE_ALLOWANCE[type];
    balances[type] = { total, used, remaining: Math.max(0, total - used) };
  }
  return balances;
}
