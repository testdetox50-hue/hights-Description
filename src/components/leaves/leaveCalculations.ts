import type { BalanceBucket, LeaveBalance, LeaveFilterState, LeaveRequest, LeaveType } from "./leaveTypes";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Parses "YYYY-MM-DD" or an ISO string to a local-midnight Date; null when invalid. */
export function parseDate(value: string): Date | null {
  if (!value) return null;
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toDateKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** Counts Monday-Friday days between two dates, inclusive. Returns 0 for invalid or reversed ranges. */
export function countWorkingDays(start: string, end: string): number {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from || !to || to < from) return 0;

  let count = 0;
  for (let time = from.getTime(); time <= to.getTime(); time += DAY_MS) {
    // Re-create from components so DST shifts never skip or repeat a day.
    const current = new Date(time);
    const normalized = new Date(current.getFullYear(), current.getMonth(), current.getDate());
    if (!isWeekend(normalized)) count += 1;
  }
  return count;
}

export function isEndBeforeStart(start: string, end: string): boolean {
  const from = parseDate(start);
  const to = parseDate(end);
  return Boolean(from && to && to < from);
}

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const a1 = parseDate(aStart);
  const a2 = parseDate(aEnd);
  const b1 = parseDate(bStart);
  const b2 = parseDate(bEnd);
  if (!a1 || !a2 || !b1 || !b2) return false;
  return a1 <= b2 && b1 <= a2;
}

const ACTIVE_STATUSES = new Set<LeaveRequest["status"]>(["Pending", "Approved"]);

/** Finds an existing active request from the same employee that collides with the new range. */
export function findOverlap(
  leaves: LeaveRequest[],
  employeeName: string,
  start: string,
  end: string,
  ignoreId?: string
): LeaveRequest | undefined {
  const name = employeeName.trim().toLowerCase();
  return leaves.find(
    (leave) =>
      leave._id !== ignoreId &&
      ACTIVE_STATUSES.has(leave.status) &&
      leave.employeeName.trim().toLowerCase() === name &&
      rangesOverlap(leave.startDate, leave.endDate, start, end)
  );
}

export function getBucket(balance: LeaveBalance | undefined, type: LeaveType): BalanceBucket | undefined {
  if (!balance) return undefined;
  const key = type.toLowerCase() as "casual" | "sick" | "earned" | "unpaid";
  return balance[key];
}

export function remainingAfter(bucket: BalanceBucket | undefined, requestedDays: number): number {
  if (!bucket) return 0;
  return bucket.remaining - requestedDays;
}

export function hasEnoughBalance(type: LeaveType, bucket: BalanceBucket | undefined, requestedDays: number): boolean {
  if (type === "Unpaid") return true;
  if (!bucket) return false;
  return bucket.remaining >= requestedDays;
}

export function totalAvailable(balance: LeaveBalance): number {
  return balance.casual.remaining + balance.sick.remaining + balance.earned.remaining;
}

export function usagePercent(bucket: BalanceBucket): number {
  if (bucket.total <= 0) return 0;
  return Math.min(100, Math.round((bucket.used / bucket.total) * 100));
}

export function applyFilters(leaves: LeaveRequest[], filters: LeaveFilterState): LeaveRequest[] {
  const query = filters.search.trim().toLowerCase();
  return leaves.filter((leave) => {
    if (filters.status !== "All" && leave.status !== filters.status) return false;
    if (filters.leaveType !== "All" && leave.leaveType !== filters.leaveType) return false;
    if (query && !`${leave.employeeName} ${leave.reason}`.toLowerCase().includes(query)) return false;
    if (filters.from && filters.to && !rangesOverlap(leave.startDate, leave.endDate, filters.from, filters.to)) return false;
    if (filters.from && !filters.to && (parseDate(leave.endDate) ?? 0) < (parseDate(filters.from) ?? 0)) return false;
    if (filters.to && !filters.from && (parseDate(leave.startDate) ?? 0) > (parseDate(filters.to) ?? 0)) return false;
    return true;
  });
}

export function formatRange(start: string, end: string): string {
  const from = parseDate(start);
  const to = parseDate(end);
  if (!from || !to) return "-";
  const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  const left = from.toLocaleDateString(undefined, options);
  return from.getTime() === to.getTime() ? left : `${left} - ${to.toLocaleDateString(undefined, options)}`;
}
