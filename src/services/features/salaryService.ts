import { api } from "../api/client";
import { TtlCache, num, pick, str, type RawRow } from "./employeesService";

export type SalarySlip = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  createdAt: string;
};

export type NewSalaryInput = {
  employeeId?: string;
  employeeName: string;
  employeeEmail: string;
  month: string;
  baseSalary: number;
  bonus?: number;
  deductions?: number;
};

export type PayrollTotals = {
  month: string;
  slips: number;
  base: number;
  bonus: number;
  deductions: number;
  net: number;
};

export function normalizeSalary(row: RawRow): SalarySlip {
  const baseSalary = num(row, "baseSalary", "basesalary", "base_salary");
  const bonus = num(row, "bonus");
  const deductions = num(row, "deductions");
  const createdAt = str(row, "createdAt", "createdat", "created_at");
  const explicitNet = pick(row, "netSalary", "netsalary", "net_salary");
  return {
    id: str(row, "_id", "id"),
    employeeId: str(row, "employeeId", "employeeid", "employee_id"),
    employeeName: str(row, "employeeName", "employeename", "employee_name"),
    employeeEmail: str(row, "employeeEmail", "employeeemail", "employee_email").toLowerCase(),
    month: str(row, "month", "salaryMonth", "salary_month") || createdAt.slice(0, 7),
    baseSalary,
    bonus,
    deductions,
    netSalary: explicitNet === undefined ? baseSalary + bonus - deductions : Number(explicitNet) || 0,
    createdAt
  };
}

const cache = new TtlCache<SalarySlip[]>(30_000);

export function invalidateSalary() {
  cache.clear();
}

export async function listSalarySlips(force = false): Promise<SalarySlip[]> {
  return cache.get(async () => {
    const res = await api<{ items?: RawRow[] }>("/salary");
    return (res.items ?? []).map(normalizeSalary);
  }, force);
}

export async function listMySlips(): Promise<SalarySlip[]> {
  const res = await api<{ items?: RawRow[] }>("/salary/me");
  return (res.items ?? []).map(normalizeSalary).sort((a, b) => b.month.localeCompare(a.month));
}

export async function createSalarySlip(input: NewSalaryInput): Promise<string> {
  if (input.baseSalary < 0 || (input.bonus ?? 0) < 0 || (input.deductions ?? 0) < 0) {
    throw new Error("Salary amounts cannot be negative");
  }
  const res = await api<{ message: string }>("/salary", { method: "POST", body: JSON.stringify(input) });
  invalidateSalary();
  return res.message;
}

export async function payrollTotalsByMonth(): Promise<PayrollTotals[]> {
  const byMonth = new Map<string, PayrollTotals>();
  for (const slip of await listSalarySlips()) {
    const key = slip.month || "unknown";
    const t = byMonth.get(key) ?? { month: key, slips: 0, base: 0, bonus: 0, deductions: 0, net: 0 };
    t.slips += 1;
    t.base += slip.baseSalary;
    t.bonus += slip.bonus;
    t.deductions += slip.deductions;
    t.net += slip.netSalary;
    byMonth.set(key, t);
  }
  return [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month));
}

export async function payrollTotalFor(month: string): Promise<PayrollTotals> {
  const found = (await payrollTotalsByMonth()).find((t) => t.month === month);
  return found ?? { month, slips: 0, base: 0, bonus: 0, deductions: 0, net: 0 };
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}
