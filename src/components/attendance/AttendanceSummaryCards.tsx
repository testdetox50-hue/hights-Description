import { attendanceRate, averageHours, countByStatus, countLate, presentStreaks, totalHours } from "./attendanceStats";
import type { AttendanceRecord } from "./attendanceTypes";

type AttendanceSummaryCardsProps = {
  rows: AttendanceRecord[];
  className?: string;
};

type CardTone = "violet" | "emerald" | "amber" | "sky" | "rose";

type CardData = {
  label: string;
  value: string;
  hint: string;
  tone: CardTone;
};

const TONE_CLASSES: Record<CardTone, string> = {
  violet: "text-violet-300",
  emerald: "text-emerald-300",
  amber: "text-amber-300",
  sky: "text-sky-300",
  rose: "text-rose-300"
};

function rateTone(rate: number): CardTone {
  if (rate >= 90) {
    return "emerald";
  }
  return rate >= 70 ? "amber" : "rose";
}

export function buildSummaryCards(rows: AttendanceRecord[]): CardData[] {
  const counts = countByStatus(rows);
  const rate = attendanceRate(rows);
  const late = countLate(rows);
  const streaks = presentStreaks(rows);

  return [
    { label: "Attendance rate", value: `${rate}%`, hint: `${counts.Present} present, ${counts["Half Day"]} half day`, tone: rateTone(rate) },
    { label: "Average hours", value: `${averageHours(rows)}h`, hint: `${totalHours(rows)}h logged in total`, tone: "violet" },
    { label: "Late arrivals", value: String(late), hint: "Check-in after 9:30 AM", tone: late > 0 ? "amber" : "emerald" },
    { label: "Present streak", value: `${streaks.current}d`, hint: `Longest run: ${streaks.longest} days`, tone: "sky" },
    { label: "Missed days", value: String(counts.Missed), hint: `${counts["In Progress"]} still in progress`, tone: counts.Missed > 0 ? "rose" : "emerald" }
  ];
}

export default function AttendanceSummaryCards({ rows, className = "" }: AttendanceSummaryCardsProps) {
  const cards = buildSummaryCards(rows);

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-5 ${className}`.trim()}>
      {cards.map((card) => (
        <div key={card.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300/80">{card.label}</p>
          <div className={`mt-3 text-3xl font-black tracking-tight ${TONE_CLASSES[card.tone]}`}>{card.value}</div>
          <p className="mt-2 text-xs text-slate-400">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
