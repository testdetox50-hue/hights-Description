// Currency formatting, parsing and rounding helpers (defaults to Indian Rupees).

export interface CurrencyOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

const DEFAULTS = { currency: "INR", locale: "en-IN" };

/** Round to a fixed number of decimals, avoiding binary float drift (e.g. 1.005). */
export function roundTo(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  const shifted = Number((Math.abs(value) * factor).toPrecision(15));
  return (Math.sign(value) * Math.round(shifted)) / factor;
}

/** Round to the nearest whole rupee (paise dropped), as payroll often requires. */
export function roundToRupee(value: number): number {
  return roundTo(value, 0);
}

export function formatCurrency(value: number, options: CurrencyOptions = {}): string {
  const { currency, locale, minimumFractionDigits = 0, maximumFractionDigits = 2 } = {
    ...DEFAULTS,
    ...options,
  };
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Format without the currency symbol, e.g. 1,25,000.50 */
export function formatAmount(value: number, locale = DEFAULTS.locale, decimals = 2): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Number.isFinite(value) ? value : 0);
}

/** Compact form: 1.2K, 3.4L (lakh) or 2.5Cr (crore) for Indian-style dashboards. */
export function formatCompactInr(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const trim = (n: number) => String(roundTo(n, 2));
  if (abs >= 10_000_000) return `${sign}${trim(abs / 10_000_000)}Cr`;
  if (abs >= 100_000) return `${sign}${trim(abs / 100_000)}L`;
  if (abs >= 1_000) return `${sign}${trim(abs / 1_000)}K`;
  return `${sign}${trim(abs)}`;
}

/** Parse "₹ 1,25,000.50", "(500)" or "-1,200" into a number; null when not numeric. */
export function parseCurrency(input: string): number | null {
  if (typeof input !== "string") return null;
  let text = input.trim();
  if (!text) return null;
  const negative = /^\(.*\)$/.test(text) || /^-|-$/.test(text);
  text = text.replace(/[^0-9.]/g, "");
  if (!text || text === "." || (text.match(/\./g) ?? []).length > 1) return null;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return negative ? -parsed : parsed;
}

/** Convert whole-rupee amounts to paise (integer) for exact arithmetic. */
export function toPaise(rupees: number): number {
  return Math.round(Number((rupees * 100).toPrecision(15)));
}

export function fromPaise(paise: number): number {
  return paise / 100;
}

/** Sum amounts exactly by working in paise. */
export function sumAmounts(values: number[]): number {
  return fromPaise(values.reduce((total, v) => total + toPaise(v), 0));
}

/** Prorate a monthly amount by days worked, rounded to 2 decimals. */
export function prorate(amount: number, daysWorked: number, totalDays: number): number {
  if (totalDays <= 0) return 0;
  const ratio = Math.min(Math.max(daysWorked, 0), totalDays) / totalDays;
  return roundTo(amount * ratio, 2);
}

/** Apply a percentage (e.g. 12 for 12%) to an amount. */
export function percentOf(amount: number, percent: number): number {
  return roundTo((amount * percent) / 100, 2);
}
