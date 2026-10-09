"use client";

import { useMemo, useState } from "react";

import { formatCurrency, sortSalaries } from "./salaryCalculations";
import type { SalarySlip, SortDirection, SortKey } from "./salaryTypes";

type SalaryTableProps = {
  rows: SalarySlip[];
  showEmployee?: boolean;
  pageSize?: number;
  onSelect?: (slip: SalarySlip) => void;
};

type Column = { key: SortKey; label: string; numeric: boolean };

const COLUMNS: Column[] = [
  { key: "employeeName", label: "Employee", numeric: false },
  { key: "month", label: "Month", numeric: false },
  { key: "baseSalary", label: "Base", numeric: true },
  { key: "bonus", label: "Bonus", numeric: true },
  { key: "deductions", label: "Deductions", numeric: true },
  { key: "netSalary", label: "Net", numeric: true }
];

export function SalaryTable({ rows, showEmployee = true, pageSize = 10, onSelect }: SalaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("month");
  const [direction, setDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(0);

  const columns = showEmployee ? COLUMNS : COLUMNS.filter((column) => column.key !== "employeeName");
  const sorted = useMemo(() => sortSalaries(rows, sortKey, direction), [rows, sortKey, direction]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDirection("desc");
    }
    setPage(0);
  };

  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">No salary slips match the current filters.</p>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-200">
          <thead className="bg-white/5 text-xs uppercase tracking-[0.16em] text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 ${column.numeric ? "text-right" : ""}`} aria-sort={column.key === sortKey ? (direction === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => toggleSort(column.key)} className="font-semibold uppercase tracking-[0.16em] hover:text-violet-200">
                    {column.label}
                    {column.key === sortKey ? (direction === "asc" ? " ▲" : " ▼") : ""}
                  </button>
                </th>
              ))}
              {onSelect ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {visible.map((row) => (
              <tr key={row._id} className="hover:bg-white/5">
                {showEmployee ? <td className="px-4 py-3 font-medium text-white">{row.employeeName}</td> : null}
                <td className="px-4 py-3">{row.month}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(row.baseSalary)}</td>
                <td className="px-4 py-3 text-right text-emerald-300">{formatCurrency(row.bonus)}</td>
                <td className="px-4 py-3 text-right text-rose-300">{formatCurrency(row.deductions)}</td>
                <td className="px-4 py-3 text-right font-bold text-violet-200">{formatCurrency(row.netSalary)}</td>
                {onSelect ? (
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => onSelect(row)} className="text-xs font-semibold text-violet-300 hover:text-violet-100">View</button>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-xs text-slate-400">
        <span>{sorted.length} slips, page {safePage + 1} of {pageCount}</span>
        <div className="flex gap-2">
          <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="rounded-xl border border-white/10 px-3 py-1 disabled:opacity-40">Prev</button>
          <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className="rounded-xl border border-white/10 px-3 py-1 disabled:opacity-40">Next</button>
        </div>
      </footer>
    </div>
  );
}
