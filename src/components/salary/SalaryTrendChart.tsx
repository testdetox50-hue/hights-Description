"use client";

import { useState } from "react";

import { formatCurrency, groupByMonth } from "./salaryCalculations";
import type { SalarySlip } from "./salaryTypes";

type SalaryTrendChartProps = {
  rows: SalarySlip[];
  height?: number;
  maxMonths?: number;
};

const WIDTH = 640;
const PAD = { top: 20, right: 20, bottom: 36, left: 56 };

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  return Math.ceil(value / magnitude) * magnitude;
}

export function SalaryTrendChart({ rows, height = 260, maxMonths = 12 }: SalaryTrendChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const points = groupByMonth(rows).slice(-maxMonths);

  if (points.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">No data to chart yet.</p>;
  }

  const plotW = WIDTH - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const top = niceMax(Math.max(...points.map((point) => point.net)));
  const step = plotW / points.length;
  const barW = Math.min(48, step * 0.6);
  const y = (value: number) => PAD.top + plotH - (value / top) * plotH;
  const x = (index: number) => PAD.left + step * index + step / 2;
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(point.net).toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ratio * top);
  const current = active !== null ? points[active] : null;

  return (
    <figure className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <figcaption className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-white">Net payroll by month</span>
        <span className="text-xs text-slate-400">
          {current ? `${current.month}: ${formatCurrency(current.net)} (${current.count} slips)` : "Hover a bar for details"}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="h-auto w-full" role="img" aria-label="Net payroll by month">
        {ticks.map((tick) => (
          <g key={tick}>
            <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} stroke="rgba(255,255,255,0.08)" />
            <text x={PAD.left - 8} y={y(tick) + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
              {tick >= 1000 ? `${Math.round(tick / 100) / 10}k` : Math.round(tick)}
            </text>
          </g>
        ))}
        {points.map((point, index) => (
          <g key={point.month} onMouseEnter={() => setActive(index)} onMouseLeave={() => setActive(null)}>
            <rect
              x={x(index) - barW / 2}
              y={y(point.net)}
              width={barW}
              height={Math.max(plotH - (y(point.net) - PAD.top), 0)}
              rx={6}
              fill={active === index ? "#a78bfa" : "#7c3aed"}
              fillOpacity={0.55}
            />
            <text x={x(index)} y={height - 14} textAnchor="middle" fontSize="10" fill="#94a3b8">
              {point.month.replace(/\s\d{2}(\d{2})$/, " '$1")}
            </text>
          </g>
        ))}
        <path d={line} fill="none" stroke="#e879f9" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <circle key={point.month} cx={x(index)} cy={y(point.net)} r={active === index ? 5 : 3.5} fill="#e879f9" />
        ))}
      </svg>
    </figure>
  );
}
