// CSV serialization and browser download helpers.

export type CsvValue = string | number | boolean | Date | null | undefined;

export interface CsvColumn<T> {
  header: string;
  value: (row: T) => CsvValue;
}

export interface CsvOptions {
  delimiter?: string;
  newline?: string;
  bom?: boolean;
}

/** Neutralise spreadsheet formula injection (=, +, -, @ prefixes) in text cells. */
function guardFormula(text: string): string {
  return /^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text) ? `'${text}` : text;
}

function stringify(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  return String(value);
}

export function escapeCsvCell(value: CsvValue, delimiter = ","): string {
  const text = typeof value === "string" ? guardFormula(stringify(value)) : stringify(value);
  const needsQuotes =
    text.includes(delimiter) || text.includes("\"") || text.includes("\n") || text.includes("\r");
  return needsQuotes ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

export function toCsvRow(values: CsvValue[], delimiter = ","): string {
  return values.map((v) => escapeCsvCell(v, delimiter)).join(delimiter);
}

/** Serialize a 2D array of cells (first row typically headers). */
export function serializeRows(rows: CsvValue[][], options: CsvOptions = {}): string {
  const { delimiter = ",", newline = "\r\n", bom = false } = options;
  const body = rows.map((row) => toCsvRow(row, delimiter)).join(newline);
  return bom ? `﻿${body}` : body;
}

/** Serialize typed objects using column definitions. */
export function serializeObjects<T>(
  rows: T[],
  columns: CsvColumn<T>[],
  options: CsvOptions = {}
): string {
  const table: CsvValue[][] = [
    columns.map((c) => c.header),
    ...rows.map((row) => columns.map((c) => c.value(row))),
  ];
  return serializeRows(table, options);
}

/** Parse CSV text into rows of strings, honouring quoted cells and escaped quotes. */
export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === "\"" && text[i + 1] === "\"") {
        cell += "\"";
        i++;
      } else if (ch === "\"") {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === "\"") {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Trigger a file download in the browser; no-op during server rendering. */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const name = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
