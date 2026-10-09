import type { ExperienceLevel } from "./employeeTypes";

type RoleTone = {
  keywords: string[];
  classes: string;
};

const ROLE_TONES: RoleTone[] = [
  { keywords: ["developer", "engineer", "programmer"], classes: "border-violet-400/30 bg-violet-500/15 text-violet-200" },
  { keywords: ["design", "ui", "ux"], classes: "border-fuchsia-400/30 bg-fuchsia-500/15 text-fuchsia-200" },
  { keywords: ["qa", "test"], classes: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200" },
  { keywords: ["hr", "human", "recruit"], classes: "border-amber-400/30 bg-amber-500/15 text-amber-200" },
  { keywords: ["manager", "lead", "head", "admin"], classes: "border-sky-400/30 bg-sky-500/15 text-sky-200" },
  { keywords: ["support", "service"], classes: "border-indigo-400/30 bg-indigo-500/15 text-indigo-200" }
];

const FALLBACK_TONE = "border-white/10 bg-white/5 text-slate-300";

export function getRoleTone(role: string): string {
  const normalized = role.toLowerCase();
  const match = ROLE_TONES.find((tone) => tone.keywords.some((keyword) => normalized.includes(keyword)));
  return match ? match.classes : FALLBACK_TONE;
}

type EmployeeRoleBadgeProps = {
  role: string;
  className?: string;
};

export function EmployeeRoleBadge({ role, className = "" }: EmployeeRoleBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${getRoleTone(role)} ${className}`}
    >
      {role}
    </span>
  );
}

type ExperienceBadgeProps = {
  level: ExperienceLevel;
  className?: string;
};

export function ExperienceBadge({ level, className = "" }: ExperienceBadgeProps) {
  const isExperienced = level === "Experienced";
  const tone = isExperienced
    ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
    : "border-amber-400/30 bg-amber-500/15 text-amber-200";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tone} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isExperienced ? "bg-emerald-300" : "bg-amber-300"}`} />
      {level}
    </span>
  );
}

type RoleBadgeListProps = {
  roles: string[];
  max?: number;
};

// Shows the first few roles and collapses the rest into a "+N" chip.
export function RoleBadgeList({ roles, max = 3 }: RoleBadgeListProps) {
  const visible = roles.slice(0, max);
  const hidden = roles.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((role) => (
        <EmployeeRoleBadge key={role} role={role} />
      ))}
      {hidden > 0 ? (
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
          +{hidden}
        </span>
      ) : null}
    </div>
  );
}
