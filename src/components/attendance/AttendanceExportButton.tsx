"use client";

import { useState } from "react";

import { toDateKey } from "./attendanceTypes";
import type { AttendanceRecord } from "./attendanceTypes";

type AttendanceExportButtonProps = {
  rows: AttendanceRecord[];
  filename?: string;
  includeEmployee?: boolean;
  label?: string;
  className?: string;
};

const CSV_HEADERS = ["Employee", "Email", "Date", "Check-in", "Check-out", "Hours", "Status"] as const;

// Quote fields containing separators/quotes/newlines and neutralise spreadsheet formulas.
export function escapeCsvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@]/.test(text) && Number.isNaN(Number(text))) {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function timeCell(value: string | null) {
  return value ? new Date(value).toTimeString().slice(0, 5) : "";
}

export function attendanceToCsv(rows: AttendanceRecord[], includeEmployee = true): string {
  const headers = CSV_HEADERS.filter((header) => includeEmployee || (header !== "Employee" && header !== "Email"));
  const lines = rows.map((row) => {
    const cells: (string | number)[] = [];
    if (includeEmployee) {
      cells.push(row.employeeName, row.employeeEmail);
    }
    cells.push(toDateKey(row.workDate), timeCell(row.checkInAt), timeCell(row.checkOutAt), (row.workedMinutes / 60).toFixed(2), row.status);
    return cells.map(escapeCsvCell).join(",");
  });
  return [headers.join(","), ...lines].join("\r\n");
}

export default function AttendanceExportButton({ rows, filename, includeEmployee = true, label = "Export CSV", className = "" }: AttendanceExportButtonProps) {
  const [error, setError] = useState("");

  const handleExport = () => {
    try {
      setError("");
      // BOM keeps Excel from mangling non-ASCII employee names.
      const blob = new Blob(["﻿", attendanceToCsv(rows, includeEmployee)], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename ?? `attendance-${toDateKey(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError("Export failed. Please try again.");
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={rows.length === 0}
        className={`rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-violet-400/30 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      >
        {label} ({rows.length})
      </button>
      {error ? <span role="alert" className="text-xs text-rose-300">{error}</span> : null}
    </div>
  );
}
