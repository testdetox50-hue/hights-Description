"use client";

import { useState } from "react";

import { api } from "@/src/services/api/client";
import type { LeaveRequest, LeaveRole, LeaveStatus } from "./leaveTypes";

export type LeaveAction = "Approved" | "Rejected" | "Cancelled";

interface ActionConfig {
  action: LeaveAction;
  label: string;
  className: string;
  adminOnly: boolean;
}

const ACTIONS: ActionConfig[] = [
  { action: "Approved", label: "Approve", adminOnly: true, className: "bg-emerald-500/12 text-emerald-200 hover:bg-emerald-500/22" },
  { action: "Rejected", label: "Reject", adminOnly: true, className: "bg-rose-500/12 text-rose-200 hover:bg-rose-500/22" },
  { action: "Cancelled", label: "Cancel", adminOnly: false, className: "bg-amber-500/12 text-amber-200 hover:bg-amber-500/22" }
];

/** Which actions a role may take on a leave in the given status. Only pending leaves are actionable. */
export function getAvailableActions(status: LeaveStatus, role: LeaveRole): ActionConfig[] {
  if (status !== "Pending") return [];
  return ACTIONS.filter((item) => role === "admin" || !item.adminOnly);
}

export async function updateLeaveStatus(id: string, status: LeaveAction): Promise<string> {
  const data = await api<{ message?: string }>(`/leaves/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status })
  });
  return data.message || `Leave ${status.toLowerCase()}.`;
}

interface LeaveActionButtonsProps {
  leave: Pick<LeaveRequest, "_id" | "status" | "employeeName">;
  role: LeaveRole;
  /** Called after a successful update so the parent can reload its data. */
  onUpdated?: (message: string, leaveId: string) => void;
  onError?: (message: string, leaveId: string) => void;
  /** Ask for confirmation before destructive actions (reject/cancel). */
  confirmDestructive?: boolean;
}

export function LeaveActionButtons({ leave, role, onUpdated, onError, confirmDestructive = true }: LeaveActionButtonsProps) {
  const [busy, setBusy] = useState<LeaveAction | null>(null);
  const available = getAvailableActions(leave.status, role);

  if (available.length === 0) {
    return <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Locked</span>;
  }

  const run = async (action: LeaveAction) => {
    const destructive = action !== "Approved";
    if (confirmDestructive && destructive && typeof window !== "undefined") {
      const verb = action === "Rejected" ? "reject" : "cancel";
      if (!window.confirm(`Are you sure you want to ${verb} the leave for ${leave.employeeName}?`)) return;
    }

    setBusy(action);
    try {
      const message = await updateLeaveStatus(leave._id, action);
      onUpdated?.(message, leave._id);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Leave update failed", leave._id);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {available.map((item) => (
        <button
          key={item.action}
          type="button"
          disabled={busy !== null}
          onClick={() => void run(item.action)}
          aria-label={`${item.label} leave for ${leave.employeeName}`}
          className={`rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition disabled:cursor-not-allowed disabled:opacity-50 ${item.className}`}
        >
          {busy === item.action ? "Working..." : item.label}
        </button>
      ))}
    </div>
  );
}

export default LeaveActionButtons;
