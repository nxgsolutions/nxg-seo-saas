import { type AuditSummary } from "@/lib/api/audits"
import { type CheckStatus } from "@/lib/api/tools"
import {
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react"

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500"
  if (score >= 50) return "text-amber-500"
  return "text-destructive"
}

export function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  if (score >= 50) return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return "bg-destructive/10 text-destructive"
}

export function computeDeltas(history: AuditSummary[]): Record<string, number | null> {
  const chrono = [...history].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const lastScore: Record<string, number> = {}
  const deltas: Record<string, number | null> = {}
  for (const a of chrono) {
    const prev = lastScore[a.url]
    deltas[a.id] = prev === undefined ? null : a.score - prev
    lastScore[a.url] = a.score
  }
  return deltas
}

export const STATUS_META: Record<CheckStatus, { icon: typeof CheckCircle2; className: string; ring: string }> = {
  pass: { icon: CheckCircle2, className: "text-emerald-500", ring: "bg-emerald-500/10" },
  warn: { icon: AlertTriangle, className: "text-amber-500", ring: "bg-amber-500/10" },
  fail: { icon: XCircle, className: "text-destructive", ring: "bg-destructive/10" },
}

export const CHECK_CATEGORY: Record<string, string> = {
  status: "Technical", https: "Technical", viewport: "Technical", lang: "Technical", indexable: "Technical", canonical: "Technical",
  title: "Meta & Tags", description: "Meta & Tags", og: "Meta & Tags", schema: "Meta & Tags", charset: "Meta & Tags",
  h1: "Content", content: "Content", img_alt: "Content",
  speed: "Performance", size: "Performance",
}

export const CATEGORY_ORDER = ["Content", "Meta & Tags", "Technical", "Performance", "Other"]

export function categorize<T extends { id: string; status: CheckStatus }>(checks: T[]) {
  const groups = new Map<string, T[]>()
  for (const c of checks) {
    const cat = CHECK_CATEGORY[c.id] ?? "Other"
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(c)
  }
  return CATEGORY_ORDER.filter((c) => groups.has(c)).map((cat) => {
    const items = groups.get(cat)!
    return {
      category: cat,
      items,
      pass: items.filter((i) => i.status === "pass").length,
      warn: items.filter((i) => i.status === "warn").length,
      fail: items.filter((i) => i.status === "fail").length,
    }
  })
}
