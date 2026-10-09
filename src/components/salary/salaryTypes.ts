export type SalarySlip = {
  _id: string;
  employeeId?: string;
  employeeEmail?: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  createdAt?: string;
};

export type SalaryFilterState = {
  month: string;
  employee: string;
  search: string;
};

export type SalaryFormValues = {
  employeeName: string;
  employeeEmail: string;
  month: string;
  baseSalary: string;
  bonus: string;
  deductions: string;
};

export type SalaryFormErrors = Partial<Record<keyof SalaryFormValues, string>>;

export type PayrollTotals = {
  slips: number;
  employees: number;
  base: number;
  bonus: number;
  deductions: number;
  net: number;
  averageNet: number;
};

export type MonthlyPoint = {
  month: string;
  net: number;
  base: number;
  count: number;
};

export type SortKey = "month" | "employeeName" | "baseSalary" | "bonus" | "deductions" | "netSalary";
export type SortDirection = "asc" | "desc";

export const EMPTY_FILTERS: SalaryFilterState = { month: "all", employee: "all", search: "" };

export const EMPTY_FORM: SalaryFormValues = {
  employeeName: "",
  employeeEmail: "",
  month: "",
  baseSalary: "",
  bonus: "0",
  deductions: "0"
};

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value);
}

/** Converts an untyped API row into a safe SalarySlip, recomputing net when it is missing. */
export function normalizeSalary(raw: unknown, index = 0): SalarySlip {
  const row = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const baseSalary = toNumber(row.baseSalary);
  const bonus = toNumber(row.bonus);
  const deductions = toNumber(row.deductions);
  const hasNet = row.netSalary !== undefined && row.netSalary !== null && row.netSalary !== "";
  const email = toText(row.employeeEmail);
  const id = toText(row._id) || toText(row.id) || `salary-${index}`;

  return {
    _id: id,
    employeeId: toText(row.employeeId) || undefined,
    employeeEmail: email || undefined,
    employeeName: toText(row.employeeName) || email || "Unknown employee",
    month: toText(row.month),
    baseSalary,
    bonus,
    deductions,
    netSalary: hasNet ? toNumber(row.netSalary) : baseSalary + bonus - deductions,
    createdAt: toText(row.createdAt) || undefined
  };
}

export function normalizeSalaryList(raw: unknown): SalarySlip[] {
  return Array.isArray(raw) ? raw.map((item, index) => normalizeSalary(item, index)) : [];
}
