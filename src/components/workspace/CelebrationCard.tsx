export type CelebrationKind = "birthday" | "anniversary" | "holiday";

export type CelebrationEntry = {
  id: string;
  kind: CelebrationKind;
  name: string;
  /** Original date (birth date / join date) or MM-DD for holidays. */
  date: string;
  subtitle?: string;
};

const KIND_STYLE: Record<CelebrationKind, { emoji: string; tag: string; ring: string }> = {
  birthday: { emoji: "🎂", tag: "Birthday", ring: "border-fuchsia-400/25 bg-fuchsia-500/10 text-fuchsia-200" },
  anniversary: { emoji: "🎉", tag: "Work anniversary", ring: "border-violet-400/25 bg-violet-500/10 text-violet-200" },
  holiday: { emoji: "🏖️", tag: "Holiday", ring: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200" }
};

/** Whole days from `today` until the next occurrence of the entry's month/day (0 = today). */
export function daysUntilNext(date: string, today = new Date()): number | null {
  let month: number;
  let day: number;
  const monthDay = /^(\d{2})-(\d{2})$/.exec(date);

  if (monthDay) {
    month = Number(monthDay[1]) - 1;
    day = Number(monthDay[2]);
  } else {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    month = parsed.getMonth();
    day = parsed.getDate();
  }

  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let next = new Date(start.getFullYear(), month, day);
  if (next < start) {
    next = new Date(start.getFullYear() + 1, month, day);
  }
  return Math.round((next.getTime() - start.getTime()) / 86_400_000);
}

function yearsSince(date: string, today = new Date()): number | null {
  const parsed = new Date(date);
  if (/^\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.getTime())) {
    return null;
  }
  const years = today.getFullYear() - parsed.getFullYear();
  return daysUntilNext(date, today) === 0 || years < 0 ? Math.max(years, 0) : years + 1;
}

function whenLabel(days: number | null): string {
  if (days === null) {
    return "Date unknown";
  }
  if (days === 0) {
    return "Today";
  }
  return days === 1 ? "Tomorrow" : `In ${days} days`;
}

type CelebrationCardProps = {
  entry: CelebrationEntry;
  today?: Date;
  onWish?: (entry: CelebrationEntry) => void;
};

export default function CelebrationCard({ entry, today = new Date(), onWish }: CelebrationCardProps) {
  const style = KIND_STYLE[entry.kind];
  const days = daysUntilNext(entry.date, today);
  const isToday = days === 0;
  const years = entry.kind === "anniversary" ? yearsSince(entry.date, today) : null;
  const dateText = (/^\d{2}-\d{2}$/.test(entry.date) ? new Date(2024, Number(entry.date.slice(0, 2)) - 1, Number(entry.date.slice(3))) : new Date(entry.date))
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

  return (
    <article className={`flex items-center gap-4 rounded-3xl border p-4 ${isToday ? "border-fuchsia-400/40 bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 shadow-[0_12px_40px_rgba(168,85,247,0.25)]" : "border-white/10 bg-slate-950/50"}`}>
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-2xl ${style.ring}`} aria-hidden="true">
        {style.emoji}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-white">{entry.name}</p>
        <p className="truncate text-xs text-slate-400">
          {style.tag}
          {years ? ` · ${years} ${years === 1 ? "year" : "years"}` : ""}
          {entry.subtitle ? ` · ${entry.subtitle}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold ${isToday ? "text-fuchsia-200" : "text-slate-200"}`}>{whenLabel(days)}</p>
        <p className="text-xs text-slate-500">{dateText}</p>
        {isToday && onWish ? (
          <button type="button" onClick={() => onWish(entry)} className="mt-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3 py-1 text-xs font-semibold text-white">
            Send wishes
          </button>
        ) : null}
      </div>
    </article>
  );
}
