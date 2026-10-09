export type Theme = "light" | "dark" | "system";

export type NotificationSettings = {
  birthdayAlertsEnabled: boolean;
  holidayAlertsEnabled: boolean;
  holidays: Array<{ name: string; monthDay: string; active: boolean }>;
};

export type Settings = {
  ownerId: string;
  companyName: string;
  theme: Theme;
  timezone: string;
  workdayStart: string;
  workdayMinutes: number;
  notifications: NotificationSettings;
  updatedAt: string;
};

export type SettingsErrors = Partial<Record<keyof Settings, string>>;

export const THEMES: readonly Theme[] = ["light", "dark", "system"];
export const DEFAULT_SETTINGS: Settings = {
  ownerId: "",
  companyName: "StaffHub",
  theme: "system",
  timezone: "UTC",
  workdayStart: "09:00",
  workdayMinutes: 480,
  notifications: { birthdayAlertsEnabled: false, holidayAlertsEnabled: false, holidays: [] },
  updatedAt: ""
};

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const num = (value: unknown, fallback = 0): number => (str(value) !== "" && Number.isFinite(Number(value)) ? Number(value) : fallback);

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

const toBool = (value: unknown, fallback: boolean): boolean => {
  const text = str(value).toLowerCase();
  return text === "true" || text === "1" ? true : text === "false" || text === "0" ? false : fallback;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const isTheme = (value: unknown): value is Theme => (THEMES as readonly string[]).includes(value as string);

export function isSettings(value: unknown): value is Settings {
  return (
    isRecord(value) &&
    typeof value.companyName === "string" &&
    isTheme(value.theme) &&
    typeof value.workdayMinutes === "number" &&
    isRecord(value.notifications) &&
    Array.isArray(value.notifications.holidays)
  );
}

export function normalizeNotificationSettings(raw: unknown): NotificationSettings {
  const source = isRecord(raw) ? raw : {};
  const holidays = Array.isArray(source.holidays) ? source.holidays.filter(isRecord) : [];
  return {
    birthdayAlertsEnabled: toBool(firstDefined(source, ["birthdayAlertsEnabled", "birthday_alerts_enabled"]), false),
    holidayAlertsEnabled: toBool(firstDefined(source, ["holidayAlertsEnabled", "holiday_alerts_enabled"]), false),
    holidays: holidays.map((item) => ({
      name: str(item.name),
      monthDay: str(firstDefined(item, ["monthDay", "month_day"])),
      active: toBool(item.active, true)
    }))
  };
}

export function normalizeSettings(raw: Record<string, unknown>): Settings {
  const theme = str(raw.theme, DEFAULT_SETTINGS.theme);
  return {
    ownerId: str(firstDefined(raw, ["ownerId", "ownerid", "owner_id"])),
    companyName: str(firstDefined(raw, ["companyName", "companyname", "company_name"]), DEFAULT_SETTINGS.companyName),
    theme: isTheme(theme) ? theme : DEFAULT_SETTINGS.theme,
    timezone: str(raw.timezone, DEFAULT_SETTINGS.timezone),
    workdayStart: str(firstDefined(raw, ["workdayStart", "workdaystart", "workday_start"]), DEFAULT_SETTINGS.workdayStart),
    workdayMinutes: num(firstDefined(raw, ["workdayMinutes", "workdayminutes", "workday_minutes"]), DEFAULT_SETTINGS.workdayMinutes),
    notifications: normalizeNotificationSettings(raw.notifications),
    updatedAt: str(firstDefined(raw, ["updatedAt", "updatedat", "updated_at"]))
  };
}

export function isValidTimezone(timezone: string): boolean {
  try {
    return Boolean(new Intl.DateTimeFormat("en-US", { timeZone: timezone }));
  } catch {
    return false;
  }
}

export function validateSettingsInput(raw: Record<string, unknown>): SettingsErrors {
  const settings = normalizeSettings(raw);
  const errors: SettingsErrors = {};

  if (settings.companyName.length < 2) {
    errors.companyName = "Company name must be at least 2 characters.";
  }
  if (!isValidTimezone(settings.timezone)) {
    errors.timezone = "Timezone is not a valid IANA timezone.";
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(settings.workdayStart)) {
    errors.workdayStart = "Workday start must be in HH:MM (24h) format.";
  }
  if (settings.workdayMinutes < 60 || settings.workdayMinutes > 720) {
    errors.workdayMinutes = "Workday must be between 60 and 720 minutes.";
  }
  return errors;
}
