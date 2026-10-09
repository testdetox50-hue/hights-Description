import type { ReactNode } from "react";

export type GridSpan = 1 | 2 | 3 | 4;

export interface DashboardGridProps {
  children: ReactNode;
  className?: string;
}

export interface DashboardSectionProps {
  title: string;
  eyebrow?: string;
  /** Number of columns to span on wide screens (grid has 4). */
  span?: GridSpan;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

// Full literal class names so Tailwind can detect them at build time.
const spanClasses: Record<GridSpan, string> = {
  1: "xl:col-span-1",
  2: "md:col-span-2 xl:col-span-2",
  3: "md:col-span-2 xl:col-span-3",
  4: "md:col-span-2 xl:col-span-4"
};

/** Responsive 1 / 2 / 4 column layout used by the dashboard page. */
export function DashboardGrid({ children, className = "" }: DashboardGridProps) {
  return <div className={`grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 ${className}`}>{children}</div>;
}

export function DashboardSection({ title, eyebrow, span = 2, actions, children, className = "" }: DashboardSectionProps) {
  const headingId = `section-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

  return (
    <section
      aria-labelledby={headingId}
      className={`${spanClasses[span]} min-w-0 rounded-3xl border border-white/10 bg-slate-950/50 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.25)] backdrop-blur ${className}`}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.26em] text-violet-300/80">{eyebrow}</p> : null}
          <h2 id={headingId} className="mt-1 text-xl font-bold text-white">{title}</h2>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

/** Wraps a row of StatTile components so they share one equal-width responsive row. */
export function StatRow({ children }: { children: ReactNode }) {
  return <div className="col-span-full grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}

export interface SectionSkeletonProps {
  rows?: number;
  label?: string;
}

/** Placeholder shown inside a DashboardSection while its data is loading. */
export function SectionSkeleton({ rows = 3, label = "Loading section" }: SectionSkeletonProps) {
  return (
    <div role="status" aria-live="polite" aria-label={label} className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-14 animate-pulse rounded-2xl bg-white/[0.06]" style={{ opacity: 1 - index * 0.15 }} />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface SectionEmptyProps {
  title: string;
  message?: string;
  action?: ReactNode;
}

/** Consistent empty state for widgets that have no records yet. */
export function SectionEmpty({ title, message, action }: SectionEmptyProps) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center">
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {message ? <p className="mt-1 text-sm text-slate-400">{message}</p> : null}
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export default DashboardGrid;
