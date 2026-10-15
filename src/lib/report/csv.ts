/** Tiny CSV builder + download helper (no dependencies). */

function esc(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.map(esc).join(",")]
  for (const row of rows) lines.push(row.map(esc).join(","))
  return lines.join("\r\n")
}

/** Download rows as a .csv file. Prepends a BOM so Excel reads UTF-8 correctly. */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const csv = "﻿" + toCsv(headers, rows)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
