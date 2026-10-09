// Indian public holidays and working-day helpers.
// Fixed-date national holidays are computed for any year. Lunar/festival dates
// (Holi, Diwali, Eid, ...) vary yearly, so they come from a lookup table that
// should be extended as new calendars are published.

import { addDays, parseIsoDate, toIsoDate, isWeekend } from "./dateUtils";

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

const FIXED_HOLIDAYS: Array<{ month: number; day: number; name: string }> = [
  { month: 1, day: 26, name: "Republic Day" },
  { month: 8, day: 15, name: "Independence Day" },
  { month: 10, day: 2, name: "Gandhi Jayanti" },
  { month: 12, day: 25, name: "Christmas" },
];

// Approximate festival dates; verify against the official gazette each year.
const FESTIVAL_HOLIDAYS: Record<number, Holiday[]> = {
  2025: [
    { date: "2025-03-14", name: "Holi" },
    { date: "2025-03-31", name: "Id-ul-Fitr" },
    { date: "2025-08-27", name: "Ganesh Chaturthi" },
    { date: "2025-10-02", name: "Dussehra" },
    { date: "2025-10-20", name: "Diwali" },
  ],
  2026: [
    { date: "2026-03-04", name: "Holi" },
    { date: "2026-03-21", name: "Id-ul-Fitr" },
    { date: "2026-09-14", name: "Ganesh Chaturthi" },
    { date: "2026-10-20", name: "Dussehra" },
    { date: "2026-11-08", name: "Diwali" },
  ],
};

const customHolidays = new Map<string, string>();

/** Register an organisation-specific holiday (e.g. company foundation day). */
export function addCustomHoliday(date: string, name: string): void {
  customHolidays.set(date, name);
}

export function clearCustomHolidays(): void {
  customHolidays.clear();
}

/** All known holidays for a year, sorted by date, de-duplicated by date. */
export function getHolidays(year: number): Holiday[] {
  const byDate = new Map<string, string>();
  const pad = (n: number) => String(n).padStart(2, "0");

  FIXED_HOLIDAYS.forEach(({ month, day, name }) => {
    byDate.set(`${year}-${pad(month)}-${pad(day)}`, name);
  });
  (FESTIVAL_HOLIDAYS[year] ?? []).forEach(({ date, name }) => {
    const existing = byDate.get(date);
    byDate.set(date, existing ? `${existing} / ${name}` : name);
  });
  customHolidays.forEach((name, date) => {
    if (date.startsWith(`${year}-`)) byDate.set(date, name);
  });

  return Array.from(byDate, ([date, name]) => ({ date, name })).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export function getHolidayName(date: Date | string): string | null {
  const parsed = typeof date === "string" ? parseIsoDate(date) : date;
  if (!parsed) return null;
  const iso = toIsoDate(parsed);
  return getHolidays(parsed.getFullYear()).find((h) => h.date === iso)?.name ?? null;
}

export function isHoliday(date: Date | string): boolean {
  return getHolidayName(date) !== null;
}

/** A working day is a weekday (Mon-Fri by default) that is not a public holiday. */
export function isWorkingDay(date: Date, options: { saturdayWorking?: boolean } = {}): boolean {
  const weekendOff = options.saturdayWorking ? date.getDay() === 0 : isWeekend(date);
  return !weekendOff && !isHoliday(date);
}

/** Count working days between start and end inclusive. */
export function countWorkingDays(
  start: Date,
  end: Date,
  options: { saturdayWorking?: boolean } = {}
): number {
  let count = 0;
  for (let d = start; d.getTime() <= end.getTime(); d = addDays(d, 1)) {
    if (isWorkingDay(d, options)) count++;
  }
  return count;
}

/** The next working day strictly after `date`. */
export function nextWorkingDay(date: Date, options: { saturdayWorking?: boolean } = {}): Date {
  let next = addDays(date, 1);
  while (!isWorkingDay(next, options)) next = addDays(next, 1);
  return next;
}

/** Holidays still ahead of `from` (inclusive), limited to `limit` entries. */
export function upcomingHolidays(from: Date = new Date(), limit = 5): Holiday[] {
  const today = toIsoDate(from);
  const year = from.getFullYear();
  return [...getHolidays(year), ...getHolidays(year + 1)]
    .filter((h) => h.date >= today)
    .slice(0, limit);
}
