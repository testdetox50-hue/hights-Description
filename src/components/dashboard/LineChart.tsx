import { useId } from "react";

import { niceCeiling } from "./BarChart";
import { colorAt } from "./DonutChart";

export interface LineSeries {
  name: string;
  values: number[];
  color?: string;
}

export interface LineChartProps {
  title: string;
  /** X axis labels; every series should provide one value per label. */
  labels: string[];
  series: LineSeries[];
  height?: number;
  formatValue?: (value: number) => string;
  emptyMessage?: string;
}

export function LineChart({ title, labels, series, height = 260, formatValue = (v) => v.toLocaleString(), emptyMessage = "No data to display yet." }: LineChartProps) {
  const gradientBase = useId();

  if (labels.length === 0 || series.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">{emptyMessage}</p>;
  }

  const width = 600;
  const margin = { top: 16, right: 16, bottom: 30, left: 44 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const allValues = series.flatMap((s) => s.values).filter((v) => Number.isFinite(v));
  const ceiling = niceCeiling(Math.max(...allValues, 0));
  const xFor = (i: number) => margin.left + (labels.length > 1 ? (i / (labels.length - 1)) * plotW : plotW / 2);
  const yFor = (v: number) => margin.top + plotH - (v / ceiling) * plotH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * ceiling);
  const labelStep = Math.ceil(labels.length / 8);
  const summary = series.map((s) => `${s.name}: ${s.values.map((v, i) => `${labels[i] ?? i + 1} ${formatValue(v)}`).join(", ")}`).join(". ");

  return (
    <figure className="w-full">
      <svg role="img" aria-label={`${title}. ${summary}`} viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
        <title>{title}</title>
        <defs>
          {series.map((s, si) => (
            <linearGradient key={s.name} id={`${gradientBase}-${si}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={colorAt(si, s.color)} stopOpacity="0.28" />
              <stop offset="100%" stopColor={colorAt(si, s.color)} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={yFor(tick)} y2={yFor(tick)} stroke="rgba(255,255,255,0.07)" />
            <text x={margin.left - 8} y={yFor(tick) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{formatValue(tick)}</text>
          </g>
        ))}
        {labels.map((label, i) =>
          i % labelStep === 0 ? (
            <text key={`${label}-${i}`} x={xFor(i)} y={height - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">{label}</text>
          ) : null
        )}
        {series.map((s, si) => {
          const color = colorAt(si, s.color);
          const pts = s.values.slice(0, labels.length).map((v, i) => [xFor(i), yFor(Number.isFinite(v) ? v : 0)] as const);
          if (pts.length === 0) return null;
          const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
          const area = `${line} L${pts[pts.length - 1][0].toFixed(1)} ${margin.top + plotH} L${pts[0][0].toFixed(1)} ${margin.top + plotH} Z`;
          return (
            <g key={s.name}>
              {series.length === 1 && pts.length > 1 ? <path d={area} fill={`url(#${gradientBase}-${si})`} /> : null}
              <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {pts.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="3.5" fill="#0f0a1f" stroke={color} strokeWidth="2">
                  <title>{`${s.name} – ${labels[i]}: ${formatValue(s.values[i])}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
      {series.length > 1 ? (
        <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-300">
          {series.map((s, si) => (
            <span key={s.name} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colorAt(si, s.color) }} aria-hidden="true" />
              {s.name}
            </span>
          ))}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default LineChart;
