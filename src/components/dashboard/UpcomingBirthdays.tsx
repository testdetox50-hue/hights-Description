import Link from "next/link";

export interface BirthdayPerson {
  _id: string;
  fullName: string;
  role?: string;
  birthDate?: string | null;
}

export interface UpcomingBirthdaysProps {
  people: BirthdayPerson[];
  /** Only show birthdays that fall within this many days. */
  withinDays?: number;
  limit?: number;
  now?: Date;
  viewAllHref?: string;
}

export interface UpcomingBirthday {
  person: BirthdayPerson;
  daysUntil: number;
  nextDate: Date;
  turning: number | null;
}

const MS_PER_DAY = 86_400_000;

/** Computes the next occurrence of a birthday, handling Feb 29 and year rollover. */
export function getUpcomingBirthdays(people: BirthdayPerson[], now: Date, withinDays: number): UpcomingBirthday[] {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const results: UpcomingBirthday[] = [];

  for (const person of people) {
    if (!person.birthDate) continue;
    const born = new Date(person.birthDate);
    if (Number.isNaN(born.getTime())) continue;

    let next = new Date(today.getFullYear(), born.getMonth(), born.getDate());
    // JS rolls Feb 29 into Mar 1 on non-leap years; keep it on the last day of February instead.
    if (born.getMonth() === 1 && born.getDate() === 29 && next.getMonth() !== 1) {
      next = new Date(today.getFullYear(), 1, 28);
    }
    if (next < today) next = new Date(today.getFullYear() + 1, next.getMonth(), next.getDate());

    const daysUntil = Math.round((next.getTime() - today.getTime()) / MS_PER_DAY);
    if (daysUntil > withinDays) continue;
    const turning = next.getFullYear() - born.getFullYear();
    results.push({ person, daysUntil, nextDate: next, turning: turning > 0 ? turning : null });
  }

  return results.sort((a, b) => a.daysUntil - b.daysUntil || a.person.fullName.localeCompare(b.person.fullName));
}

function whenLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

export function UpcomingBirthdays({ people, withinDays = 30, limit = 5, now, viewAllHref = "/employees" }: UpcomingBirthdaysProps) {
  const upcoming = getUpcomingBirthdays(people, now ?? new Date(), withinDays).slice(0, limit);

  if (upcoming.length === 0) {
    return <p className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-slate-400">No birthdays in the next {withinDays} days.</p>;
  }

  return (
    <div>
      <ul className="space-y-2" aria-label="Upcoming birthdays">
        {upcoming.map(({ person, daysUntil, nextDate, turning }) => (
          <li key={person._id} className={`flex items-center gap-4 rounded-2xl border px-4 py-3 ${daysUntil === 0 ? "border-fuchsia-400/30 bg-fuchsia-500/10" : "border-white/10 bg-white/[0.03]"}`}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/20 font-bold text-violet-200 ring-1 ring-violet-300/15" aria-hidden="true">
              {person.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{person.fullName}</p>
              <p className="truncate text-xs text-slate-400">
                {nextDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                {turning ? ` · turning ${turning}` : ""}
                {person.role ? ` · ${person.role}` : ""}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${daysUntil === 0 ? "bg-fuchsia-500/20 text-fuchsia-200" : "bg-white/5 text-slate-300"}`}>
              {whenLabel(daysUntil)}
            </span>
          </li>
        ))}
      </ul>
      <Link href={viewAllHref} className="mt-4 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200">
        View all employees
      </Link>
    </div>
  );
}

export default UpcomingBirthdays;
