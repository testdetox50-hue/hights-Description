"use client";

import { formatCurrency, estimateTax } from "./salaryCalculations";
import type { SalarySlip } from "./salaryTypes";

type PayslipDocumentProps = {
  slip: SalarySlip;
  companyName?: string;
  onClose?: () => void;
  showPrintButton?: boolean;
};

type Line = { label: string; amount: number; kind: "earning" | "deduction" };

export function PayslipDocument({ slip, companyName = "StaffHub", onClose, showPrintButton = true }: PayslipDocumentProps) {
  const gross = slip.baseSalary + slip.bonus;
  const lines: Line[] = [
    { label: "Base salary", amount: slip.baseSalary, kind: "earning" },
    { label: "Bonus", amount: slip.bonus, kind: "earning" },
    { label: "Deductions", amount: slip.deductions, kind: "deduction" }
  ];
  const reference = `${slip._id.slice(-6).toUpperCase()}-${slip.month.replace(/\s+/g, "").toUpperCase()}`;
  const issued = slip.createdAt && !Number.isNaN(Date.parse(slip.createdAt)) ? new Date(slip.createdAt).toLocaleDateString("en-US", { dateStyle: "long" }) : "-";

  return (
    <section className="mx-auto w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-950 p-8 text-slate-200 print:max-w-none print:rounded-none print:border-0 print:bg-white print:p-0 print:text-black">
      <header className="flex items-start justify-between border-b border-white/10 pb-5 print:border-black/20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80 print:text-black">{companyName}</p>
          <h1 className="mt-2 text-2xl font-bold text-white print:text-black">Payslip</h1>
          <p className="text-sm text-slate-400 print:text-black">{slip.month}</p>
        </div>
        <dl className="text-right text-xs text-slate-400 print:text-black">
          <dt className="uppercase tracking-widest">Reference</dt>
          <dd className="font-mono text-sm text-slate-200 print:text-black">{reference}</dd>
          <dt className="mt-2 uppercase tracking-widest">Issued</dt>
          <dd className="text-sm text-slate-200 print:text-black">{issued}</dd>
        </dl>
      </header>

      <div className="mt-5 text-sm">
        <p className="text-xs uppercase tracking-widest text-slate-400 print:text-black">Employee</p>
        <p className="mt-1 text-lg font-semibold text-white print:text-black">{slip.employeeName}</p>
        {slip.employeeEmail ? <p className="text-slate-400 print:text-black">{slip.employeeEmail}</p> : null}
      </div>

      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-widest text-slate-400 print:border-black/20 print:text-black">
            <th className="py-2">Description</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.label} className="border-b border-white/5 print:border-black/10">
              <td className="py-3">{line.label}</td>
              <td className="py-3 text-right">{line.kind === "deduction" ? "- " : ""}{formatCurrency(line.amount)}</td>
            </tr>
          ))}
          <tr>
            <td className="pt-3 text-slate-400 print:text-black">Gross pay</td>
            <td className="pt-3 text-right">{formatCurrency(gross)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="text-lg font-bold text-violet-200 print:text-black">
            <td className="pt-4">Net salary</td>
            <td className="pt-4 text-right">{formatCurrency(slip.netSalary)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-6 text-xs text-slate-500 print:text-black">
        Tax reference estimate: {formatCurrency(estimateTax(gross))}. This is informational and not a statutory tax statement.
      </p>

      <div className="mt-8 flex justify-end gap-3 print:hidden">
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-200">Close</button>
        ) : null}
        {showPrintButton ? (
          <button type="button" onClick={() => window.print()} className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white">Print / Save PDF</button>
        ) : null}
      </div>
    </section>
  );
}
