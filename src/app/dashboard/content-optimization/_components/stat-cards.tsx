"use client"

import type { ContentOptResult } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { BookOpen, ClipboardCheck, FileText, Layers } from "lucide-react"
import type { ReactNode } from "react"

function Card({ icon: Icon, tint, label, value, bar, barTone, foot, sub, action }: {
  icon: typeof FileText
  tint: string
  label: string
  value: ReactNode
  /** 0-100 progress (null = no bar). */
  bar: number | null
  barTone: string
  foot: ReactNode
  sub?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col rounded-2xl border bg-card p-4 shadow-xs">
      <div className="flex items-start gap-3">
        <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", tint)}><Icon className="size-5" /></span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-2xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        {bar != null && <div className={cn("h-full rounded-full", barTone)} style={{ width: `${Math.max(2, Math.min(100, bar))}%` }} />}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{foot}</p>
      {sub && <p className="mt-0.5 text-xs">{sub}</p>}
      {action && <div className="mt-auto pt-2">{action}</div>}
    </div>
  )
}

/** Checks · content length · topic coverage · readability. */
export function StatCards({ result, onViewChecks }: { result: ContentOptResult; onViewChecks: () => void }) {
  const passed = result.checks.filter((c) => c.status === "pass").length
  const total = result.checks.length
  const words = result.page?.word_count ?? 0
  const target = result.benchmark?.word_count ? Math.round(result.benchmark.word_count) : null
  const low = target ? Math.round(target * 0.8) : 800
  const need = Math.max(0, low - words)
  const covered = result.terms.filter((t) => t.status !== "missing").length
  const termsPct = result.terms.length ? Math.round((covered / result.terms.length) * 100) : null
  const re = result.page?.reading_ease ?? null
  const reLabel = re == null ? "Too little text to measure" : re >= 60 ? "Easy to read" : re >= 50 ? "Fairly easy to read" : re >= 30 ? "Fairly difficult to read" : "Difficult to read"

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      <Card icon={ClipboardCheck} tint="bg-primary/10 text-primary" label="SEO checks passed" value={`${passed} / ${total}`}
        bar={total ? (passed / total) * 100 : null} barTone="bg-primary"
        foot={`${total - passed} check${total - passed === 1 ? "" : "s"} to improve`}
        action={<button type="button" onClick={onViewChecks} className="cursor-pointer text-xs font-medium text-primary hover:underline">View all checks →</button>} />
      <Card icon={FileText} tint="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" label="Content length"
        value={<>{words.toLocaleString()} <span className="text-base font-semibold">words</span></>}
        bar={target ? (words / target) * 100 : (words / 800) * 100} barTone="bg-emerald-500"
        foot={target ? `Top pages: about ${target.toLocaleString()} words` : "Recommended: 800+ words"}
        sub={need ? <span className="text-amber-700 dark:text-amber-400">About {need.toLocaleString()} more words needed</span>
          : <span className="text-emerald-700 dark:text-emerald-400">Long enough</span>} />
      <Card icon={Layers} tint="bg-teal-500/10 text-teal-600 dark:text-teal-400" label="Topic coverage"
        value={termsPct != null ? `${termsPct}%` : "—"} bar={termsPct} barTone="bg-teal-500"
        foot={termsPct != null ? `${covered} of ${result.terms.length} common topics covered` : "Needs top-ranking pages to compare"}
        sub={termsPct != null && termsPct < 100 ? <span className="text-teal-700 dark:text-teal-400">Add {result.terms.length - covered} more topics</span> : undefined} />
      <Card icon={BookOpen} tint="bg-rose-500/10 text-rose-600 dark:text-rose-400" label="Readability score"
        value={re != null ? Math.round(re) : "—"} bar={re} barTone={re != null && re >= 50 ? "bg-emerald-500" : "bg-amber-500"}
        foot={reLabel}
        sub={result.benchmark?.reading_ease != null ? <span className="text-muted-foreground">Top pages: {Math.round(result.benchmark.reading_ease)}</span> : undefined} />
    </div>
  )
}
