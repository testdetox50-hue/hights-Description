"use client";

import { type FormEvent, useMemo, useState } from "react";

import { api } from "@/src/services/api/client";
import { countWorkingDays, findOverlap, getBucket, hasEnoughBalance, isEndBeforeStart } from "./leaveCalculations";
import type { LeaveBalance, LeaveRequest, LeaveType } from "./leaveTypes";
import { LEAVE_TYPES, LEAVE_TYPE_LABELS } from "./leaveTypes";

interface LeaveApplyFormProps {
  existingLeaves?: LeaveRequest[];
  balances?: LeaveBalance[];
  defaultEmployeeName?: string;
  onSubmitted?: (message: string) => void;
  onCancel?: () => void;
}

export type LeaveFormErrors = Partial<Record<"employeeName" | "startDate" | "endDate" | "reason" | "balance", string>>;

export interface LeaveFormValues {
  employeeName: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export function validateLeaveForm(values: LeaveFormValues, leaves: LeaveRequest[], balances: LeaveBalance[]): LeaveFormErrors {
  const errors: LeaveFormErrors = {};
  const days = countWorkingDays(values.startDate, values.endDate);
  if (!values.employeeName.trim()) errors.employeeName = "Employee name is required.";
  if (!values.startDate) errors.startDate = "Choose a start date.";
  if (!values.endDate) errors.endDate = "Choose an end date.";
  if (isEndBeforeStart(values.startDate, values.endDate)) errors.endDate = "End date must be on or after the start date.";
  if (values.reason.trim().length < 5) errors.reason = "Please give a reason (at least 5 characters).";

  if (values.startDate && values.endDate && !errors.endDate) {
    if (days === 0) errors.endDate = "The selected range only contains weekends.";
    const clash = findOverlap(leaves, values.employeeName, values.startDate, values.endDate);
    if (clash) errors.startDate = `Overlaps an existing ${clash.status.toLowerCase()} request.`;
    const balance = balances.find((item) => item.employeeName.trim().toLowerCase() === values.employeeName.trim().toLowerCase());
    const bucket = getBucket(balance, values.leaveType);
    if (balance && !hasEnoughBalance(values.leaveType, bucket, days)) {
      errors.balance = `Only ${bucket?.remaining ?? 0} ${values.leaveType.toLowerCase()} day(s) left, but ${days} requested.`;
    }
  }
  return errors;
}

const FIELD = "h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-white outline-none placeholder:text-slate-500 focus:border-violet-400/40 focus:bg-white/[0.07]";
const LABEL = "mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-400";

export function LeaveApplyForm({ existingLeaves = [], balances = [], defaultEmployeeName = "", onSubmitted, onCancel }: LeaveApplyFormProps) {
  const [values, setValues] = useState<LeaveFormValues>({ employeeName: defaultEmployeeName, leaveType: "Casual", startDate: "", endDate: "", reason: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const errors = useMemo(() => validateLeaveForm(values, existingLeaves, balances), [values, existingLeaves, balances]);
  const days = countWorkingDays(values.startDate, values.endDate);
  const set = <K extends keyof LeaveFormValues>(key: K, value: LeaveFormValues[K]) => setValues((prev) => ({ ...prev, [key]: value }));
  const show = (key: keyof LeaveFormErrors) => (submitted && errors[key] ? <p className="mt-1 text-xs text-rose-300">{errors[key]}</p> : null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    setServerError("");
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const data = await api<{ message?: string }>("/leaves/apply", { method: "POST", body: JSON.stringify(values) });
      onSubmitted?.(data.message || "Leave request submitted successfully");
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Leave request failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-5 md:grid-cols-2">
      <label className="block text-sm text-slate-300">
        <span className={LABEL}>Employee Name</span>
        <input value={values.employeeName} onChange={(e) => set("employeeName", e.target.value)} className={FIELD} placeholder="Rishi Attri" />
        {show("employeeName")}
      </label>
      <label className="block text-sm text-slate-300">
        <span className={LABEL}>Leave Type</span>
        <select value={values.leaveType} onChange={(e) => set("leaveType", e.target.value as LeaveType)} className={FIELD}>
          {LEAVE_TYPES.map((type) => <option key={type} className="bg-slate-950" value={type}>{LEAVE_TYPE_LABELS[type]}</option>)}
        </select>
      </label>
      <label className="block text-sm text-slate-300">
        <span className={LABEL}>Start Date</span>
        <input type="date" value={values.startDate} onChange={(e) => set("startDate", e.target.value)} className={FIELD} />
        {show("startDate")}
      </label>
      <label className="block text-sm text-slate-300">
        <span className={LABEL}>End Date</span>
        <input type="date" min={values.startDate || undefined} value={values.endDate} onChange={(e) => set("endDate", e.target.value)} className={FIELD} />
        {show("endDate")}
      </label>
      <label className="block text-sm text-slate-300 md:col-span-2">
        <span className={LABEL}>Reason</span>
        <textarea value={values.reason} onChange={(e) => set("reason", e.target.value)} className="min-h-[120px] w-full rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white outline-none focus:border-violet-400/40" placeholder="Family event, health rest..." />
        {show("reason")}
      </label>
      <div className="md:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300" role="status">
        Working days requested: <strong className="text-white">{days}</strong> (weekends excluded)
        {show("balance")}
      </div>
      {serverError ? <p className="md:col-span-2 text-sm text-rose-300">{serverError}</p> : null}
      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button type="submit" disabled={submitting} className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {submitting ? "Submitting..." : "Submit Leave"}
        </button>
        {onCancel ? <button type="button" onClick={onCancel} className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200">Cancel</button> : null}
      </div>
    </form>
  );
}

export default LeaveApplyForm;
