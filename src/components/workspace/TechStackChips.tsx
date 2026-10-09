"use client";

import { useMemo, useState } from "react";

/** Split a comma / pipe / slash separated tech stack string into unique, trimmed items. */
export function parseTechStack(value: string | string[] | null | undefined): string[] {
  const raw = Array.isArray(value) ? value : String(value ?? "").split(/[,|;\n]/);
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of raw) {
    const trimmed = item.trim();
    const key = trimmed.toLowerCase();
    if (trimmed && !seen.has(key)) {
      seen.add(key);
      result.push(trimmed);
    }
  }

  return result;
}

const PALETTE = [
  "border-violet-400/25 bg-violet-500/10 text-violet-200",
  "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200",
  "border-sky-400/25 bg-sky-500/10 text-sky-200",
  "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  "border-amber-400/25 bg-amber-500/10 text-amber-200"
];

/** Stable colour per tech name so the same tag always looks the same. */
function toneFor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

type TechStackChipsProps = {
  stack: string | string[] | null | undefined;
  /** Max chips shown before collapsing into a "+N" toggle. */
  limit?: number;
  onSelect?: (tech: string) => void;
  emptyLabel?: string;
};

export default function TechStackChips({
  stack,
  limit = 4,
  onSelect,
  emptyLabel = "No stack listed"
}: TechStackChipsProps) {
  const [expanded, setExpanded] = useState(false);
  const items = useMemo(() => parseTechStack(stack), [stack]);

  if (items.length === 0) {
    return <span className="text-xs text-slate-500">{emptyLabel}</span>;
  }

  const visible = expanded ? items : items.slice(0, limit);
  const hidden = items.length - visible.length;
  const chipClass = "rounded-full border px-2.5 py-1 text-xs font-medium";

  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Tech stack">
      {visible.map((tech) => (
        <li key={tech.toLowerCase()}>
          {onSelect ? (
            <button
              type="button"
              onClick={() => onSelect(tech)}
              className={`${chipClass} ${toneFor(tech)} transition hover:brightness-125`}
            >
              {tech}
            </button>
          ) : (
            <span className={`${chipClass} ${toneFor(tech)}`}>{tech}</span>
          )}
        </li>
      ))}
      {hidden > 0 || (expanded && items.length > limit) ? (
        <li>
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className={`${chipClass} border-white/10 bg-white/5 text-slate-300 hover:bg-white/10`}
          >
            {expanded ? "Show less" : `+${hidden}`}
          </button>
        </li>
      ) : null}
    </ul>
  );
}
