import { api } from "../api/client";
import { TtlCache, type RawRow } from "./employeesService";

export type Holiday = {
  name: string;
  monthDay: string; // "MM-DD"
  active: boolean;
};

export type NotificationSettings = {
  birthdayAlertsEnabled: boolean;
  holidayAlertsEnabled: boolean;
  holidays: Holiday[];
};

export type AppSettings = {
  notifications: NotificationSettings;
  extra: RawRow; // any additional keys the app persisted, preserved on save
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  birthdayAlertsEnabled: false,
  holidayAlertsEnabled: false,
  holidays: []
};

function normalizeHoliday(raw: unknown): Holiday | null {
  const row = (raw ?? {}) as RawRow;
  const name = String(row.name ?? "").trim();
  const monthDay = String(row.monthDay ?? row.month_day ?? "").trim();
  if (!name || !/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(monthDay)) {
    return null;
  }
  return { name, monthDay, active: row.active !== false };
}

export function normalizeSettings(raw: RawRow): AppSettings {
  const { notifications, ...extra } = raw;
  const n = (notifications ?? {}) as RawRow;
  const holidays = Array.isArray(n.holidays) ? n.holidays.map(normalizeHoliday).filter((h): h is Holiday => h !== null) : [];
  return {
    notifications: {
      birthdayAlertsEnabled: Boolean(n.birthdayAlertsEnabled ?? n.birthday_alerts_enabled ?? DEFAULT_NOTIFICATIONS.birthdayAlertsEnabled),
      holidayAlertsEnabled: Boolean(n.holidayAlertsEnabled ?? n.holiday_alerts_enabled ?? DEFAULT_NOTIFICATIONS.holidayAlertsEnabled),
      holidays
    },
    extra
  };
}

const cache = new TtlCache<AppSettings>(60_000);

export function invalidateSettings() {
  cache.clear();
}

export async function getSettings(force = false): Promise<AppSettings> {
  return cache.get(async () => {
    const res = await api<{ data?: RawRow }>("/settings");
    return normalizeSettings(res.data ?? {});
  }, force);
}

export async function saveSettings(settings: AppSettings): Promise<string> {
  const res = await api<{ message: string }>("/settings", {
    method: "PUT",
    body: JSON.stringify({ ...settings.extra, notifications: settings.notifications })
  });
  invalidateSettings();
  return res.message;
}

export async function updateNotificationSettings(changes: Partial<NotificationSettings>): Promise<string> {
  const current = await getSettings(true);
  return saveSettings({ ...current, notifications: { ...current.notifications, ...changes } });
}

export async function addHoliday(holiday: Holiday): Promise<string> {
  const valid = normalizeHoliday(holiday);
  if (!valid) {
    throw new Error("Holiday needs a name and a MM-DD date");
  }
  const current = await getSettings(true);
  const others = current.notifications.holidays.filter((h) => h.monthDay !== valid.monthDay || h.name !== valid.name);
  return updateNotificationSettings({ holidays: [...others, valid].sort((a, b) => a.monthDay.localeCompare(b.monthDay)) });
}

export async function removeHoliday(name: string, monthDay: string): Promise<string> {
  const current = await getSettings(true);
  return updateNotificationSettings({
    holidays: current.notifications.holidays.filter((h) => !(h.name === name && h.monthDay === monthDay))
  });
}

export async function upcomingHolidays(limit = 5, from = new Date()): Promise<Array<Holiday & { date: Date }>> {
  const { notifications } = await getSettings();
  const year = from.getFullYear();
  const startOfDay = new Date(year, from.getMonth(), from.getDate());
  return notifications.holidays
    .filter((h) => h.active)
    .map((h) => {
      const [month, day] = h.monthDay.split("-").map(Number);
      let date = new Date(year, month - 1, day);
      if (date < startOfDay) {
        date = new Date(year + 1, month - 1, day);
      }
      return { ...h, date };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}
