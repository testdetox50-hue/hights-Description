import type {
  MonthlyPoint,
  PayrollTotals,
  SalaryFilterState,
  SalarySlip,
  SortDirection,
  SortKey
} from "./salaryTypes";

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december"
];

/** Annual-style progressive slabs applied to a monthly gross figure (illustrative estimate only). */
export const TAX_SLABS: ReadonlyArray<{ upTo: number; rate: number }> = [
  { upTo: 1000, rate: 0 },
  { upTo: 3000, rate: 0.1 },
  { upTo: 6000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 }
];

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateNet(base: number, bonus: number, deductions: number): number {
  return roundMoney(base + bonus - deductions);
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2
  }).format(Number.isFinite(value) ? value : 0);
}

/** Progressive tax estimate for gross pay (base + bonus). */
export function estimateTax(gross: number): number {
  let remaining = Math.max(gross, 0);
  let lower = 0;
  let tax = 0;
  for (const slab of TAX_SLABS) {
    if (remaining <= 0) break;
    const width = Math.min(remaining, slab.upTo - lower);
    tax += width * slab.rate;
    remaining -= width;
    lower = slab.upTo;
  }
  return roundMoney(tax);
}

/** Parses labels such as "October 2026" into a sortable number (year * 12 + month). */
export function monthToIndex(label: string): number {
  const [name = "", year = ""] = label.trim().toLowerCase().split(/\s+/);
  const month = MONTH_NAMES.findIndex((item) => item.startsWith(name.slice(0, 3)) && name.length >= 3);
  const parsedYear = Number(year);
  if (month < 0 || !Number.isFinite(parsedYear)) return -1;
  return parsedYear * 12 + month;
}

export function compareMonths(a: string, b: string): number {
  return monthToIndex(a) - monthToIndex(b);
}

export function uniqueMonths(rows: SalarySlip[]): string[] {
  return Array.from(new Set(rows.map((row) => row.month).filter(Boolean))).sort((a, b) => compareMonths(b, a));
}

export function uniqueEmployees(rows: SalarySlip[]): string[] {
  return Array.from(new Set(rows.map((row) => row.employeeName))).sort((a, b) => a.localeCompare(b));
}

export function filterSalaries(rows: SalarySlip[], filters: SalaryFilterState): SalarySlip[] {
  const term = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.month !== "all" && row.month !== filters.month) return false;
    if (filters.employee !== "all" && row.employeeName !== filters.employee) return false;
    if (!term) return true;
    return `${row.employeeName} ${row.employeeEmail ?? ""} ${row.month}`.toLowerCase().includes(term);
  });
}

export function sortSalaries(rows: SalarySlip[], key: SortKey, direction: SortDirection): SalarySlip[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (key === "month") return compareMonths(a.month, b.month) * factor;
    if (key === "employeeName") return a.employeeName.localeCompare(b.employeeName) * factor;
    return (a[key] - b[key]) * factor;
  });
}

export function calculateTotals(rows: SalarySlip[]): PayrollTotals {
  const sum = (pick: (row: SalarySlip) => number) => roundMoney(rows.reduce((acc, row) => acc + pick(row), 0));
  const net = sum((row) => row.netSalary);
  return {
    slips: rows.length,
    employees: new Set(rows.map((row) => row.employeeName)).size,
    base: sum((row) => row.baseSalary),
    bonus: sum((row) => row.bonus),
    deductions: sum((row) => row.deductions),
    net,
    averageNet: rows.length ? roundMoney(net / rows.length) : 0
  };
}

/** Aggregates slips per month, ordered oldest to newest. */
export function groupByMonth(rows: SalarySlip[]): MonthlyPoint[] {
  const map = new Map<string, MonthlyPoint>();
  for (const row of rows) {
    const point = map.get(row.month) ?? { month: row.month, net: 0, base: 0, count: 0 };
    point.net = roundMoney(point.net + row.netSalary);
    point.base = roundMoney(point.base + row.baseSalary);
    point.count += 1;
    map.set(row.month, point);
  }
  return Array.from(map.values()).sort((a, b) => compareMonths(a.month, b.month));
}

/** Percentage change from previous to current; null when there is no baseline. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return roundMoney(((current - previous) / previous) * 100);
}
