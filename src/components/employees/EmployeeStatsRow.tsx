import { calculateTenure } from "./EmployeeJoinDateInfo";
import type { Employee } from "./employeeTypes";

type EmployeeStats = {
  total: number;
  experienced: number;
  freshers: number;
  roleCount: number;
  newThisMonth: number;
  averageTenureMonths: number;
};

export function computeEmployeeStats(employees: Employee[], now: Date = new Date()): EmployeeStats {
  const experienced = employees.filter((employee) => employee.experienceLevel === "Experienced").length;
  const roleCount = new Set(employees.map((employee) => employee.role)).size;

  let newThisMonth = 0;
  let tenureMonthsTotal = 0;
  let tenureSamples = 0;

  for (const employee of employees) {
    const tenure = calculateTenure(employee.joiningDate, now);
    if (!tenure) {
      continue;
    }
    tenureMonthsTotal += tenure.years * 12 + tenure.months;
    tenureSamples += 1;
    if (tenure.years === 0 && tenure.months === 0) {
      newThisMonth += 1;
    }
  }

  return {
    total: employees.length,
    experienced,
    freshers: employees.length - experienced,
    roleCount,
    newThisMonth,
    averageTenureMonths: tenureSamples > 0 ? Math.round(tenureMonthsTotal / tenureSamples) : 0
  };
}

function formatMonths(months: number): string {
  if (months < 12) {
    return `${months} mo`;
  }
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest > 0 ? `${years}y ${rest}m` : `${years} yr`;
}

type StatTileProps = {
  label: string;
  value: string;
  hint: string;
};

function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-violet-300/80">{hint}</p>
    </div>
  );
}

type EmployeeStatsRowProps = {
  employees: Employee[];
  loading?: boolean;
};

export function EmployeeStatsRow({ employees, loading = false }: EmployeeStatsRowProps) {
  const stats = computeEmployeeStats(employees);
  const placeholder = loading ? "--" : null;
  const share = stats.total > 0 ? Math.round((stats.experienced / stats.total) * 100) : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile label="Total staff" value={placeholder ?? String(stats.total)} hint={`${stats.roleCount} distinct roles`} />
      <StatTile
        label="Experienced"
        value={placeholder ?? String(stats.experienced)}
        hint={`${share}% of the team`}
      />
      <StatTile label="Freshers" value={placeholder ?? String(stats.freshers)} hint="Early-career hires" />
      <StatTile
        label="Avg. tenure"
        value={placeholder ?? formatMonths(stats.averageTenureMonths)}
        hint={`${stats.newThisMonth} joined this month`}
      />
    </div>
  );
}
