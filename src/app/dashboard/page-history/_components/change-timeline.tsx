"use client"

import { ChangeRow } from "@/components/dashboard/page-changes"
import type { ChangeImpact, PageSnapshot } from "@/lib/api/pages"
import { cn } from "@/lib/utils"
import {
  ArrowRight, CheckCircle2, ChevronDown, Clock, FileText, Gauge, Hourglass, Minus, Sparkles, Tags, TrendingDown, TrendingUp,
} from "lucide-react"
import * as React from "react"
import {
  fmtDate, impactVerdict, pctChange, perDay, SOURCE_LABEL,
} from "../_lib/page-history-helpers"

const SOURCE_ICON: Record<string, typeof Gauge> = { audit: Gauge, content: Sparkles, inspect: Tags }

function Delta({ label, before, after, lowerIsBetter = false, digits = 0 }: {
  label: string; before: number | null; after: number | null; lowerIsBetter?: boolean; digits?: number
}) {
  if (before == null || after == null) return null
  const diff = after - before
  const good = lowerIsBetter ? diff < 0 : diff > 0
  const pct = lowerIsBetter ? null : pctChange(before, after)
  const f = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: digits })
  return (
    <div className="rounded-lg border bg-background/60 px-2.5 py-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="flex items-center gap-1 text-sm font-semibold tabular-nums">
        {f(before)} <ArrowRight className="size-3 text-muted-foreground" /> {f(after)}
        {Math.abs(diff) > (digits ? 0.05 : 0) && (
          <span className={cn("text-xs font-medium", good ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
            {pct !== null && pct !== 0 ? `${pct > 0 ? "+" : ""}${pct}%` : diff > 0 ? `+${f(diff)}` : f(diff)}
          </span>
        )}
      </p>
    </div>
  )
}

/** Search results before vs after one change (per-day averages over equal windows). */
function Impact({ impact, windowDays }: { impact: ChangeImpact | undefined; windowDays: number }) {
  const v = impactVerdict(impact)
  if (v === "none") return null
  if (v === "early") {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Hourglass className="size-3.5" /> Too early to judge — {impact!.after_days} of 7+ days of search data since this change.
      </p>
    )
  }
  const i = impact!
  const head = {
    better: { icon: TrendingUp, text: "Search results improved after this change", cls: "text-emerald-700 dark:text-emerald-400" },
    worse: { icon: TrendingDown, text: "Search results dropped after this change", cls: "text-destructive" },
    flat: { icon: Minus, text: "No clear change in search results yet", cls: "text-muted-foreground" },
  }[v]
  const Icon = head.icon
  return (
    <div className="mt-3 rounded-xl border border-dashed p-3">
      <p className={cn("flex items-center gap-1.5 text-xs font-semibold", head.cls)}><Icon className="size-3.5" /> {head.text}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">
        {windowDays} days before vs {i.after!.days} days after · clicks and impressions are per-day averages
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Delta label="Clicks / day" before={perDay(i.before, "clicks")} after={perDay(i.after, "clicks")} digits={1} />
        <Delta label="Impressions / day" before={perDay(i.before, "impressions")} after={perDay(i.after, "impressions")} digits={0} />
        <Delta label="Avg. position" before={i.before!.position} after={i.after!.position} lowerIsBetter digits={1} />
        <Delta label="CTR %" before={i.before!.ctr * 100} after={i.after!.ctr * 100} digits={1} />
      </div>
    </div>
  )
}

/** Newest first. Checks without changes are folded into "N checks with no changes". */
export function ChangeTimeline({ snapshots, impacts, windowDays }: {
  snapshots: PageSnapshot[]
  impacts: ChangeImpact[]
  windowDays: number
}) {
  const [showQuiet, setShowQuiet] = React.useState(false)
  const byId = new Map(impacts.map((i) => [i.snapshot_id, i]))
  const changed = snapshots.filter((s) => s.changes.length > 0)
  const quiet = snapshots.length - changed.length
  const first = snapshots[snapshots.length - 1]
  const visible = showQuiet ? snapshots : changed

  return (
    <section className="rounded-2xl border bg-card shadow-xs" aria-label="Change history">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Clock className="size-4 text-primary" /> What changed, and what happened next</h3>
          <p className="text-xs text-muted-foreground">
            {changed.length ? `${changed.length} change${changed.length === 1 ? "" : "s"} detected` : "No changes detected yet"}
            {quiet ? ` · ${quiet} check${quiet === 1 ? "" : "s"} with no changes` : ""}
          </p>
        </div>
        {quiet > 0 && (
          <button type="button" onClick={() => setShowQuiet(!showQuiet)}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ChevronDown className={cn("size-3.5 transition-transform", showQuiet && "rotate-180")} />
            {showQuiet ? "Hide" : "Show"} checks with no changes
          </button>
        )}
      </header>

      {visible.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          <FileText className="mx-auto mb-2 size-6" />
          {first ? <>First saved on {fmtDate(first.captured_at)}. </> : null}
          Edit the page, then run Page Audit (or Content Optimization) again — every difference is listed here with its date.
        </div>
      ) : (
        <ol className="relative px-4 py-3 sm:px-5">
          {visible.map((s, idx) => {
            const Icon = SOURCE_ICON[s.source] ?? Gauge
            const isFirst = s.id === first?.id
            return (
              <li key={s.id} className="relative pb-5 pl-8 last:pb-1">
                {idx < visible.length - 1 && <span className="absolute left-[11px] top-7 bottom-0 w-px bg-border" aria-hidden="true" />}
                <span className={cn("absolute left-0 top-0.5 flex size-6 items-center justify-center rounded-full border bg-card",
                  s.changes.length ? "border-primary/40 text-primary" : "text-muted-foreground")}>
                  {s.changes.length ? <Icon className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                </span>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <p className="text-sm font-semibold">{fmtDate(s.captured_at, true)}</p>
                  <span className="text-xs text-muted-foreground">
                    {SOURCE_LABEL[s.source] ?? s.source}{s.device ? ` · ${s.device}` : ""}{s.keyword ? ` · “${s.keyword}”` : ""}
                  </span>
                  {s.audit_score != null && <span className="rounded bg-muted px-1.5 text-[11px] font-medium tabular-nums">Audit {s.audit_score}</span>}
                  {s.content_score != null && <span className="rounded bg-muted px-1.5 text-[11px] font-medium tabular-nums">Content {s.content_score}</span>}
                </div>
                {s.changes.length ? (
                  <ul className="mt-1 divide-y">{s.changes.map((c, i) => <ChangeRow key={`${c.field}-${i}`} c={c} />)}</ul>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground">{isFirst ? "First time this page was saved." : "No changes since the previous check."}</p>
                )}
                {s.changes.length > 0 && <Impact impact={byId.get(s.id)} windowDays={windowDays} />}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
