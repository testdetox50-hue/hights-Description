// String helpers for names, labels and identifiers.

/** "john ronald smith" -> "JR" (first and last word, max `max` letters). */
export function getInitials(name: string, max = 2): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const picked = words.length === 1 ? [words[0]] : [words[0], words[words.length - 1]];
  const letters = picked.length === 1 ? Array.from(picked[0]) : picked.map((w) => Array.from(w)[0]);
  return letters.slice(0, max).join("").toUpperCase();
}

export function slugify(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function toTitleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|[\s\-'])([a-zÀ-ɏ])/g, (_, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** "in_progress" / "inProgress" / "in-progress" -> "In Progress" */
export function humanize(text: string): string {
  return toTitleCase(
    text
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_\-]+/g, " ")
      .trim()
  );
}

export function truncate(text: string, maxLength: number, ellipsis = "..."): string {
  if (maxLength <= 0) return "";
  if (text.length <= maxLength) return text;
  const keep = Math.max(maxLength - ellipsis.length, 0);
  return text.slice(0, keep).trimEnd() + ellipsis;
}

export function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function isBlank(text: string | null | undefined): boolean {
  return text == null || text.trim() === "";
}

/** Collapse repeated whitespace and trim. */
export function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Case- and accent-insensitive "contains" for search boxes. */
export function fuzzyIncludes(haystack: string, needle: string): boolean {
  const clean = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase();
  return clean(haystack).includes(clean(needle).trim());
}

/** "5" + singular/plural: pluralize(1, "day") -> "1 day", pluralize(3, "day") -> "3 days". */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Mask all but the last `visible` characters: maskValue("9876543210") -> "******3210". */
export function maskValue(value: string, visible = 4, maskChar = "*"): string {
  if (value.length <= visible) return value;
  return maskChar.repeat(value.length - visible) + value.slice(-visible);
}

/** Zero-padded employee-style code: formatCode("EMP", 7, 4) -> "EMP0007". */
export function formatCode(prefix: string, num: number, width = 4): string {
  return `${prefix}${String(Math.max(0, Math.floor(num))).padStart(width, "0")}`;
}

/** Deterministic hue (0-359) for a string, useful for avatar colours. */
export function hashToHue(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}
