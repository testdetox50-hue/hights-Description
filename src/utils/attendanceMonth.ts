export type MonthAttendanceRow = {
  workDate: string;
  workedMinutes: number;
  status: "In Progress" | "Present" | "Half Day" | "Missed";
};

export type MonthAttendanceSummary = {
  totalDays: number;
  presentDays: number;
  halfDays: number;
  inProgress: number;
  totalMinutes: number;
};

// Matches the "October 2026" label used by salary slips.
export function monthLabel(date: Date) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// Value for <input type="month">, e.g. "2026-10".
export function monthInputValue(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthInputToLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return monthLabel(new Date(year, month - 1, 1));
}

export function filterByMonthLabel<T extends { workDate: string }>(rows: T[], label: string) {
  return rows.filter((row) => monthLabel(new Date(row.workDate)) === label);
}

export function summarizeMonth(rows: MonthAttendanceRow[]): MonthAttendanceSummary {
  return {
    totalDays: rows.length,
    presentDays: rows.filter((row) => row.status === "Present").length,
    halfDays: rows.filter((row) => row.status === "Half Day").length,
    inProgress: rows.filter((row) => row.status === "In Progress").length,
    totalMinutes: rows.reduce((sum, row) => sum + row.workedMinutes, 0)
  };
}
