import type { HTMLAttributes, ReactNode } from "react";

export type BadgeTone =
  | "neutral"
  | "violet"
  | "success"
  | "warning"
  | "danger"
  | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  dot?: boolean;
  icon?: ReactNode;
}

const tones: Record<BadgeTone, { box: string; dot: string }> = {
  neutral: {
    box: "border-white/10 bg-white/5 text-slate-300",
    dot: "bg-slate-400",
  },
  violet: {
    box: "border-violet-400/30 bg-violet-500/10 text-violet-200",
    dot: "bg-violet-400",
  },
  success: {
    box: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    dot: "bg-emerald-400",
  },
  warning: {
    box: "border-amber-400/30 bg-amber-500/10 text-amber-200",
    dot: "bg-amber-400",
  },
  danger: {
    box: "border-rose-400/30 bg-rose-500/10 text-rose-200",
    dot: "bg-rose-400",
  },
  info: {
    box: "border-sky-400/30 bg-sky-500/10 text-sky-200",
    dot: "bg-sky-400",
  },
};

export function Badge({
  tone = "neutral",
  dot = false,
  icon,
  className = "",
  children,
  ...rest
}: BadgeProps) {
  const palette = tones[tone];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${palette.box} ${className}`}
      {...rest}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${palette.dot}`}
          aria-hidden="true"
        />
      )}
      {icon}
      {children}
    </span>
  );
}

const STATUS_TONES: Record<string, BadgeTone> = {
  present: "success",
  active: "success",
  approved: "success",
  paid: "success",
  late: "warning",
  pending: "warning",
  "half day": "warning",
  absent: "danger",
  rejected: "danger",
  inactive: "danger",
  overdue: "danger",
  leave: "info",
  "on leave": "info",
  holiday: "violet",
};

export function toneForStatus(status: string): BadgeTone {
  return STATUS_TONES[status.trim().toLowerCase()] ?? "neutral";
}

export interface StatusBadgeProps extends Omit<BadgeProps, "tone"> {
  status: string;
}

export function StatusBadge({ status, ...rest }: StatusBadgeProps) {
  return (
    <Badge tone={toneForStatus(status)} dot {...rest}>
      {status}
    </Badge>
  );
}
