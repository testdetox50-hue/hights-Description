import { colorAt } from "./DonutChart";

export interface BarDatum {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartProps {
  title: string;
  data: BarDatum[];
  height?: number;
  /** Formats the value shown above each bar and in tooltips. */
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  /** Sorts bars from highest to lowest value. */
  sortDesc?: boolean;
  /** Maximum number of bars; extra bars are rolled into an "Other" bar. */
  maxBars?: number;
}

export function prepareBars(data: BarDatum[], sortDesc: boolean, maxBars?: number): BarDatum[] {
  const rows = sortDesc ? [...data].sort((a, b) => b.value - a.value) : [...data];
  if (!maxBars || rows.length <= maxBars) return rows;
  const kept = rows.slice(0, maxBars - 1);
  const other = rows.slice(maxBars - 1).reduce((sum, row) => sum + row.value, 0);
  return [...kept, { label: "Other", value: other, color: "#64748b" }];
}

/** Rounds a maximum up to a "nice" axis ceiling such as 10, 20, 50, 100. */
export function niceCeiling(max: number): number {
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

export function BarChart({ title, data: rawData, height = 240, formatValue = (v) => v.toLocaleString(), emptyMessage = "No data to display yet.", sortDesc = false, maxBars }: BarChartProps) {
  const data = prepareBars(rawData, sortDesc, maxBars);

  if (data.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">{emptyMessage}</p>;
  }

  const width = 560;
  const margin = { top: 20, right: 12, bottom: 34, left: 40 };
  const plotW = width - margin.left - margin.right;
  const plotH = height - margin.top - margin.bottom;
  const ceiling = niceCeiling(Math.max(...data.map((d) => d.value), 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * ceiling);
  const slot = plotW / data.length;
  const barW = Math.min(slot * 0.6, 56);
  const yFor = (value: number) => margin.top + plotH - (Math.max(value, 0) / ceiling) * plotH;
  const summary = data.map((d) => `${d.label} ${formatValue(d.value)}`).join(", ");

  return (
    <figure className="w-full">
      <svg role="img" aria-label={`${title}. ${summary}`} viewBox={`0 0 ${width} ${height}`} className="h-auto w-full">
        <title>{title}</title>
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={margin.left} x2={width - margin.right} y1={yFor(tick)} y2={yFor(tick)} stroke="rgba(255,255,255,0.07)" />
            <text x={margin.left - 8} y={yFor(tick) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {formatValue(Math.round(tick * 100) / 100)}
            </text>
          </g>
        ))}
        {data.map((d, index) => {
          const x = margin.left + slot * index + (slot - barW) / 2;
          const y = yFor(d.value);
          const barH = Math.max(margin.top + plotH - y, d.value > 0 ? 2 : 0);
          return (
            <g key={d.label}>
              <rect x={x} y={margin.top + plotH - barH} width={barW} height={barH} rx="6" fill={colorAt(index, d.color)} opacity="0.9">
                <title>{`${d.label}: ${formatValue(d.value)}`}</title>
              </rect>
              <text x={x + barW / 2} y={margin.top + plotH - barH - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill="#e2e8f0">
                {formatValue(d.value)}
              </text>
              <text x={x + barW / 2} y={height - 12} textAnchor="middle" fontSize="11" fill="#94a3b8">
                {d.label.length > 10 ? `${d.label.slice(0, 9)}…` : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

export default BarChart;
