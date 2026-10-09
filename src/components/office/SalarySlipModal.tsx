"use client";

import { useEffect, useMemo, useState } from "react";

import { api } from "@/src/services/api/client";
import { filterByMonthLabel, summarizeMonth, type MonthAttendanceRow } from "@/src/utils/attendanceMonth";

export type SalarySlipData = {
  employeeName: string;
  employeeEmail?: string;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
};

type AttendanceItem = MonthAttendanceRow & { employeeEmail?: string; employeeName?: string };

export function SalarySlipModal({ slip, isAdmin, onClose }: { slip: SalarySlipData; isAdmin: boolean; onClose: () => void }) {
  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api<{ items: AttendanceItem[] }>("/attendance");
        setAttendance(Array.isArray(response.items) ? response.items : []);
      } catch {
        setAttendance([]);
      }
    };

    void load();
  }, []);

  const summary = useMemo(() => {
    const own = isAdmin
      ? attendance.filter((row) => (slip.employeeEmail ? row.employeeEmail === slip.employeeEmail : row.employeeName === slip.employeeName))
      : attendance;
    return summarizeMonth(filterByMonthLabel(own, slip.month));
  }, [attendance, isAdmin, slip]);

  const money = (value: number) => `$${value.toLocaleString()}`;
  const lines = [
    { label: "Base salary", value: money(slip.baseSalary) },
    { label: "Bonus", value: `+ ${money(slip.bonus)}` },
    { label: "Deductions", value: `- ${money(slip.deductions)}` }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:static print:bg-white print:p-0">
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-8 text-slate-200 print:max-w-none print:border-0 print:bg-white print:text-black">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">Salary slip</p>
        <h2 className="mt-2 text-2xl font-bold text-white print:text-black">{slip.month}</h2>
        <p className="mt-1 text-sm text-slate-400">
          {slip.employeeName}
          {slip.employeeEmail ? ` · ${slip.employeeEmail}` : ""}
        </p>

        <div className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 text-sm">
          {lines.map((line) => (
            <div key={line.label} className="flex justify-between px-5 py-3">
              <span>{line.label}</span>
              <span>{line.value}</span>
            </div>
          ))}
          <div className="flex justify-between px-5 py-3 text-base font-bold text-violet-200 print:text-black">
            <span>Net salary</span>
            <span>{money(slip.netSalary)}</span>
          </div>
        </div>

        <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Attendance for the month</h3>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            { label: "Days", value: summary.totalDays },
            { label: "Present", value: summary.presentDays },
            { label: "Half day", value: summary.halfDays },
            { label: "Hours", value: (summary.totalMinutes / 60).toFixed(1) }
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/10 px-4 py-3">
              <div className="text-xs text-slate-400">{item.label}</div>
              <div className="mt-1 text-lg font-bold text-white print:text-black">{item.value}</div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end gap-3 print:hidden">
          <button type="button" onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-slate-200">
            Close
          </button>
          <button type="button" onClick={() => window.print()} className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2 text-sm font-semibold text-white">
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}
