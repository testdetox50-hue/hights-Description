import { useCallback, useState } from "react";

export type CsvColumn<T> = {
  /** Header text. */
  header: string;
  /** Property name, or a function that derives the cell value. */
  value: keyof T | ((row: T) => unknown);
};

export type CsvOptions = {
  /** Field separator. Default ",". */
  delimiter?: string;
  /** Prepend a UTF-8 BOM so Excel detects the encoding. Default true. */
  bom?: boolean;
};

/** Converts any value to a safe CSV cell (quotes, delimiters, newlines, formula injection). */
export function toCsvCell(value: unknown, delimiter = ","): string {
  if (value === null || value === undefined) {
    return "";
  }
  let text = value instanceof Date ? value.toISOString() : typeof value === "object" ? JSON.stringify(value) : String(value);
  // Neutralise spreadsheet formula injection (=, +, -, @ at the start of text).
  if (typeof value === "string" && /^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  const needsQuotes = text.includes('"') || text.includes(delimiter) || /[\r\n]/.test(text);
  return needsQuotes ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Builds a CSV string from rows and column definitions. */
export function buildCsv<T>(rows: readonly T[], columns: readonly CsvColumn<T>[], options: CsvOptions = {}): string {
  const { delimiter = "," } = options;
  const lines = [
    columns.map((column) => toCsvCell(column.header, delimiter)).join(delimiter),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const raw = typeof column.value === "function" ? column.value(row) : row[column.value];
          return toCsvCell(raw, delimiter);
        })
        .join(delimiter)
    )
  ];
  return lines.join("\r\n");
}

export type UseCsvExportResult<T> = {
  /** Builds the CSV and triggers a browser download. */
  exportCsv: (rows: readonly T[], filename?: string) => boolean;
  /** Builds the CSV text without downloading it. */
  toCsv: (rows: readonly T[]) => string;
  /** True for a short moment after a download was triggered. */
  isExporting: boolean;
};

/**
 * Exports arrays of objects as a downloadable CSV file (browser only).
 *
 * @example
 * const { exportCsv } = useCsvExport<Employee>([
 *   { header: "Name", value: "fullName" },
 *   { header: "Role", value: (e) => e.role.toUpperCase() }
 * ]);
 * exportCsv(employees, "employees.csv");
 */
export function useCsvExport<T>(columns: readonly CsvColumn<T>[], options: CsvOptions = {}): UseCsvExportResult<T> {
  const [isExporting, setIsExporting] = useState(false);
  const { delimiter, bom = true } = options;

  const toCsv = useCallback(
    (rows: readonly T[]) => buildCsv(rows, columns, { delimiter }),
    [columns, delimiter]
  );

  const exportCsv = useCallback(
    (rows: readonly T[], filename = "export.csv") => {
      if (typeof window === "undefined" || typeof document === "undefined") {
        return false;
      }
      const name = filename.toLowerCase().endsWith(".csv") ? filename : `${filename}.csv`;
      const blob = new Blob([(bom ? "﻿" : "") + toCsv(rows)], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setIsExporting(true);
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setIsExporting(false);
      }, 500);
      return true;
    },
    [bom, toCsv]
  );

  return { exportCsv, toCsv, isExporting };
}
