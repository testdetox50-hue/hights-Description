export type Tenure = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
};

export function parseJoinDate(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function calculateTenure(joiningDate: string, now: Date = new Date()): Tenure | null {
  const start = parseJoinDate(joiningDate);
  if (!start || start.getTime() > now.getTime()) {
    return null;
  }

  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  let days = now.getDate() - start.getDate();

  if (days < 0) {
    // Borrow the length of the previous month.
    days += new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    months -= 1;
  }
  if (months < 0) {
    months += 12;
    years -= 1;
  }

  const totalDays = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  return { years, months, days, totalDays };
}

export function formatTenure(tenure: Tenure | null): string {
  if (!tenure) {
    return "Not started";
  }
  if (tenure.years === 0 && tenure.months === 0) {
    return tenure.days <= 1 ? "Just joined" : `${tenure.days} days`;
  }

  const parts: string[] = [];
  if (tenure.years > 0) {
    parts.push(`${tenure.years} yr${tenure.years > 1 ? "s" : ""}`);
  }
  if (tenure.months > 0) {
    parts.push(`${tenure.months} mo`);
  }
  return parts.join(" ");
}

export function formatJoinDate(joiningDate: string): string {
  const date = parseJoinDate(joiningDate);
  if (!date) {
    return "Not available";
  }
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function isWorkAnniversaryThisMonth(joiningDate: string, now: Date = new Date()): boolean {
  const start = parseJoinDate(joiningDate);
  return Boolean(start) && start!.getMonth() === now.getMonth() && start!.getFullYear() < now.getFullYear();
}

type EmployeeJoinDateInfoProps = {
  joiningDate: string;
  layout?: "inline" | "stacked";
};

export function EmployeeJoinDateInfo({ joiningDate, layout = "stacked" }: EmployeeJoinDateInfoProps) {
  const tenure = calculateTenure(joiningDate);
  const anniversary = isWorkAnniversaryThisMonth(joiningDate);

  if (layout === "inline") {
    return (
      <span className="text-sm text-slate-300">
        {formatJoinDate(joiningDate)}
        <span className="ml-2 text-xs text-slate-500">({formatTenure(tenure)})</span>
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-white">{formatJoinDate(joiningDate)}</p>
      <p className="text-xs text-slate-400">
        Tenure: <span className="font-semibold text-violet-300">{formatTenure(tenure)}</span>
        {tenure ? ` (${tenure.totalDays.toLocaleString()} days)` : ""}
      </p>
      {anniversary ? (
        <p className="inline-block rounded-full bg-fuchsia-500/15 px-2.5 py-0.5 text-xs font-semibold text-fuchsia-200">
          Work anniversary this month
        </p>
      ) : null}
    </div>
  );
}
