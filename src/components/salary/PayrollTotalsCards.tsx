import { formatCurrency, groupByMonth, percentChange } from "./salaryCalculations";
import type { PayrollTotals, SalarySlip } from "./salaryTypes";

type PayrollTotalsCardsProps = {
  totals: PayrollTotals;
  rows?: SalarySlip[];
  isAdmin?: boolean;
};

type Card = { label: string; value: string; hint?: string; trend?: number | null };

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${positive ? "bg-emerald-500/15 text-emerald-300" : "bg-rose-500/15 text-rose-300"}`}>
      {positive ? "+" : ""}{value}%
    </span>
  );
}

export function PayrollTotalsCards({ totals, rows = [], isAdmin = true }: PayrollTotalsCardsProps) {
  const months = groupByMonth(rows);
  const latest = months[months.length - 1];
  const previous = months[months.length - 2];
  const netTrend = latest && previous ? percentChange(latest.net, previous.net) : null;

  const cards: Card[] = [
    {
      label: isAdmin ? "Net processed" : "Total earned",
      value: formatCurrency(totals.net),
      hint: latest ? `Latest month: ${latest.month}` : undefined,
      trend: netTrend
    },
    { label: "Salary slips", value: String(totals.slips), hint: isAdmin ? `${totals.employees} employees covered` : undefined },
    { label: "Average net", value: formatCurrency(totals.averageNet), hint: "Per salary slip" },
    { label: "Bonuses paid", value: formatCurrency(totals.bonus), hint: `Base total ${formatCurrency(totals.base)}` },
    { label: "Deductions", value: formatCurrency(totals.deductions), hint: totals.base ? `${Math.round((totals.deductions / totals.base) * 100)}% of base pay` : undefined }
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.35)]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">{card.label}</p>
            {typeof card.trend === "number" ? <TrendBadge value={card.trend} /> : null}
          </div>
          <div className="mt-3 text-2xl font-black tracking-tight text-white">{card.value}</div>
          {card.hint ? <p className="mt-1 text-xs text-slate-400">{card.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
