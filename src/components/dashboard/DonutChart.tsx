export interface DonutSlice {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  title: string;
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  emptyMessage?: string;
}

export const CHART_PALETTE = ["#8b5cf6", "#34d399", "#fbbf24", "#38bdf8", "#fb7185", "#e879f9", "#a3e635"];

export function colorAt(index: number, override?: string): string {
  return override ?? CHART_PALETTE[index % CHART_PALETTE.length];
}

/** Merges small slices into one "Other" slice so legends stay readable. */
export function groupSmallSlices(data: DonutSlice[], minPercent = 3): DonutSlice[] {
  const total = data.reduce((sum, slice) => sum + Math.max(slice.value, 0), 0);
  if (total === 0) return data;
  const isSmall = (slice: DonutSlice) => (slice.value / total) * 100 < minPercent;
  const small = data.filter(isSmall).reduce((sum, slice) => sum + slice.value, 0);
  const large = data.filter((slice) => !isSmall(slice));
  return small > 0 ? [...large, { label: "Other", value: small, color: "#64748b" }] : large;
}

export function DonutChart({ title, data, size = 180, thickness = 22, centerLabel = "Total", emptyMessage = "No data to display yet." }: DonutChartProps) {
  const slices = data.filter((slice) => slice.value > 0);
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const description = slices.map((s) => `${s.label} ${s.value}`).join(", ");

  const arcs = slices.map((slice, index) => {
    const before = slices.slice(0, index).reduce((sum, item) => sum + item.value, 0);
    return {
      ...slice,
      color: colorAt(index, slice.color),
      length: (slice.value / total) * circumference,
      offset: (before / total) * circumference,
      percent: (slice.value / total) * 100
    };
  });

  return (
    <figure className="flex flex-col gap-5 sm:flex-row sm:items-center" aria-label={title}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg role="img" aria-label={`${title}. ${total === 0 ? "No data" : description}`} viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <title>{title}</title>
          <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
          <g transform={`rotate(-90 ${center} ${center})`}>
            {arcs.map((arc) => (
              <circle
                key={arc.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={arc.color}
                strokeWidth={thickness}
                strokeDasharray={`${Math.max(arc.length - (arcs.length > 1 ? 2 : 0), 0)} ${circumference}`}
                strokeDashoffset={-arc.offset}
              >
                <title>{`${arc.label}: ${arc.value} (${arc.percent.toFixed(1)}%)`}</title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black text-white">{total}</span>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{centerLabel}</span>
        </div>
      </div>

      {arcs.length === 0 ? (
        <figcaption className="text-sm text-slate-400">{emptyMessage}</figcaption>
      ) : (
        <figcaption className="min-w-0 flex-1">
          <ul className="space-y-2.5">
            {arcs.map((arc) => (
              <li key={arc.label} className="flex items-center justify-between gap-4 text-sm">
                <span className="flex min-w-0 items-center gap-2.5 text-slate-200">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: arc.color }} aria-hidden="true" />
                  <span className="truncate">{arc.label}</span>
                </span>
                <span className="shrink-0 tabular-nums text-slate-400">
                  <span className="font-semibold text-white">{arc.value}</span> · {arc.percent.toFixed(0)}%
                </span>
              </li>
            ))}
          </ul>
        </figcaption>
      )}
    </figure>
  );
}

export default DonutChart;
