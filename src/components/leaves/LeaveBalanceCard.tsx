import { totalAvailable, usagePercent } from "./leaveCalculations";
import type { BalanceBucket, LeaveBalance, LeaveType } from "./leaveTypes";
import { LEAVE_TYPES } from "./leaveTypes";

interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  highlightType?: LeaveType;
  compact?: boolean;
}

function bucketFor(balance: LeaveBalance, type: LeaveType): BalanceBucket {
  switch (type) {
    case "Casual":
      return balance.casual;
    case "Sick":
      return balance.sick;
    case "Earned":
      return balance.earned;
    default:
      return balance.unpaid;
  }
}

function barColor(percent: number): string {
  if (percent >= 90) return "from-rose-500 to-rose-400";
  if (percent >= 70) return "from-amber-500 to-amber-400";
  return "from-violet-500 to-fuchsia-500";
}

interface BucketRowProps {
  type: LeaveType;
  bucket: BalanceBucket;
  highlighted: boolean;
}

function BucketRow({ type, bucket, highlighted }: BucketRowProps) {
  const percent = usagePercent(bucket);
  const ring = highlighted ? "border-violet-400/40 bg-violet-500/10" : "border-white/8 bg-slate-950/35";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${ring}`}>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-white">{type}</span>
        <span className="text-xs uppercase tracking-[0.16em] text-slate-400">{bucket.remaining} left</span>
      </div>
      <div
        role="progressbar"
        aria-label={`${type} leave used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 rounded-full bg-white/8"
      >
        <div className={`h-2 rounded-full bg-gradient-to-r ${barColor(percent)}`} style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{bucket.used} used</span>
        <span>{bucket.total} total</span>
      </div>
    </div>
  );
}

export function LeaveBalanceCard({ balance, highlightType, compact = false }: LeaveBalanceCardProps) {
  const types = compact ? LEAVE_TYPES.filter((type) => type !== "Unpaid") : LEAVE_TYPES;

  return (
    <article className="flex h-full flex-col rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <header className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">Leave balance</p>
          <h3 className="mt-2 truncate text-lg font-semibold text-white">{balance.employeeName}</h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-right">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Available</div>
          <div className="mt-1 text-lg font-bold text-violet-200">{totalAvailable(balance)}</div>
        </div>
      </header>
      <div className="mt-4 grid gap-3">
        {types.map((type) => (
          <BucketRow key={type} type={type} bucket={bucketFor(balance, type)} highlighted={highlightType === type} />
        ))}
      </div>
    </article>
  );
}

interface LeaveBalanceGridProps {
  balances: LeaveBalance[];
  highlightType?: LeaveType;
}

export function LeaveBalanceGrid({ balances, highlightType }: LeaveBalanceGridProps) {
  if (balances.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-14 text-center text-slate-400">
        No leave balances available yet.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {balances.map((balance) => (
        <LeaveBalanceCard key={balance._id} balance={balance} highlightType={highlightType} />
      ))}
    </div>
  );
}

export default LeaveBalanceCard;
