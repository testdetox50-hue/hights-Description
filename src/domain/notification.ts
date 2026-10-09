export type NotificationType = "birthday" | "holiday" | "leave" | "system";
export type NotificationStatus = "sent" | "failed" | "pending";

export type NotificationLog = {
  id: string;
  ownerId: string;
  type: NotificationType;
  status: NotificationStatus;
  recipientName: string;
  recipientEmail: string;
  subject: string;
  holidayName: string;
  createdAt: string;
};

export type NotificationErrors = Partial<Record<keyof NotificationLog, string>>;

export const NOTIFICATION_TYPES: readonly NotificationType[] = ["birthday", "holiday", "leave", "system"];
export const NOTIFICATION_STATUSES: readonly NotificationStatus[] = ["sent", "failed", "pending"];

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

export const isNotificationType = (value: unknown): value is NotificationType => (NOTIFICATION_TYPES as readonly string[]).includes(value as string);

export const isNotificationStatus = (value: unknown): value is NotificationStatus => (NOTIFICATION_STATUSES as readonly string[]).includes(value as string);

export function isNotificationLog(value: unknown): value is NotificationLog {
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.subject === "string" &&
    typeof record.createdAt === "string" &&
    isNotificationType(record.type) &&
    isNotificationStatus(record.status)
  );
}

export function normalizeNotificationLog(raw: Record<string, unknown>): NotificationLog {
  const type = str(raw.type).toLowerCase();
  const status = str(raw.status, "sent").toLowerCase();
  const created = new Date(str(firstDefined(raw, ["createdAt", "createdat", "created_at"])));

  return {
    id: str(firstDefined(raw, ["_id", "id"])),
    ownerId: str(firstDefined(raw, ["ownerId", "ownerid", "owner_id"])),
    type: isNotificationType(type) ? type : "system",
    status: isNotificationStatus(status) ? status : "pending",
    recipientName: str(firstDefined(raw, ["recipientName", "recipientname", "recipient_name"])),
    recipientEmail: str(firstDefined(raw, ["recipientEmail", "recipientemail", "recipient_email"])).toLowerCase(),
    subject: str(raw.subject),
    holidayName: str(firstDefined(raw, ["holidayName", "holidayname", "holiday_name"])),
    createdAt: Number.isNaN(created.getTime()) ? "" : created.toISOString()
  };
}

export function validateNotificationInput(raw: Record<string, unknown>): NotificationErrors {
  const log = normalizeNotificationLog(raw);
  const errors: NotificationErrors = {};
  const rawType = str(raw.type).toLowerCase();

  if (rawType && !isNotificationType(rawType)) {
    errors.type = `Type must be one of: ${NOTIFICATION_TYPES.join(", ")}.`;
  }
  if (!log.subject) {
    errors.subject = "Subject is required.";
  } else if (log.subject.length > 150) {
    errors.subject = "Subject must be 150 characters or fewer.";
  }
  if (!log.recipientName) {
    errors.recipientName = "Recipient name is required.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(log.recipientEmail)) {
    errors.recipientEmail = "Enter a valid recipient email.";
  }
  if (log.type === "holiday" && !log.holidayName) {
    errors.holidayName = "Holiday notifications need a holiday name.";
  }
  return errors;
}

export function buildBirthdayLog(ownerId: string, name: string, email: string, now = new Date()): NotificationLog {
  const createdAt = now.toISOString();
  return {
    id: `birthday-${email || name}-${createdAt}`,
    ownerId,
    type: "birthday",
    status: "sent",
    recipientName: name,
    recipientEmail: email.toLowerCase(),
    subject: `Happy Birthday ${name}`.trim(),
    holidayName: "",
    createdAt
  };
}

export function sortNewestFirst(logs: NotificationLog[]): NotificationLog[] {
  return [...logs].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function visibleLogs(logs: NotificationLog[], userId: string, isAdmin: boolean): NotificationLog[] {
  return isAdmin ? logs : logs.filter((log) => log.ownerId === userId);
}

export function countByType(logs: NotificationLog[]): Record<NotificationType, number> {
  const counts: Record<NotificationType, number> = { birthday: 0, holiday: 0, leave: 0, system: 0 };
  for (const log of logs) {
    counts[log.type] += 1;
  }
  return counts;
}
