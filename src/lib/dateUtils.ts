// Pure date helpers. All "ISO date" strings are local calendar dates: YYYY-MM-DD.

export type IsoDate = string;

const MS_PER_DAY = 86_400_000;

export const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function pad(n: number, width = 2): string {
  return String(n).padStart(width, "0");
}

/** Format a Date as a local YYYY-MM-DD string. */
export function toIsoDate(date: Date): IsoDate {
  return `${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse YYYY-MM-DD (or a full ISO string, date part only) to a local Date; null if invalid. */
export function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(y, m - 1, d);
  const valid =
    date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  return valid ? date : null;
}

export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

export function todayIso(now: Date = new Date()): IsoDate {
  return toIsoDate(now);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = daysInMonth(target.getFullYear(), target.getMonth());
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
}

/** Whole calendar days from a to b (b - a), ignoring time of day and DST shifts. */
export function diffInDays(a: Date, b: Date): number {
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / MS_PER_DAY);
}

/** Number of days in a month; month is 0-based. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isSameDay(a: Date, b: Date): boolean {
  return diffInDays(a, b) === 0;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Every date from start to end inclusive; empty when end is before start. */
export function eachDay(start: Date, end: Date): Date[] {
  const total = diffInDays(start, end);
  return Array.from({ length: Math.max(total + 1, 0) }, (_, i) => addDays(start, i));
}

/** Count of Monday-Friday days between start and end inclusive. */
export function countWeekdays(start: Date, end: Date): number {
  return eachDay(start, end).filter((d) => !isWeekend(d)).length;
}

export function formatDisplayDate(date: Date, locale = "en-IN"): string {
  return date.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}
