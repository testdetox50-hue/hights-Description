"use client";

import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
  hint?: string;
  error?: string;
  hideLabel?: boolean;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    {
      label,
      options,
      placeholder,
      hint,
      error,
      hideLabel = false,
      required,
      className = "",
      id,
      ...rest
    },
    ref
  ) {
    const autoId = useId();
    const selectId = id ?? autoId;
    const hintId = `${selectId}-hint`;
    const errorId = `${selectId}-error`;
    const describedBy =
      [error ? errorId : null, hint && !error ? hintId : null]
        .filter(Boolean)
        .join(" ") || undefined;

    return (
      <div className={className}>
        <label
          htmlFor={selectId}
          className={
            hideLabel
              ? "sr-only"
              : "mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400"
          }
        >
          {label}
          {required && (
            <span className="ml-0.5 text-rose-400" aria-hidden="true">
              *
            </span>
          )}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`h-10 w-full appearance-none rounded-2xl border bg-white/5 pl-3.5 pr-9 text-sm text-slate-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
              error
                ? "border-rose-500/50 focus:ring-rose-400/30"
                : "border-white/10 focus:border-violet-400/50 focus:ring-violet-400/30"
            }`}
            {...rest}
          >
            {placeholder && (
              <option value="" className="bg-slate-900">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-slate-900"
              >
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-rose-300">
            {error}
          </p>
        ) : (
          hint && (
            <p id={hintId} className="mt-1.5 text-xs text-slate-500">
              {hint}
            </p>
          )
        )}
      </div>
    );
  }
);
