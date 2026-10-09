import { api } from "../api/client";
import { TtlCache, str, type RawRow } from "./employeesService";

export type NotificationType = "birthday" | "holiday" | string;

export type NotificationLog = {
  id: string;
  type: NotificationType;
  status: string;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  holidayName: string;
  createdAt: string;
};

export type NotificationStats = {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  lastRunAt: string | null;
};

export function normalizeLog(row: RawRow): NotificationLog {
  return {
    id: str(row, "_id", "id"),
    type: str(row, "type") || "unknown",
    status: str(row, "status") || "sent",
    recipientName: str(row, "recipientName", "recipient_name"),
    recipientEmail: str(row, "recipientEmail", "recipient_email"),
    subject: str(row, "subject"),
    holidayName: str(row, "holidayName", "holiday_name"),
    createdAt: str(row, "createdAt", "createdat", "created_at")
  };
}

const cache = new TtlCache<NotificationLog[]>(10_000);

export function invalidateNotifications() {
  cache.clear();
}

/** Logs sorted newest first. */
export async function listLogs(force = false): Promise<NotificationLog[]> {
  return cache.get(async () => {
    const res = await api<{ items?: RawRow[] }>("/settings/notifications/logs");
    return (res.items ?? []).map(normalizeLog).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, force);
}

export async function listLogsByType(type: NotificationType): Promise<NotificationLog[]> {
  return (await listLogs()).filter((log) => log.type === type);
}

export async function recentLogs(days = 7, now = Date.now()): Promise<NotificationLog[]> {
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  return (await listLogs()).filter((log) => {
    const time = new Date(log.createdAt).getTime();
    return Number.isFinite(time) && time >= cutoff;
  });
}

/** Triggers the birthday/holiday check and returns the server message plus the number of new logs. */
export async function runNow(): Promise<{ message: string; newLogs: number }> {
  const before = (await listLogs()).length;
  const res = await api<{ message: string }>("/settings/notifications/run", { method: "POST" });
  invalidateNotifications();
  const after = (await listLogs(true)).length;
  return { message: res.message, newLogs: Math.max(0, after - before) };
}

export async function getStats(): Promise<NotificationStats> {
  const logs = await listLogs();
  const stats: NotificationStats = { total: logs.length, byType: {}, byStatus: {}, lastRunAt: logs[0]?.createdAt ?? null };
  for (const log of logs) {
    stats.byType[log.type] = (stats.byType[log.type] ?? 0) + 1;
    stats.byStatus[log.status] = (stats.byStatus[log.status] ?? 0) + 1;
  }
  return stats;
}

/** Groups logs by calendar day (YYYY-MM-DD) for timeline rendering. */
export async function groupLogsByDay(): Promise<Array<{ day: string; logs: NotificationLog[] }>> {
  const groups = new Map<string, NotificationLog[]>();
  for (const log of await listLogs()) {
    const day = log.createdAt.slice(0, 10) || "unknown";
    groups.set(day, [...(groups.get(day) ?? []), log]);
  }
  return [...groups.entries()].map(([day, logs]) => ({ day, logs }));
}

export function describeLog(log: NotificationLog): string {
  const who = log.recipientName || log.recipientEmail || "someone";
  if (log.type === "holiday") {
    return `Holiday greeting "${log.holidayName || log.subject}" sent to ${who}`;
  }
  if (log.type === "birthday") {
    return `Birthday wishes sent to ${who}`;
  }
  return log.subject || `${log.type} notification for ${who}`;
}
