"use client"

import type { ScoreCategory, ScoreCheck } from "@/lib/api/page-score"
import type { CheckStatus } from "@/lib/api/tools"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, ChevronDown, XCircle } from "lucide-react"
import { scoreBar, scoreColor } from "../_lib/page-score-helpers"

const STATUS: Record<CheckStatus, { icon: typeof CheckCircle2; className: string }> = {
  pass: { icon: CheckCircle2, className: "text-emerald-500" },
  warn: { icon: AlertTriangle, className: "text-amber-500" },
  fail: { icon: XCircle, className: "text-destructive" },
}

function CheckRow({ check }: { check: ScoreCheck }) {
  const meta = STATUS[check.status]
  const Icon = meta.icon
  return (
    <li className="flex gap-2.5 px-4 py-2.5">
      <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="text-sm font-medium">{check.label}</span>
          {check.detail && <span className="text-xs text-muted-foreground tabular-nums">{check.detail}</span>}
        </div>
        {check.status !== "pass" && check.tip && (
          <p className="mt-0.5 text-xs text-muted-foreground">{check.tip}</p>
        )}
      </div>
    </li>
  )
}

function CategoryCard({ cat }: { cat: ScoreCategory }) {
  const score = cat.score
  const fail = cat.checks.filter((c) => c.status === "fail").length
  const warn = cat.checks.filter((c) => c.status === "warn").length
  const pass = cat.checks.filter((c) => c.status === "pass").length

  return (
    <details className="group overflow-hidden rounded-2xl border bg-card shadow-xs">
      <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-sm font-semibold">{cat.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground">Weight {cat.weight}%</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full transition-all", score != null ? scoreBar(score) : "bg-muted-foreground/30")}
                style={{ width: `${score ?? 0}%` }} />
            </div>
            <span className={cn("w-12 shrink-0 text-right text-sm font-semibold tabular-nums", score != null ? scoreColor(score) : "text-muted-foreground")}>
              {score != null ? `${score}` : "—"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
            {fail > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 font-medium text-destructive"><XCircle className="size-3" /> {fail}</span>}
            {warn > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-1.5 py-0.5 font-medium text-amber-700 dark:text-amber-400"><AlertTriangle className="size-3" /> {warn}</span>}
            {pass > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-3" /> {pass}</span>}
          </div>
        </div>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      {cat.checks.length > 0 ? (
        <ul className="divide-y border-t">{cat.checks.map((c) => <CheckRow key={c.id} check={c} />)}</ul>
      ) : (
        <p className="border-t px-4 py-3 text-sm text-muted-foreground">Nothing to measure in this category for this page.</p>
      )}
    </details>
  )
}

/** The six weighted categories, each expandable to its checks and fixes. */
export function CategoryBreakdown({ categories }: { categories: ScoreCategory[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {categories.map((cat) => <CategoryCard key={cat.id} cat={cat} />)}
    </div>
  )
}
