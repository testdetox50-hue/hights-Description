// Length-of-service, anniversary and birthday helpers.

import { daysInMonth, diffInDays, parseIsoDate } from "./dateUtils";

export interface Tenure {
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export interface UpcomingEvent {
  date: Date;
  daysAway: number;
  turning: number; // age (birthday) or completed years (anniversary)
}

function asDate(value: Date | string): Date | null {
  return typeof value === "string" ? parseIsoDate(value) : value;
}

/** Elapsed years/months/days between start and end (defaults to today). Null for bad input. */
export function calculateTenure(
  start: Date | string,
  end: Date | string = new Date()
): Tenure | null {
  const from = asDate(start);
  const to = asDate(end);
  if (!from || !to || to < from) return null;

  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    // borrow the length of the month preceding `to`
    const prev = new Date(to.getFullYear(), to.getMonth() - 1, 1);
    days += daysInMonth(prev.getFullYear(), prev.getMonth());
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days, totalDays: diffInDays(from, to) };
}

/** Human readable: "2 years, 3 months". Falls back to days for under a month. */
export function formatTenure(tenure: Tenure | null): string {
  if (!tenure) return "-";
  const parts: string[] = [];
  if (tenure.years) parts.push(`${tenure.years} ${tenure.years === 1 ? "year" : "years"}`);
  if (tenure.months) parts.push(`${tenure.months} ${tenure.months === 1 ? "month" : "months"}`);
  if (parts.length === 0) return `${tenure.days} ${tenure.days === 1 ? "day" : "days"}`;
  return parts.join(", ");
}

export function yearsOfService(start: Date | string, asOf: Date | string = new Date()): number {
  return calculateTenure(start, asOf)?.years ?? 0;
}

/** Fractional years (e.g. 2.5) using 365.25 day years; handy for gratuity-style rules. */
export function fractionalYears(start: Date | string, asOf: Date | string = new Date()): number {
  const tenure = calculateTenure(start, asOf);
  return tenure ? Math.round((tenure.totalDays / 365.25) * 100) / 100 : 0;
}

/** Gratuity eligibility in India requires 5 completed years of continuous service. */
export function isGratuityEligible(start: Date | string, asOf: Date | string = new Date()): boolean {
  return yearsOfService(start, asOf) >= 5;
}

/** Next occurrence of a yearly date (birthday/anniversary) on or after `from`. */
export function nextOccurrence(origin: Date | string, from: Date = new Date()): UpcomingEvent | null {
  const base = asDate(origin);
  if (!base) return null;
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());

  const occurrenceIn = (year: number): Date => {
    // Feb 29 falls back to Feb 28 in non-leap years
    const day = Math.min(base.getDate(), daysInMonth(year, base.getMonth()));
    return new Date(year, base.getMonth(), day);
  };

  let date = occurrenceIn(today.getFullYear());
  if (date < today) date = occurrenceIn(today.getFullYear() + 1);
  return {
    date,
    daysAway: diffInDays(today, date),
    turning: date.getFullYear() - base.getFullYear(),
  };
}

/** People whose yearly date (birthday or joining date) falls within the next `withinDays` days. */
export function upcomingEvents<T>(
  people: T[],
  getDate: (person: T) => Date | string | null | undefined,
  withinDays = 30,
  from: Date = new Date()
): Array<{ person: T } & UpcomingEvent> {
  const results: Array<{ person: T } & UpcomingEvent> = [];
  for (const person of people) {
    const raw = getDate(person);
    const event = raw ? nextOccurrence(raw, from) : null;
    if (event && event.daysAway <= withinDays) results.push({ person, ...event });
  }
  return results.sort((a, b) => a.daysAway - b.daysAway);
}

export function ageOn(birthDate: Date | string, asOf: Date | string = new Date()): number {
  return yearsOfService(birthDate, asOf);
}
