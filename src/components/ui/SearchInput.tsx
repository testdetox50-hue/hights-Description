"use client";

import { useEffect, useId, useRef, useState } from "react";

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  debounceMs?: number;
  className?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  label = "Search",
  debounceMs = 250,
  className = "",
  autoFocus = false,
}: SearchInputProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return;
    const timer = window.setTimeout(() => onChangeRef.current(draft), debounceMs);
    return () => window.clearTimeout(timer);
  }, [draft, value, debounceMs]);

  const clear = () => {
    setDraft("");
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} role="search">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <svg
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        id={id}
        ref={inputRef}
        type="search"
        value={draft}
        autoFocus={autoFocus}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && draft) {
            e.preventDefault();
            clear();
          } else if (e.key === "Enter") {
            onChange(draft);
          }
        }}
        className="h-10 w-full rounded-2xl border border-white/10 bg-white/5 pl-10 pr-10 text-sm text-slate-200 placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none focus:ring-2 focus:ring-violet-400/30 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {draft && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg px-1.5 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      )}
    </div>
  );
}
