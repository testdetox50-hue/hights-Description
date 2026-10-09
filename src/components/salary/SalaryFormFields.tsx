"use client";

import type { ChangeEvent } from "react";

import { calculateNet, estimateTax, formatCurrency } from "./salaryCalculations";
import type { SalaryFormErrors, SalaryFormValues } from "./salaryTypes";

type SalaryFormFieldsProps = {
  values: SalaryFormValues;
  errors?: SalaryFormErrors;
  onChange: (next: SalaryFormValues) => void;
  disabled?: boolean;
};

const MONTH_PATTERN = /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/;

export function validateSalaryForm(values: SalaryFormValues): SalaryFormErrors {
  const errors: SalaryFormErrors = {};
  if (!values.employeeName.trim()) errors.employeeName = "Employee name is required.";
  if (values.employeeEmail && !/^\S+@\S+\.\S+$/.test(values.employeeEmail)) errors.employeeEmail = "Enter a valid email.";
  if (!MONTH_PATTERN.test(values.month.trim())) errors.month = 'Use a format like "October 2026".';

  (["baseSalary", "bonus", "deductions"] as const).forEach((key) => {
    const raw = values[key].trim();
    const parsed = Number(raw);
    if (key === "baseSalary" && raw === "") errors[key] = "Base salary is required.";
    else if (raw !== "" && (!Number.isFinite(parsed) || parsed < 0)) errors[key] = "Enter a non-negative number.";
  });

  const gross = Number(values.baseSalary || 0) + Number(values.bonus || 0);
  if (!errors.deductions && Number(values.deductions || 0) > gross) errors.deductions = "Deductions exceed gross pay.";
  return errors;
}

type FieldDef = { key: keyof SalaryFormValues; label: string; type: string; placeholder: string; inputMode?: "decimal" };

const FIELDS: FieldDef[] = [
  { key: "employeeName", label: "Employee name", type: "text", placeholder: "Jane Doe" },
  { key: "employeeEmail", label: "Employee email", type: "email", placeholder: "jane@company.com" },
  { key: "month", label: "Month", type: "text", placeholder: "October 2026" },
  { key: "baseSalary", label: "Base salary", type: "text", placeholder: "0.00", inputMode: "decimal" },
  { key: "bonus", label: "Bonus", type: "text", placeholder: "0.00", inputMode: "decimal" },
  { key: "deductions", label: "Deductions", type: "text", placeholder: "0.00", inputMode: "decimal" }
];

export function SalaryFormFields({ values, errors = {}, onChange, disabled = false }: SalaryFormFieldsProps) {
  const base = Number(values.baseSalary) || 0;
  const bonus = Number(values.bonus) || 0;
  const deductions = Number(values.deductions) || 0;
  const net = calculateNet(base, bonus, deductions);

  const handle = (key: keyof SalaryFormValues) => (event: ChangeEvent<HTMLInputElement>) =>
    onChange({ ...values, [key]: event.target.value });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map((field) => {
          const error = errors[field.key];
          return (
            <label key={field.key} className="block text-sm font-medium text-slate-300">
              {field.label}
              <input
                type={field.type}
                inputMode={field.inputMode}
                value={values[field.key]}
                onChange={handle(field.key)}
                placeholder={field.placeholder}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                className={`mt-2 w-full rounded-2xl border bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500/30 ${error ? "border-rose-400/60" : "border-white/10 focus:border-violet-400/60"}`}
              />
              {error ? <span className="mt-1 block text-xs text-rose-300">{error}</span> : null}
            </label>
          );
        })}
      </div>

      <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4 text-sm" aria-live="polite">
        <div className="flex justify-between text-slate-300">
          <span>Gross pay</span>
          <span>{formatCurrency(base + bonus)}</span>
        </div>
        <div className="mt-1 flex justify-between text-slate-400">
          <span>Estimated tax (reference only)</span>
          <span>{formatCurrency(estimateTax(base + bonus))}</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-white/10 pt-3 text-base font-bold text-violet-200">
          <span>Net salary</span>
          <span>{formatCurrency(net)}</span>
        </div>
      </div>
    </div>
  );
}
