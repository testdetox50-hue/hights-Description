import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}

function DefaultIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center ${
        compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14"
      } ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 text-violet-200">
        {icon ?? <DefaultIcon />}
      </div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export interface NoResultsProps {
  query: string;
  onClear: () => void;
  noun?: string;
}

export function NoResults({ query, onClear, noun = "results" }: NoResultsProps) {
  return (
    <EmptyState
      compact
      title={`No ${noun} found`}
      description={
        query
          ? `Nothing matches "${query}". Try a different keyword or clear the filter.`
          : `There are no ${noun} to show yet.`
      }
      action={
        query ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
          >
            Clear search
          </button>
        ) : undefined
      }
    />
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-10 text-center"
    >
      <h3 className="text-base font-semibold text-rose-100">
        Something went wrong
      </h3>
      <p className="max-w-sm text-sm text-rose-200/80">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-2xl border border-rose-400/40 px-4 py-2 text-sm text-rose-100 hover:bg-rose-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/70"
        >
          Try again
        </button>
      )}
    </div>
  );
}
