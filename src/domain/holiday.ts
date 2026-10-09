export type Holiday = {
  id: string;
  name: string;
  monthDay: string;
  active: boolean;
  description: string;
};

export type HolidayErrors = Partial<Record<keyof Holiday, string>>;

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

const pad = (value: number): string => String(value).padStart(2, "0");

export function toMonthDay(date: Date): string {
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Accepts "MM-DD", "YYYY-MM-DD" or any Date-parsable string and returns "MM-DD" (or "" if invalid). */
export function parseMonthDay(value: unknown): string {
  const text = str(value);
  const short = text.match(/^(\d{1,2})-(\d{1,2})$/);
  if (short) {
    return `${pad(Number(short[1]))}-${pad(Number(short[2]))}`;
  }
  const full = text.match(/^\d{4}-(\d{2})-(\d{2})/);
  if (full) {
    return `${full[1]}-${full[2]}`;
  }
  return "";
}

export function isValidMonthDay(monthDay: string): boolean {
  const match = monthDay.match(/^(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  return month >= 1 && month <= 12 && day >= 1 && day <= DAYS_IN_MONTH[month - 1];
}

export function isHoliday(value: unknown): value is Holiday {
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.monthDay === "string" &&
    typeof record.active === "boolean"
  );
}

export function normalizeHoliday(raw: Record<string, unknown>): Holiday {
  const active = firstDefined(raw, ["active", "isActive", "isactive", "is_active"]);
  const name = str(firstDefined(raw, ["name", "holidayName", "holidayname", "holiday_name"]));
  return {
    id: str(firstDefined(raw, ["_id", "id", "holidayid", "holiday_id"])) || name.toLowerCase().replace(/\s+/g, "-"),
    name,
    monthDay: parseMonthDay(firstDefined(raw, ["monthDay", "monthday", "month_day", "date"])),
    active: active === undefined ? true : active === true || String(active).toLowerCase() === "true" || active === 1,
    description: str(raw.description)
  };
}

export function validateHolidayInput(raw: Record<string, unknown>, existing: Holiday[] = []): HolidayErrors {
  const holiday = normalizeHoliday(raw);
  const errors: HolidayErrors = {};

  if (holiday.name.length < 2) {
    errors.name = "Holiday name must be at least 2 characters.";
  }
  if (!isValidMonthDay(holiday.monthDay)) {
    errors.monthDay = "Date must be a real calendar day in MM-DD format.";
  } else if (existing.some((item) => item.id !== holiday.id && item.monthDay === holiday.monthDay && item.name === holiday.name)) {
    errors.monthDay = "This holiday is already listed for that date.";
  }
  return errors;
}

export function holidaysOn(holidays: Holiday[], date: Date): Holiday[] {
  const key = toMonthDay(date);
  return holidays.filter((holiday) => holiday.active && holiday.monthDay === key);
}

export function nextOccurrence(holiday: Pick<Holiday, "monthDay">, from = new Date()): Date | null {
  if (!isValidMonthDay(holiday.monthDay)) {
    return null;
  }
  const [month, day] = holiday.monthDay.split("-").map(Number);
  for (let year = from.getFullYear(); year <= from.getFullYear() + 4; year += 1) {
    const candidate = new Date(year, month - 1, day);
    const sameDate = candidate.getMonth() === month - 1 && candidate.getDate() === day;
    const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    if (sameDate && candidate >= today) {
      return candidate;
    }
  }
  return null;
}

export function upcomingHolidays(holidays: Holiday[], limit = 5, from = new Date()): Array<Holiday & { date: Date }> {
  return holidays
    .filter((holiday) => holiday.active)
    .flatMap((holiday) => {
      const date = nextOccurrence(holiday, from);
      return date ? [{ ...holiday, date }] : [];
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}
