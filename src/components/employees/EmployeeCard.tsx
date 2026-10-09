import { EmployeeAvatar } from "./EmployeeAvatar";
import { EmployeeJoinDateInfo } from "./EmployeeJoinDateInfo";
import { EmployeeRoleBadge, ExperienceBadge } from "./EmployeeRoleBadge";
import type { Employee } from "./employeeTypes";

type EmployeeCardProps = {
  employee: Employee;
  selected?: boolean;
  onSelect?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
};

export function EmployeeCard({ employee, selected = false, onSelect, onDelete }: EmployeeCardProps) {
  const ring = selected
    ? "border-violet-400/60 shadow-[0_12px_40px_rgba(124,58,237,0.3)]"
    : "border-white/10 hover:border-violet-400/30";

  return (
    <article
      className={`group relative rounded-3xl border bg-white/[0.04] p-5 transition hover:-translate-y-0.5 ${ring}`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(employee)}
        aria-pressed={selected}
        className="flex w-full items-center gap-4 text-left"
      >
        <EmployeeAvatar name={employee.fullName} imageUrl={employee.profileImage} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-white">{employee.fullName}</h3>
          <p className="truncate text-sm text-slate-400">{employee.email || "No email on file"}</p>
        </div>
      </button>

      <div className="mt-4 flex flex-wrap gap-2">
        <EmployeeRoleBadge role={employee.role} />
        <ExperienceBadge level={employee.experienceLevel} />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Joined</dt>
          <dd className="mt-1">
            <EmployeeJoinDateInfo joiningDate={employee.joiningDate} />
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-[0.18em] text-slate-500">Education</dt>
          <dd className="mt-1 text-slate-200">{employee.education || "Not provided"}</dd>
        </div>
      </dl>

      {onDelete ? (
        <button
          type="button"
          onClick={() => onDelete(employee)}
          aria-label={`Delete ${employee.fullName}`}
          className="absolute right-4 top-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200 opacity-0 transition hover:bg-rose-500/20 focus:opacity-100 group-hover:opacity-100"
        >
          Delete
        </button>
      ) : null}
    </article>
  );
}

type EmployeeCardGridProps = {
  employees: Employee[];
  selectedId?: string | null;
  onSelect?: (employee: Employee) => void;
  onDelete?: (employee: Employee) => void;
};

export function EmployeeCardGrid({ employees, selectedId = null, onSelect, onDelete }: EmployeeCardGridProps) {
  if (employees.length === 0) {
    return <p className="rounded-3xl border border-dashed border-white/10 p-10 text-center text-slate-400">No employees match.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          selected={employee.id === selectedId}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
