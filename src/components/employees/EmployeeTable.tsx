"use client";

import { useState } from "react";

import { EmployeeAvatar } from "./EmployeeAvatar";
import { EmployeeJoinDateInfo } from "./EmployeeJoinDateInfo";
import { EmployeeRoleBadge, ExperienceBadge } from "./EmployeeRoleBadge";
import type { Employee } from "./employeeTypes";

type EmployeeTableProps = {
  employees: Employee[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => Promise<unknown> | void;
};

const HEADERS = ["Employee", "Role", "Education", "Experience", "Joining Date"];

export function EmployeeTable({ employees, loading = false, selectedId = null, onSelect, onDelete }: EmployeeTableProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleDelete = async (employee: Employee) => {
    if (!onDelete || !window.confirm(`Delete ${employee.fullName}? This cannot be undone.`)) {
      return;
    }
    setPendingId(employee.id);
    try {
      await onDelete(employee);
    } finally {
      setPendingId(null);
    }
  };

  const emptyMessage = loading ? "Loading employees..." : "No employees found.";

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-left">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.22em] text-slate-400">
            <tr>
              {HEADERS.map((header) => (
                <th key={header} scope="col" className="px-5 py-4">
                  {header}
                </th>
              ))}
              {onDelete ? <th scope="col" className="px-5 py-4 text-right">Action</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={HEADERS.length + 1} className="px-5 py-10 text-center text-slate-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr
                  key={employee.id}
                  onClick={() => onSelect?.(employee)}
                  className={`cursor-pointer transition hover:bg-white/[0.04] ${employee.id === selectedId ? "bg-violet-500/10" : ""}`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <EmployeeAvatar name={employee.fullName} imageUrl={employee.profileImage} size="md" />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">{employee.fullName}</p>
                        <p className="truncate text-xs text-slate-400">{employee.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4"><EmployeeRoleBadge role={employee.role} /></td>
                  <td className="px-5 py-4 text-sm text-slate-300">{employee.education || "-"}</td>
                  <td className="px-5 py-4"><ExperienceBadge level={employee.experienceLevel} /></td>
                  <td className="px-5 py-4"><EmployeeJoinDateInfo joiningDate={employee.joiningDate} layout="inline" /></td>
                  {onDelete ? (
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={pendingId === employee.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDelete(employee);
                        }}
                        className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:opacity-50"
                      >
                        {pendingId === employee.id ? "Deleting..." : "Delete"}
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
  );
}
