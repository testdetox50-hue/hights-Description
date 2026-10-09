"use client";

import { useEffect, useMemo, useState } from "react";

import { OfficeShell, SurfaceCard } from "@/src/components/office/OfficeShell";
import { api, getStoredAuth } from "@/src/services/api/client";
import { filterByMonthLabel, monthInputToLabel, monthInputValue, summarizeMonth } from "@/src/utils/attendanceMonth";

type AttendanceRow = {
  _id: string;
  employeeName: string;
  employeeEmail: string;
  workDate: string;
  checkInAt: string | null;
  checkOutAt: string | null;
  workedMinutes: number;
  status: "In Progress" | "Present" | "Half Day" | "Missed";
};

type AttendanceSummary = {
  totalDays: number;
  presentDays: number;
  halfDays: number;
  inProgress: number;
};

const emptySummary: AttendanceSummary = {
  totalDays: 0,
  presentDays: 0,
  halfDays: 0,
  inProgress: 0
};

function formatTime(value: string | null) {
  if (!value) {
    return "--";
  }

  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatHours(minutes: number) {
  return `${(minutes / 60).toFixed(1)} hrs`;
}

export default function AttendancePage() {
  const auth = useMemo(() => getStoredAuth(), []);
  const isAdmin = auth?.user?.role === "admin";
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>(emptySummary);
  const [busyAction, setBusyAction] = useState<"check-in" | "check-out" | null>(null);
  const [demoBusy, setDemoBusy] = useState(false);
  const [demoCount, setDemoCount] = useState(400);
  const [notice, setNotice] = useState("");
  const [month, setMonth] = useState(() => monthInputValue(new Date()));

  const loadAttendance = async () => {
    try {
      const [rowsResponse, summaryResponse] = await Promise.all([
        api<{ items: AttendanceRow[] }>("/attendance"),
        api<{ data: AttendanceSummary }>("/attendance/summary")
      ]);

      setRows(Array.isArray(rowsResponse.items) ? rowsResponse.items : []);
      setSummary(summaryResponse.data || emptySummary);
    } catch {
      setRows([]);
      setSummary(emptySummary);
    }
  };

  useEffect(() => {
    if (!auth?.token) {
      return;
    }

    void loadAttendance();
  }, [auth?.token]);

  const handleAttendanceAction = async (path: "/attendance/check-in" | "/attendance/check-out", action: "check-in" | "check-out") => {
    try {
      setBusyAction(action);
      const response = await api<{ message: string }>(path, { method: "POST" });
      console.info(response.message);
      await loadAttendance();
    } catch (error) {
      console.info(error instanceof Error ? error.message : "Attendance action failed");
    } finally {
      setBusyAction(null);
    }
  };

  const runDemoData = async (method: "POST" | "DELETE") => {
    const prompt =
      method === "POST"
        ? `Insert ${demoCount} demo employees and about ${(demoCount * 22).toLocaleString()} attendance records into the database?`
        : "Delete every employee and attendance record with a @demo.staffhub.local email?";
    if (!window.confirm(prompt)) {
      return;
    }

    try {
      setDemoBusy(true);
      const response = await api<{ message: string }>("/demo-data", {
        method,
        ...(method === "POST" ? { body: JSON.stringify({ count: demoCount }) } : {})
      });
      setNotice(response.message);
      await loadAttendance();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Demo data request failed");
    } finally {
      setDemoBusy(false);
    }
  };

  const deleteAttendance = async (id: string) => {
    try {
      const response = await api<{ message: string }>(`/attendance/${id}`, {
        method: "DELETE"
      });
      console.info(response.message);
      await loadAttendance();
    } catch (error) {
      console.info(error instanceof Error ? error.message : "Attendance delete failed");
    }
  };

  const monthRows = useMemo(() => filterByMonthLabel(rows, monthInputToLabel(month)), [rows, month]);
  const monthSummary = useMemo(() => summarizeMonth(monthRows), [monthRows]);
  const stats = [
    { label: "Attendance Days", value: monthSummary.totalDays },
    { label: "Present", value: monthSummary.presentDays },
    { label: "Half Day", value: monthSummary.halfDays },
    { label: "Hours Worked", value: formatHours(monthSummary.totalMinutes) }
  ];

  return (
    <OfficeShell
      title="Attendance"
      subtitle={isAdmin ? "Admins can review office-wide attendance, timing patterns, and half-day history across the team." : "Track your morning check-in, evening check-out, and working hours from one place."}
      actions={
        !isAdmin ? (
          <>
            <button
              type="button"
              onClick={() => void handleAttendanceAction("/attendance/check-in", "check-in")}
              disabled={busyAction !== null}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "check-in" ? "Checking in..." : "Morning Check-in"}
            </button>
            <button
              type="button"
              onClick={() => void handleAttendanceAction("/attendance/check-out", "check-out")}
              disabled={busyAction !== null}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-violet-400/30 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busyAction === "check-out" ? "Checking out..." : "Evening Check-out"}
            </button>
          </>
        ) : (
          <>
            <input
              type="number"
              min={1}
              max={1000}
              value={demoCount}
              onChange={(event) => setDemoCount(Math.min(1000, Math.max(1, Number(event.target.value) || 1)))}
              aria-label="Number of demo employees"
              className="w-24 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
            />
            <button
              type="button"
              onClick={() => void runDemoData("POST")}
              disabled={demoBusy}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(124,58,237,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {demoBusy ? "Working..." : `Load ${demoCount} demo employees`}
            </button>
            <button
              type="button"
              onClick={() => void runDemoData("DELETE")}
              disabled={demoBusy}
              className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Remove demo data
            </button>
          </>
        )
      }
    >
      {notice ? <div role="status" className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200">{notice}</div> : null}

      <div className="grid gap-5 lg:grid-cols-4">
        {stats.map((item) => (
          <SurfaceCard key={item.label}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">{item.label}</p>
            <div className="mt-4 text-3xl font-black tracking-tight text-white">{item.value}</div>
          </SurfaceCard>
        ))}
      </div>

      <SurfaceCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">Attendance ledger</p>
            <h2 className="mt-2 text-2xl font-bold text-white">{isAdmin ? "Office attendance history" : "My attendance history"}</h2>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="month"
              value={month}
              max={monthInputValue(new Date())}
              onChange={(event) => event.target.value && setMonth(event.target.value)}
              aria-label="Select month"
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 [color-scheme:dark]"
            />
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">{monthRows.length} records</div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10 text-left">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.22em] text-slate-400">
                <tr>
                  {isAdmin ? <th className="px-5 py-4">Employee</th> : null}
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Check-in</th>
                  <th className="px-5 py-4">Check-out</th>
                  <th className="px-5 py-4">Hours</th>
                  <th className="px-5 py-4">Status</th>
                  {isAdmin ? <th className="px-5 py-4 text-right">Action</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 bg-slate-950/40 text-sm text-slate-200">
                {monthRows.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="px-5 py-14 text-center text-slate-400">No attendance records for {monthInputToLabel(month)}.</td>
                  </tr>
                ) : (
                  monthRows.map((row) => (
                    <tr key={row._id} className="hover:bg-white/[0.03]">
                      {isAdmin ? (
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{row.employeeName}</div>
                          <div className="mt-1 text-sm text-slate-400">{row.employeeEmail}</div>
                        </td>
                      ) : null}
                      <td className="px-5 py-4">{new Date(row.workDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4">{formatTime(row.checkInAt)}</td>
                      <td className="px-5 py-4">{formatTime(row.checkOutAt)}</td>
                      <td className="px-5 py-4">{formatHours(row.workedMinutes)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                            row.status === "Present"
                              ? "border border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
                              : row.status === "Half Day"
                                ? "border border-amber-400/20 bg-amber-500/10 text-amber-200"
                                : "border border-sky-400/20 bg-sky-500/10 text-sky-200"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      {isAdmin ? (
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => void deleteAttendance(row._id)}
                            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-rose-200 hover:bg-rose-500/20"
                          >
                            Delete
                          </button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </SurfaceCard>
    </OfficeShell>
  );
}

