import Link from "next/link";
import type { ReactNode } from "react";

export interface QuickAction {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: ReactNode;
  adminOnly?: boolean;
}

export interface QuickActionsProps {
  isAdmin?: boolean;
  /** Replace the default action set. */
  actions?: QuickAction[];
}

function SvgIcon({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
      {children}
    </svg>
  );
}

export const defaultQuickActions: QuickAction[] = [
  {
    key: "employees",
    label: "Employees",
    description: "Browse and manage the team directory",
    href: "/employees",
    icon: (
      <SvgIcon>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M19 8v6M16 11h6" />
      </SvgIcon>
    )
  },
  {
    key: "leave",
    label: "Apply for leave",
    description: "Submit a new leave request",
    href: "/leaves/apply",
    icon: (
      <SvgIcon>
        <rect x="3" y="4" width="18" height="17" rx="3" />
        <path d="M8 2v4M16 2v4M3 10h18" />
      </SvgIcon>
    )
  },
  {
    key: "attendance",
    label: "Attendance",
    description: "Check in, check out and review logs",
    href: "/attendance",
    icon: (
      <SvgIcon>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </SvgIcon>
    )
  },
  {
    key: "salaries",
    label: "Salaries",
    description: "View payslips and payroll status",
    href: "/salaries",
    icon: (
      <SvgIcon>
        <rect x="2.5" y="5" width="19" height="14" rx="3" />
        <path d="M2.5 10h19" />
        <circle cx="12" cy="14" r="2.5" />
      </SvgIcon>
    )
  },
  {
    key: "projects",
    label: "Projects",
    description: "Track active and completed work",
    href: "/projects",
    icon: (
      <SvgIcon>
        <path d="M3 7.5 12 3l9 4.5-9 4.5z" />
        <path d="M3 7.5V16.5L12 21l9-4.5V7.5" />
        <path d="M12 12v9" />
      </SvgIcon>
    )
  }
];

export function QuickActions({ isAdmin = false, actions = defaultQuickActions }: QuickActionsProps) {
  const visible = actions.filter((action) => !action.adminOnly || isAdmin);

  return (
    <nav aria-label="Quick actions">
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {visible.map((action) => (
          <li key={action.key}>
            <Link
              href={action.href}
              className="group flex h-full items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-violet-400/30 hover:bg-violet-500/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-400"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200 ring-1 ring-violet-300/15 group-hover:bg-violet-500/30">
                {action.icon}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">{action.label}</span>
                <span className="mt-0.5 block text-xs text-slate-400">{action.description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default QuickActions;
