import type { ReactNode } from "react";

import { Sparkline } from "./Sparkline";

export type StatTone = "violet" | "emerald" | "amber" | "sky" | "rose";

export interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
  /** Percentage change versus the previous period, e.g. 12.5 or -3. */
  delta?: number;
  /** When true a falling delta is rendered as good (e.g. fewer pending leaves). */
  lowerIsBetter?: boolean;
  trend?: number[];
  tone?: StatTone;
  icon?: ReactNode;
  loading?: boolean;
}

const toneStyles: Record<StatTone, { gradient: string; stroke: string }> = {
  violet: { gradient: "from-violet-600/30 to-fuchsia-500/20", stroke: "#c4b5fd" },
  emerald: { gradient: "from-emerald-600/30 to-teal-500/20", stroke: "#6ee7b7" },
  amber: { gradient: "from-amber-600/30 to-orange-500/20", stroke: "#fcd34d" },
  sky: { gradient: "from-sky-600/30 to-cyan-500/20", stroke: "#7dd3fc" },
  rose: { gradient: "from-rose-600/30 to-pink-500/20", stroke: "#fda4af" }
};

export function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
  return `${sign}${Math.abs(delta).toFixed(1).replace(/\.0$/, "")}%`;
}

function DeltaBadge({ delta, lowerIsBetter }: { delta: number; lowerIsBetter: boolean }) {
  const isFlat = delta === 0;
  const isGood = lowerIsBetter ? delta < 0 : delta > 0;
  const color = isFlat
    ? "border-white/10 bg-white/5 text-slate-300"
    : isGood
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : "border-rose-400/20 bg-rose-500/10 text-rose-200";
  const arrow = isFlat ? "→" : delta > 0 ? "↑" : "↓";
  const description = isFlat ? "unchanged" : `${delta > 0 ? "up" : "down"} ${Math.abs(delta)} percent`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${color}`}
      aria-label={`Change versus previous period: ${description}`}
    >
      <span aria-hidden="true">{arrow}</span>
      {formatDelta(delta)}
    </span>
  );
}

/** Percentage change between two periods; undefined when the baseline is zero or invalid. */
export function computeDelta(current: number, previous: number): number | undefined {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return undefined;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export function StatTile({ label, value, hint, delta, lowerIsBetter = false, trend, tone = "violet", icon, loading = false }: StatTileProps) {
  const style = toneStyles[tone];

  return (
    <section
      aria-label={label}
      aria-busy={loading}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${style.gradient} p-6 shadow-[0_18px_50px_rgba(0,0,0,0.25)]`}
    >
      <div className="pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-300/80">{label}</p>
        {icon ? <span className="text-slate-200/80" aria-hidden="true">{icon}</span> : null}
      </div>

      {loading ? (
        <div className="relative mt-4 h-12 w-32 animate-pulse rounded-xl bg-white/10" />
      ) : (
        <div className="relative mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">{value}</div>
      )}

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0 space-y-2">
          {typeof delta === "number" ? <DeltaBadge delta={delta} lowerIsBetter={lowerIsBetter} /> : null}
          {hint ? <p className="text-sm text-slate-300/85">{hint}</p> : null}
        </div>
        {trend && trend.length > 1 ? <Sparkline values={trend} stroke={style.stroke} label={`${label} trend`} className="shrink-0" /> : null}
      </div>
    </section>
  );
}

export default StatTile;
