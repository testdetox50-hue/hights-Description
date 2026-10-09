"use client";

import { useState } from "react";

import { calculateTotals } from "./salaryCalculations";
import type { SalarySlip } from "./salaryTypes";

type SalaryExportButtonProps = {
  rows: SalarySlip[];
  filename?: string;
  label?: string;
  includeTotals?: boolean;
  className?: string;
};

const HEADERS = ["Employee", "Email", "Month", "Base salary", "Bonus", "Deductions", "Net salary"] as const;

/** Escapes a value for CSV and neutralises spreadsheet formula injection. */
export function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text) && typeof value === "string") {
    text = `'${text}`;
  }
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildSalaryCsv(rows: SalarySlip[], includeTotals = true): string {
  const lines: Array<Array<string | number>> = [
    [...HEADERS],
    ...rows.map((row) => [row.employeeName, row.employeeEmail ?? "", row.month, row.baseSalary, row.bonus, row.deductions, row.netSalary])
  ];

  if (includeTotals && rows.length > 0) {
    const totals = calculateTotals(rows);
    lines.push(["Total", "", `${totals.slips} slips`, totals.base, totals.bonus, totals.deductions, totals.net]);
  }

  return lines.map((line) => line.map(escapeCsvCell).join(",")).join("\r\n");
}

export function SalaryExportButton({
  rows,
  filename = "salary-report",
  label = "Export CSV",
  includeTotals = true,
  className
}: SalaryExportButtonProps) {
  const [message, setMessage] = useState("");

  const handleExport = () => {
    if (rows.length === 0) {
      setMessage("Nothing to export.");
      return;
    }

    const csv = `﻿${buildSalaryCsv(rows, includeTotals)}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `${filename}-${stamp}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${rows.length} slips.`);
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleExport}
        className={className ?? "rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-violet-200 hover:bg-white/10"}
      >
        {label}
      </button>
      <span className="min-h-4 text-xs text-slate-400" role="status">{message}</span>
    </div>
  );
}
