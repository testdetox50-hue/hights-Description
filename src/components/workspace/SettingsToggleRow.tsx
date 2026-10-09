"use client";

import { useId, type ReactNode } from "react";

type SettingsToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  /** Optional element rendered under the description, e.g. a time picker. */
  children?: ReactNode;
};

export default function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  loading = false,
  children
}: SettingsToggleRowProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;
  const inactive = disabled || loading;

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition ${
        disabled ? "opacity-60" : "hover:border-violet-400/30"
      }`}
    >
      <div className="min-w-0">
        <p id={labelId} className="text-sm font-semibold text-white">
          {label}
        </p>
        {description ? (
          <p id={descriptionId} className="mt-1 text-sm text-slate-400">
            {description}
          </p>
        ) : null}
        {children && checked ? <div className="mt-3">{children}</div> : null}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={loading}
        disabled={inactive}
        onClick={() => onChange(!checked)}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" && !checked) {
            event.preventDefault();
            onChange(true);
          }
          if (event.key === "ArrowLeft" && checked) {
            event.preventDefault();
            onChange(false);
          }
        }}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed ${
          checked ? "bg-gradient-to-r from-violet-600 to-fuchsia-600" : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        >
          {loading ? (
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          ) : null}
        </span>
      </button>
    </div>
  );
}
