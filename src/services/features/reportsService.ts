import { listEmployees, countEmployeesBy } from "./employeesService";
import { listAttendance } from "./attendanceService";
import { listLeaves, listBalances } from "./leavesService";
import { listProjects, projectStatusCounts } from "./projectsService";
import { payrollTotalsByMonth, type PayrollTotals } from "./salaryService";

export type HeadcountReport = {
  total: number;
  byRole: Record<string, number>;
  byDepartment: Record<string, number>;
  joinedLast90Days: number;
};

export type AttendanceRateReport = {
  month: string;
  workingDays: number;
  expectedRecords: number;
  attendedRecords: number;
  rate: number; // 0..1, half days count as 0.5
};

export type LeaveUtilisationReport = {
  allowanceDays: number;
  approvedDays: number;
  pendingRequests: number;
  utilisation: number; // 0..1 of paid allowance used
};

export type DashboardReport = {
  headcount: HeadcountReport;
  attendance: AttendanceRateReport;
  leave: LeaveUtilisationReport;
  projects: { total: number; byStatus: Record<string, number> };
  latestPayroll: PayrollTotals | null;
};

const round = (value: number, places = 3) => Math.round(value * 10 ** places) / 10 ** places;

export function countWeekdays(month: string, until = new Date()): number {
  const [year, m] = month.split("-").map(Number);
  const lastDay = new Date(year, m, 0).getDate();
  let count = 0;
  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(year, m - 1, day);
    if (date > until) {
      break;
    }
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      count += 1;
    }
  }
  return count;
}

export async function headcountReport(now = Date.now()): Promise<HeadcountReport> {
  const employees = await listEmployees();
  const cutoff = now - 90 * 24 * 60 * 60 * 1000;
  return {
    total: employees.length,
    byRole: await countEmployeesBy("role"),
    byDepartment: await countEmployeesBy("department"),
    joinedLast90Days: employees.filter((e) => new Date(e.joiningDate).getTime() >= cutoff).length
  };
}

export async function attendanceRateReport(month = new Date().toISOString().slice(0, 7)): Promise<AttendanceRateReport> {
  const [records, employees] = await Promise.all([listAttendance(), listEmployees()]);
  const inMonth = records.filter((r) => r.workDate.startsWith(month));
  const workingDays = countWeekdays(month);
  const people = Math.max(employees.length, new Set(inMonth.map((r) => r.employeeEmail)).size);
  const expectedRecords = workingDays * people;
  const attended = inMonth.reduce((sum, r) => sum + (r.status === "Half Day" ? 0.5 : r.status === "Present" ? 1 : 0), 0);
  return {
    month,
    workingDays,
    expectedRecords,
    attendedRecords: attended,
    rate: expectedRecords ? round(Math.min(1, attended / expectedRecords)) : 0
  };
}

export async function leaveUtilisationReport(): Promise<LeaveUtilisationReport> {
  const [balances, leaves] = await Promise.all([listBalances(), listLeaves()]);
  const paid = (b: (typeof balances)[number]) => [b.casual, b.sick, b.earned];
  const allowanceDays = balances.reduce((sum, b) => sum + paid(b).reduce((s, x) => s + x.total, 0), 0);
  const usedDays = balances.reduce((sum, b) => sum + paid(b).reduce((s, x) => s + x.used, 0), 0);
  return {
    allowanceDays,
    approvedDays: leaves.filter((l) => l.status === "Approved").reduce((sum, l) => sum + l.days, 0),
    pendingRequests: leaves.filter((l) => l.status === "Pending").length,
    utilisation: allowanceDays ? round(usedDays / allowanceDays) : 0
  };
}

export async function dashboardReport(): Promise<DashboardReport> {
  const [headcount, attendance, leave, projects, byStatus, payroll] = await Promise.all([
    headcountReport(),
    attendanceRateReport(),
    leaveUtilisationReport(),
    listProjects(),
    projectStatusCounts(),
    payrollTotalsByMonth().catch(() => [] as PayrollTotals[])
  ]);
  return {
    headcount,
    attendance,
    leave,
    projects: { total: projects.length, byStatus },
    latestPayroll: payroll[0] ?? null
  };
}

export const asPercent = (ratio: number, digits = 1) => `${(ratio * 100).toFixed(digits)}%`;
