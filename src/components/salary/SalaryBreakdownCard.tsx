import { estimateTax, formatCurrency } from "./salaryCalculations";
import type { SalarySlip } from "./salaryTypes";

type SalaryBreakdownCardProps = {
  slip: SalarySlip;
  onOpen?: (slip: SalarySlip) => void;
  showTaxEstimate?: boolean;
};

type Segment = { label: string; value: number; className: string };

export function SalaryBreakdownCard({ slip, onOpen, showTaxEstimate = true }: SalaryBreakdownCardProps) {
  const gross = slip.baseSalary + slip.bonus;
  const total = Math.max(gross, 1);
  const tax = estimateTax(gross);

  const segments: Segment[] = [
    { label: "Net pay", value: Math.max(slip.netSalary, 0), className: "bg-violet-500" },
    { label: "Deductions", value: slip.deductions, className: "bg-rose-500" }
  ];
  const takeHome = gross > 0 ? Math.round((slip.netSalary / gross) * 100) : 0;

  const rows = [
    { label: "Base salary", value: formatCurrency(slip.baseSalary), tone: "text-slate-200" },
    { label: "Bonus", value: `+ ${formatCurrency(slip.bonus)}`, tone: "text-emerald-300" },
    { label: "Deductions", value: `- ${formatCurrency(slip.deductions)}`, tone: "text-rose-300" }
  ];

  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200 shadow-[0_18px_50px_rgba(15,23,42,0.45)]">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">{slip.month || "No month"}</p>
          <h3 className="mt-2 text-lg font-bold text-white">{slip.employeeName}</h3>
          {slip.employeeEmail ? <p className="text-xs text-slate-400">{slip.employeeEmail}</p> : null}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Net salary</p>
          <p className="text-2xl font-black text-white">{formatCurrency(slip.netSalary)}</p>
        </div>
      </header>

      <div
        className="mt-5 flex h-2.5 w-full overflow-hidden rounded-full bg-white/10"
        role="img"
        aria-label={`Take-home is ${takeHome}% of gross pay`}
      >
        {segments.map((segment) => (
          <div
            key={segment.label}
            className={segment.className}
            style={{ width: `${Math.min((segment.value / total) * 100, 100)}%` }}
            title={`${segment.label}: ${formatCurrency(segment.value)}`}
          />
        ))}
      </div>
      <p className="mt-2 text-xs text-slate-400">Take-home is {takeHome}% of gross pay.</p>

      <dl className="mt-5 divide-y divide-white/10 rounded-2xl border border-white/10 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between px-4 py-2.5">
            <dt className="text-slate-400">{row.label}</dt>
            <dd className={`font-semibold ${row.tone}`}>{row.value}</dd>
          </div>
        ))}
        {showTaxEstimate ? (
          <div className="flex justify-between px-4 py-2.5">
            <dt className="text-slate-400">Estimated tax</dt>
            <dd className="font-semibold text-amber-300">{formatCurrency(tax)}</dd>
          </div>
        ) : null}
      </dl>

      {onOpen ? (
        <button
          type="button"
          onClick={() => onOpen(slip)}
          className="mt-5 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-white/10"
        >
          View slip
        </button>
      ) : null}
    </article>
  );
}
