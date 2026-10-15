import type { ChangeImpact, WindowStats } from "@/lib/api/pages"

export const SOURCE_LABEL: Record<string, string> = {
  audit: "Page Audit",
  content: "Content Optimization",
  inspect: "Title & Meta",
}

export function hostPath(url: string): string {
  try {
    const u = new URL(url)
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "/" : u.pathname.replace(/\/$/, ""))
  } catch {
    return url.replace(/^https?:\/\//, "")
  }
}

export function fmtDate(iso: string, withTime = false): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

/** ISO day (yyyy-mm-dd) in local time. */
export function isoDay(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function pctChange(before: number, after: number): number | null {
  if (!before) return after ? null : 0
  return Math.round(((after - before) / before) * 100)
}

/** Daily averages make windows of different length comparable. */
export function perDay(w: WindowStats | null, key: "clicks" | "impressions"): number | null {
  return w && w.days ? w[key] / w.days : null
}

export type ImpactVerdict = "better" | "worse" | "flat" | "early" | "none"

/** Did search results improve after the change? Clicks per day first, then position. */
export function impactVerdict(i: ChangeImpact | undefined): ImpactVerdict {
  if (!i) return "none"
  if (i.too_early) return i.before ? "early" : "none"
  if (!i.before || !i.after) return "none"
  const cb = perDay(i.before, "clicks") ?? 0
  const ca = perDay(i.after, "clicks") ?? 0
  const change = pctChange(cb, ca)
  if (change !== null && Math.abs(change) >= 10 && Math.abs(ca - cb) >= 0.3) return change > 0 ? "better" : "worse"
  const pb = i.before.position, pa = i.after.position
  if (pb && pa && Math.abs(pb - pa) >= 1) return pa < pb ? "better" : "worse"
  return "flat"
}
