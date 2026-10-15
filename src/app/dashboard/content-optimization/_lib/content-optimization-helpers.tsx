import type { CheckStatus } from "@/lib/api/content-opt"

export function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "") + new URL(u).pathname.replace(/\/$/, "")
  } catch {
    return u.replace(/^https?:\/\//, "")
  }
}

/** Score band: ≥ 80 good, ≥ 50 needs work, else poor. */
export function scoreBand(score: number | null): { label: string; tone: "good" | "ok" | "poor" | "none" } {
  if (score === null) return { label: "Not scored", tone: "none" }
  if (score >= 80) return { label: "Good", tone: "good" }
  if (score >= 50) return { label: "Needs work", tone: "ok" }
  return { label: "Poor", tone: "poor" }
}

export function scoreBg(score: number | null): string {
  const t = scoreBand(score).tone
  if (t === "none") return "bg-muted text-muted-foreground"
  if (t === "good") return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  if (t === "ok") return "bg-amber-500/12 text-amber-700 dark:text-amber-400"
  return "bg-destructive/10 text-destructive"
}

export function scoreColor(score: number): string {
  const t = scoreBand(score).tone
  if (t === "good") return "text-emerald-600 dark:text-emerald-400"
  if (t === "ok") return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}

/** Stroke colour of the score ring. */
export function scoreStroke(score: number): string {
  const t = scoreBand(score).tone
  if (t === "good") return "#10b981"
  if (t === "ok") return "#f59e0b"
  return "#ef4444"
}

export const STATUS_STYLE: Record<CheckStatus, { text: string; bg: string; label: string }> = {
  pass: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", label: "Passed" },
  warn: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/12", label: "Improve" },
  fail: { text: "text-destructive", bg: "bg-destructive/10", label: "Fix" },
}

export function priorityStyle(p: string): string {
  if (p === "high") return "bg-destructive/10 text-destructive"
  if (p === "medium") return "bg-amber-500/12 text-amber-700 dark:text-amber-400"
  return "bg-primary/10 text-primary"
}

export const AREA_LABEL: Record<string, string> = {
  title: "Title", meta: "Meta", headings: "Headings", content: "Content", keywords: "Keywords",
  readability: "Readability", links: "Links", media: "Media",
}

/** Character-count verdict for a title (45-60) or meta description (130-155). */
export function lengthOk(kind: "title" | "meta", n: number): boolean {
  return kind === "title" ? n >= 30 && n <= 60 : n >= 120 && n <= 160
}

export const fmt = (n: number | null | undefined, digits = 0) =>
  n == null ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: digits })

/** One URL per line (or comma separated) → up to 5 cleaned URLs. */
export function parseUrls(text: string): string[] {
  return text.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean).slice(0, 5)
}
