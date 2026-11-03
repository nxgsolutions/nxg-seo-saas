"use client"

import { ScoreGauge } from "@/app/dashboard/site-score/_components/score-gauge"
import { band, CATEGORY_LABELS, CATEGORY_ORDER, scoreBar, scoreColor } from "@/app/dashboard/site-score/_lib/site-score-helpers"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { StoredPageScore } from "@/lib/api/page-score"
import { cn } from "@/lib/utils"
import { FormattedDate } from "@/components/ui/formatted-date"
import { AlertTriangle, CheckCircle2, Gauge, Loader2, XCircle } from "lucide-react"

const STATUS_ICON = {
  pass: { icon: CheckCircle2, className: "text-emerald-500" },
  warn: { icon: AlertTriangle, className: "text-amber-500" },
  fail: { icon: XCircle, className: "text-destructive" },
} as const

/**
 * A page's last saved score, shown instantly (no fetch) when a page is opened
 * from the whole-site breakdown. "Re-audit this page" runs a fresh full audit.
 */
export function StoredScoreCard({ score, running, onReaudit }: {
  score: StoredPageScore; running: boolean; onReaudit: () => void
}) {
  const overall = score.overall ?? score.audit_score ?? 0
  const b = band(overall)
  const cats = CATEGORY_ORDER.filter((id) => score.category_scores[id] != null)
  const notPassing = score.checks.filter((c) => c.status !== "pass")

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-5 py-5 sm:flex-row sm:items-center">
          <ScoreGauge score={overall} />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", b.cls)}>{b.label}</span>
              <span className="text-xs text-muted-foreground">Last scored <FormattedDate value={score.captured_at} /></span>
            </div>
            <p className="truncate text-sm font-medium">{score.url.replace(/^https?:\/\//, "")}</p>
            <p className="text-xs text-muted-foreground">This is the saved score from your last site check. Re-audit for the full, up-to-date report.</p>
            <Button onClick={onReaudit} disabled={running} size="sm" className="mt-1">
              {running ? <><Loader2 className="size-4 animate-spin" /> Auditing…</> : <><Gauge className="size-4" /> Re-audit this page</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {cats.length > 0 && (
        <Card><CardContent className="space-y-3 py-5">
          <h3 className="text-sm font-semibold">Score by category</h3>
          {cats.map((id) => {
            const v = score.category_scores[id]
            return (
              <div key={id} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm">{CATEGORY_LABELS[id]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", scoreBar(v))} style={{ width: `${v}%` }} />
                </div>
                <span className={cn("w-8 shrink-0 text-right text-sm font-semibold tabular-nums", scoreColor(v))}>{v}</span>
              </div>
            )
          })}
        </CardContent></Card>
      )}

      {notPassing.length > 0 && (
        <Card><CardContent className="py-5">
          <h3 className="mb-2 text-sm font-semibold">Issues found <span className="text-muted-foreground">({notPassing.length})</span></h3>
          <ul className="divide-y rounded-xl border">
            {notPassing.map((c) => {
              const meta = STATUS_ICON[c.status]
              const Icon = meta.icon
              return (
                <li key={c.id} className="flex items-center gap-2.5 px-3 py-2.5">
                  <Icon className={cn("size-4 shrink-0", meta.className)} />
                  <span className="text-sm">{c.label}</span>
                </li>
              )
            })}
          </ul>
        </CardContent></Card>
      )}
    </div>
  )
}
