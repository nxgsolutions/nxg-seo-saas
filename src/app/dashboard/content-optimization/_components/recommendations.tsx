"use client"

import type { ContentOptResult } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { AlertCircle, ArrowRight, CheckCircle2, Lightbulb, Sparkles } from "lucide-react"
import * as React from "react"
import { recommendations, type RecPriority } from "../_lib/insights"
import { CopyButton } from "./copy-button"

type Filter = "all" | RecPriority

const STYLE: Record<RecPriority, { label: string; dot: string; card: string; icon: typeof AlertCircle; iconCls: string; badge: string }> = {
  high: { label: "High priority", dot: "bg-destructive", card: "border-destructive/25 bg-destructive/[0.03] border-l-4 border-l-destructive",
    icon: AlertCircle, iconCls: "text-destructive", badge: "bg-destructive/10 text-destructive" },
  opportunity: { label: "Opportunity", dot: "bg-amber-500", card: "border-amber-500/25 bg-amber-500/[0.03] border-l-4 border-l-amber-500",
    icon: Lightbulb, iconCls: "text-amber-600 dark:text-amber-400", badge: "bg-amber-500/12 text-amber-700 dark:text-amber-400" },
  good: { label: "Good", dot: "bg-emerald-500", card: "border-emerald-500/20 border-l-4 border-l-emerald-500",
    icon: CheckCircle2, iconCls: "text-emerald-600 dark:text-emerald-400", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
}

/** Rule checks + AI suggestions as one prioritized list with filters. */
export const Recommendations = React.forwardRef<HTMLElement, { result: ContentOptResult }>(function Recommendations({ result }, ref) {
  const all = React.useMemo(() => recommendations(result), [result])
  const [filter, setFilter] = React.useState<Filter>("all")
  const count = (p: RecPriority) => all.filter((r) => r.priority === p).length
  // "All" = what still needs work; passed checks live under "Good".
  const items = filter === "all" ? all.filter((r) => r.priority !== "good") : all.filter((r) => r.priority === filter)
  const pills: { value: Filter; label: string; n: number; dot?: string }[] = [
    { value: "all", label: "All", n: all.length - count("good") },
    { value: "high", label: "High priority", n: count("high"), dot: STYLE.high.dot },
    { value: "opportunity", label: "Opportunities", n: count("opportunity"), dot: STYLE.opportunity.dot },
    { value: "good", label: "Good", n: count("good"), dot: STYLE.good.dot },
  ]

  return (
    <section ref={ref} className="scroll-mt-4 rounded-2xl border bg-card p-5 shadow-xs" aria-label="Recommended improvements">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Recommended improvements</h2>
          <p className="text-sm text-muted-foreground">Follow these to improve your content and get a higher score.</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter recommendations">
          {pills.map((p) => (
            <button key={p.value} type="button" role="tab" aria-selected={filter === p.value} onClick={() => setFilter(p.value)}
              className={cn("inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                filter === p.value ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-muted")}>
              {p.dot && <span className={cn("size-2 rounded-full", p.dot)} aria-hidden="true" />}
              {p.label} ({p.n})
            </button>
          ))}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          {filter === "good" ? "No checks passed yet." : "Nothing to fix here — great work."}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((rec) => {
            const st = STYLE[rec.priority]
            const Icon = st.icon
            return (
              <li key={rec.id} className={cn("rounded-xl border p-4", st.card)}>
                <div className="flex gap-3">
                  <Icon className={cn("mt-0.5 size-5 shrink-0", st.iconCls)} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{rec.title}</p>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", st.badge)}>{st.label}</span>
                      {rec.source === "ai" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          <Sparkles className="size-3" /> AI
                        </span>
                      )}
                    </div>
                    {rec.text && <p className="mt-1 text-sm text-muted-foreground">{rec.text}</p>}
                    {rec.suggested && (
                      <div className="mt-3 grid gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-stretch">
                        {rec.current !== undefined && (
                          <>
                            <div className="rounded-lg border bg-background px-3 py-2">
                              <p className="text-xs font-semibold">Current</p>
                              <p className="mt-0.5 break-words text-sm text-muted-foreground">{rec.current || "— (missing)"}</p>
                            </div>
                            <ArrowRight className="hidden size-4 self-center text-muted-foreground md:block" aria-hidden="true" />
                          </>
                        )}
                        <div className={cn("rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2", rec.current === undefined && "md:col-span-3")}>
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Suggested (AI)</p>
                            <CopyButton text={rec.suggested} iconOnly label="Copy suggestion" className="-my-1.5 -mr-1.5" />
                          </div>
                          <p className="mt-0.5 break-words text-sm">{rec.suggested}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
})
