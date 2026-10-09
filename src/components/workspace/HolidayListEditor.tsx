"use client";

import { useState, type FormEvent } from "react";

export type HolidayItem = {
  name: string;
  monthDay: string;
  description?: string;
  active: boolean;
};

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Returns an error message for an invalid MM-DD value, or null when valid. */
export function validateMonthDay(value: string): string | null {
  const match = /^(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return "Use MM-DD format, e.g. 08-15.";
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  if (month < 1 || month > 12) {
    return "Month must be between 01 and 12.";
  }
  if (day < 1 || day > DAYS_IN_MONTH[month - 1]) {
    return `Day must be between 01 and ${DAYS_IN_MONTH[month - 1]} for this month.`;
  }
  return null;
}

function label(monthDay: string): string {
  const [month, day] = monthDay.split("-").map(Number);
  return new Date(2024, month - 1, day).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

type HolidayListEditorProps = {
  holidays: HolidayItem[];
  onChange: (next: HolidayItem[]) => void;
};

export default function HolidayListEditor({ holidays, onChange }: HolidayListEditorProps) {
  const [name, setName] = useState("");
  const [monthDay, setMonthDay] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sorted = holidays
    .map((holiday, index) => ({ holiday, index }))
    .sort((a, b) => a.holiday.monthDay.localeCompare(b.holiday.monthDay));

  const handleAdd = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const dateError = validateMonthDay(monthDay);
    if (!trimmedName) {
      return setError("Holiday name is required.");
    }
    if (dateError) {
      return setError(dateError);
    }
    if (holidays.some((h) => h.monthDay === monthDay.trim() && h.name.toLowerCase() === trimmedName.toLowerCase())) {
      return setError("That holiday already exists.");
    }
    onChange([...holidays, { name: trimmedName, monthDay: monthDay.trim(), active: true }]);
    setName("");
    setMonthDay("");
    setError(null);
  };

  const toggle = (index: number) =>
    onChange(holidays.map((h, i) => (i === index ? { ...h, active: !h.active } : h)));
  const remove = (index: number) => onChange(holidays.filter((_, i) => i !== index));

  const inputClass =
    "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-violet-400/50 focus:outline-none";

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-start gap-2" noValidate>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Holiday name" aria-label="Holiday name" className={`${inputClass} min-w-[180px] flex-1`} />
        <input value={monthDay} onChange={(e) => setMonthDay(e.target.value)} placeholder="MM-DD" maxLength={5} aria-label="Month and day" aria-invalid={Boolean(error)} className={`${inputClass} w-24`} />
        <button type="submit" className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white">
          Add
        </button>
      </form>
      {error ? <p role="alert" className="text-xs text-rose-300">{error}</p> : null}

      <ul className="divide-y divide-white/10 rounded-2xl border border-white/10">
        {sorted.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-slate-500">No holidays configured.</li>
        ) : (
          sorted.map(({ holiday, index }) => (
            <li key={`${holiday.monthDay}-${holiday.name}-${index}`} className="flex items-center gap-3 px-4 py-3">
              <span className="w-16 text-sm font-semibold text-violet-200">{label(holiday.monthDay)}</span>
              <span className={`flex-1 truncate text-sm ${holiday.active ? "text-white" : "text-slate-500 line-through"}`}>{holiday.name}</span>
              <button type="button" onClick={() => toggle(index)} aria-pressed={holiday.active} className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/10">
                {holiday.active ? "Active" : "Paused"}
              </button>
              <button type="button" onClick={() => remove(index)} aria-label={`Remove ${holiday.name}`} className="rounded-lg border border-rose-400/20 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-200 hover:bg-rose-500/20">
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
