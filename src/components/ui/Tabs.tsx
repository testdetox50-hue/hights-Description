"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
  badge?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onTabChange?: (id: string) => void;
  label?: string;
}

export function Tabs({
  items,
  defaultTab,
  activeTab,
  onTabChange,
  label = "Sections",
}: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(
    defaultTab ?? items.find((i) => !i.disabled)?.id ?? ""
  );
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const current = activeTab ?? internal;

  const select = (id: string) => {
    if (activeTab === undefined) setInternal(id);
    onTabChange?.(id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const enabled = items.filter((i) => !i.disabled);
    const index = enabled.findIndex((i) => i.id === current);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % enabled.length;
    else if (event.key === "ArrowLeft")
      next = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = enabled.length - 1;
    if (next < 0 || enabled.length === 0) return;
    event.preventDefault();
    const target = enabled[next];
    select(target.id);
    refs.current[target.id]?.focus();
  };

  const active = items.find((i) => i.id === current);

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1"
      >
        {items.map((item) => {
          const selected = item.id === current;
          return (
            <button
              key={item.id}
              ref={(el) => {
                refs.current[item.id] = el;
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => select(item.id)}
              className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 disabled:cursor-not-allowed disabled:opacity-40 ${
                selected
                  ? "bg-gradient-to-r from-violet-600/80 to-fuchsia-600/80 text-white"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
              {item.badge}
            </button>
          );
        })}
      </div>
      {active && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${active.id}`}
          aria-labelledby={`${baseId}-tab-${active.id}`}
          tabIndex={0}
          className="mt-4 focus:outline-none"
        >
          {active.content}
        </div>
      )}
    </div>
  );
}
