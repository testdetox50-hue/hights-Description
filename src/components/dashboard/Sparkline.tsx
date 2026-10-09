import { useId } from "react";

export interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  showArea?: boolean;
  showLastPoint?: boolean;
  label?: string;
  className?: string;
}

export interface SparkPoint {
  x: number;
  y: number;
}

/** Converts raw values into SVG coordinates inside a padded viewbox. */
export function toSparkPoints(values: number[], width: number, height: number, pad = 3): SparkPoint[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const step = values.length > 1 ? innerW / (values.length - 1) : 0;

  return values.map((value, index) => ({
    x: values.length > 1 ? pad + index * step : width / 2,
    y: pad + innerH - ((value - min) / range) * innerH
  }));
}

export function pointsToPath(points: SparkPoint[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
}

export function Sparkline({
  values,
  width = 120,
  height = 36,
  stroke = "#a78bfa",
  showArea = true,
  showLastPoint = true,
  label,
  className = ""
}: SparklineProps) {
  const gradientId = useId();
  const clean = values.filter((v) => Number.isFinite(v));
  const points = toSparkPoints(clean, width, height);

  if (points.length === 0) {
    return (
      <svg role="img" aria-label={label ? `${label}: no data` : "No trend data"} viewBox={`0 0 ${width} ${height}`} className={className} width={width} height={height}>
        <line x1="3" x2={width - 3} y1={height / 2} y2={height / 2} stroke="rgba(148,163,184,0.35)" strokeDasharray="3 3" />
      </svg>
    );
  }

  const linePath = pointsToPath(points);
  const first = points[0];
  const last = points[points.length - 1];
  const areaPath = `${linePath} L${last.x.toFixed(2)} ${height} L${first.x.toFixed(2)} ${height} Z`;
  const summary = `${label ?? "Trend"}: from ${clean[0]} to ${clean[clean.length - 1]} over ${clean.length} points`;

  return (
    <svg role="img" aria-label={summary} viewBox={`0 0 ${width} ${height}`} width={width} height={height} className={className}>
      <title>{summary}</title>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {showArea && points.length > 1 ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
      {points.length > 1 ? (
        <path d={linePath} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : null}
      {showLastPoint ? (
        <>
          <circle cx={last.x} cy={last.y} r="5" fill={stroke} opacity="0.2" />
          <circle cx={last.x} cy={last.y} r="2.5" fill={stroke} />
        </>
      ) : null}
    </svg>
  );
}

export default Sparkline;
