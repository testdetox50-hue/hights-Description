"use client";

import { useEffect, useState, type ReactNode } from "react";

import { EmployeeAvatar } from "./EmployeeAvatar";
import { EmployeeJoinDateInfo } from "./EmployeeJoinDateInfo";
import { EmployeeRoleBadge, ExperienceBadge } from "./EmployeeRoleBadge";
import type { Employee } from "./employeeTypes";

type EmployeeDetailPanelProps = {
  employee: Employee | null;
  onClose?: () => void;
};

type FieldProps = {
  label: string;
  children: ReactNode;
};

function Field({ label, children }: FieldProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <div className="mt-2 break-words text-sm text-slate-200">{children}</div>
    </div>
  );
}

export function EmployeeDetailPanel({ employee, onClose }: EmployeeDetailPanelProps) {
  // Remember which employee's email was copied so the label resets when the selection changes.
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copied = copiedId !== null && copiedId === employee?.id;

  useEffect(() => {
    if (!onClose) {
      return undefined;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!employee) {
    return (
      <aside className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
        Select an employee to see their full profile.
      </aside>
    );
  }

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(employee.email);
      setCopiedId(employee.id);
    } catch {
      setCopiedId(null);
    }
  };

  return (
    <aside className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <EmployeeAvatar name={employee.fullName} imageUrl={employee.profileImage} size="xl" />
          <div>
            <h2 className="text-2xl font-bold text-white">{employee.fullName}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              <EmployeeRoleBadge role={employee.role} />
              <ExperienceBadge level={employee.experienceLevel} />
            </div>
          </div>
        </div>
        {onClose ? (
          <button type="button" onClick={onClose} aria-label="Close details" className="rounded-xl border border-white/10 px-3 py-1 text-sm text-slate-300 hover:bg-white/10">
            Close
          </button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email">
          <div className="flex items-center justify-between gap-3">
            <span>{employee.email || "Not provided"}</span>
            {employee.email ? (
              <button type="button" onClick={() => void copyEmail()} className="shrink-0 text-xs font-semibold text-violet-300 hover:text-violet-200">
                {copied ? "Copied" : "Copy"}
              </button>
            ) : null}
          </div>
        </Field>
        <Field label="Phone">
          {employee.phoneNumber ? (
            <a href={`tel:${employee.phoneNumber}`} className="hover:text-violet-300">
              {employee.phoneNumber}
            </a>
          ) : (
            "Not provided"
          )}
        </Field>
        <Field label="Education">{employee.education || "Not provided"}</Field>
        <Field label="Address">{employee.address || "Not provided"}</Field>
      </div>

      <Field label="Employment">
        <EmployeeJoinDateInfo joiningDate={employee.joiningDate} />
      </Field>
    </aside>
  );
}
