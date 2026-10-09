import type { ReactNode } from "react";

export type ProjectStatus = "Active" | "Completed";

export const PROJECT_STATUSES: ProjectStatus[] = ["Active", "Completed"];

type StatusTone = {
  badge: string;
  dot: string;
  label: string;
};

const TONES: Record<ProjectStatus, StatusTone> = {
  Active: {
    badge: "border-sky-400/20 bg-sky-500/10 text-sky-200",
    dot: "bg-sky-400",
    label: "In progress"
  },
  Completed: {
    badge: "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
    label: "Delivered"
  }
};

const SIZES = {
  sm: "px-2.5 py-0.5 text-[10px]",
  md: "px-3 py-1 text-xs"
} as const;

export function getStatusTone(status: ProjectStatus): StatusTone {
  return TONES[status] ?? TONES.Active;
}

export function isProjectStatus(value: unknown): value is ProjectStatus {
  return typeof value === "string" && (PROJECT_STATUSES as string[]).includes(value);
}

type ProjectStatusBadgeProps = {
  status: ProjectStatus;
  size?: keyof typeof SIZES;
  showDot?: boolean;
  /** Show the descriptive label ("In progress") instead of the raw status. */
  verbose?: boolean;
  count?: number;
  className?: string;
  children?: ReactNode;
};

export default function ProjectStatusBadge({
  status,
  size = "md",
  showDot = true,
  verbose = false,
  count,
  className = "",
  children
}: ProjectStatusBadgeProps) {
  const tone = getStatusTone(status);
  const text = children ?? (verbose ? tone.label : status);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-semibold uppercase tracking-[0.2em] ${tone.badge} ${SIZES[size]} ${className}`}
      data-status={status}
    >
      {showDot ? (
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      ) : null}
      <span>{text}</span>
      {typeof count === "number" ? (
        <span className="rounded-full bg-white/10 px-1.5 text-[10px] tracking-normal text-white">
          {count}
        </span>
      ) : null}
    </span>
  );
}
