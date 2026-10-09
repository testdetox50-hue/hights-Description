export type Salary = {
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

export type SalaryErrors = Partial<Record<keyof Salary, string>>;

const str = (value: unknown, fallback = ""): string => {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text && text !== "undefined" && text !== "null" ? text : fallback;
};

const num = (value: unknown, fallback = 0): number => {
  const parsed = Number(typeof value === "string" ? value.replace(/[,s]/g, "") : value);
  return Number.isFinite(parsed) && str(value) !== "" ? parsed : fallback;
};

const firstDefined = (raw: Record<string, unknown>, keys: string[]): unknown => {
  const hit = keys.find((key) => raw[key] !== undefined && raw[key] !== null && String(raw[key]).trim() !== "");
  return hit === undefined ? undefined : raw[hit];
};

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export function calculateNetSalary(baseSalary: number, bonus: number, deductions: number): number {
  return roundMoney(baseSalary + bonus - deductions);
}

export function isSalary(value: unknown): value is Salary {
  const record = (value ?? {}) as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.employeeName === "string" &&
    typeof record.baseSalary === "number" &&
    typeof record.bonus === "number" &&
    typeof record.deductions === "number" &&
    typeof record.netSalary === "number"
  );
}

export function normalizeSalary(raw: Record<string, unknown>): Salary {
  const baseSalary = num(firstDefined(raw, ["baseSalary", "basesalary", "base_salary"]));
  const bonus = num(raw.bonus);
  const deductions = num(raw.deductions);
  const created = str(firstDefined(raw, ["createdAt", "createdat", "created_at"]));
  const createdDate = new Date(created);

  return {
    id: str(firstDefined(raw, ["_id", "id", "salaryid", "salary_id"])),
    employeeId: str(firstDefined(raw, ["employeeId", "employeeid", "employee_id"])),
    employeeName: str(firstDefined(raw, ["employeeName", "employeename", "employee_name"])),
    employeeEmail: str(firstDefined(raw, ["employeeEmail", "employeeemail", "employee_email"])).toLowerCase(),
    month: str(raw.month).slice(0, 7),
    baseSalary,
    bonus,
    deductions,
    netSalary: calculateNetSalary(baseSalary, bonus, deductions),
    createdAt: created && !Number.isNaN(createdDate.getTime()) ? createdDate.toISOString() : ""
  };
}

export function validateSalaryInput(raw: Record<string, unknown>): SalaryErrors {
  const salary = normalizeSalary(raw);
  const errors: SalaryErrors = {};

  if (!salary.employeeName && !salary.employeeEmail) {
    errors.employeeName = "Select an employee for this salary slip.";
  }
  if (salary.month && !/^\d{4}-(0[1-9]|1[0-2])$/.test(salary.month)) {
    errors.month = "Month must be in YYYY-MM format.";
  }
  if (salary.baseSalary <= 0) {
    errors.baseSalary = "Base salary must be greater than zero.";
  }
  if (salary.bonus < 0) {
    errors.bonus = "Bonus cannot be negative.";
  }
  if (salary.deductions < 0) {
    errors.deductions = "Deductions cannot be negative.";
  } else if (salary.deductions > salary.baseSalary + salary.bonus) {
    errors.deductions = "Deductions cannot exceed gross pay.";
  }
  return errors;
}

export function formatCurrency(amount: number, currency = "INR", locale = "en-IN"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 2 }).format(amount);
}

export function totalPayroll(slips: Salary[]): number {
  return roundMoney(slips.reduce((sum, slip) => sum + slip.netSalary, 0));
}

export function groupByMonth(slips: Salary[]): Record<string, Salary[]> {
  const groups: Record<string, Salary[]> = {};
  for (const slip of slips) {
    const key = slip.month || slip.createdAt.slice(0, 7) || "unknown";
    (groups[key] ||= []).push(slip);
  }
  return groups;
}

export function latestSlipFor(slips: Salary[], employeeEmail: string): Salary | undefined {
  const email = employeeEmail.toLowerCase();
  return slips
    .filter((slip) => slip.employeeEmail === email)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}
