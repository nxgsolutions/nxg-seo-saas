"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { DomainScoreTrendPoint, ScoredPage, SiteCheck } from "@/lib/api/domain-score"
import { cn, timeAgo } from "@/lib/utils"
import {
  AlertTriangle, ArrowRight, CheckCircle2, Gauge, Globe, Layers,
  Loader2, RefreshCw, ScanSearch, XCircle,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { useSiteScoreScreen } from "../_hooks/use-site-score-screen"
import {
  band, CATEGORY_LABELS, CATEGORY_ORDER, pageTypeLabel, scoreBar, scoreBg, scoreColor,
} from "../_lib/site-score-helpers"
import { ScoreGauge } from "./score-gauge"

const STATUS_ICON = {
  pass: { icon: CheckCircle2, className: "text-emerald-500" },
  warn: { icon: AlertTriangle, className: "text-amber-500" },
  fail: { icon: XCircle, className: "text-destructive" },
} as const

function SubScore({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-2xl font-semibold tabular-nums", scoreColor(score))}>{score}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", scoreBar(score))} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function CategoryBars({ averages }: { averages: Record<string, number> }) {
  const rows = CATEGORY_ORDER.filter((id) => averages[id] != null)
  if (rows.length === 0) return null
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Average by category</CardTitle>
        <CardDescription>Mean of each category across the scored pages.</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        {rows.map((id) => {
          const v = averages[id]
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
      </CardContent>
    </Card>
  )
}

function SiteChecks({ checks }: { checks: SiteCheck[] }) {
  if (checks.length === 0) return null
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Site-wide signals</CardTitle>
        <CardDescription>Crawlability and coverage that apply to the whole site.</CardDescription></CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {checks.map((c) => {
            const meta = STATUS_ICON[c.status]
            const Icon = meta.icon
            return (
              <li key={c.id} className="flex gap-2.5 px-5 py-3">
                <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} />
                <div className="min-w-0"><p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p></div>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

function Trend({ points }: { points: DomainScoreTrendPoint[] }) {
  if (points.length < 2) return null
  const w = 320, h = 60, pad = 4
  const xs = points.map((_, i) => pad + (i * (w - 2 * pad)) / (points.length - 1))
  const ys = points.map((p) => h - pad - (p.overall / 100) * (h - 2 * pad))
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ")
  const last = points[points.length - 1].overall
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Score over time</CardTitle>
        <CardDescription>Overall site score across your recent runs.</CardDescription></CardHeader>
      <CardContent>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-16 w-full" preserveAspectRatio="none" aria-hidden>
          <path d={d} fill="none" strokeWidth="2" className={cn("stroke-current", scoreColor(last))} />
        </svg>
        <p className="mt-1 text-xs text-muted-foreground">{points.length} runs · latest {last}/100</p>
      </CardContent>
    </Card>
  )
}

function Distribution({ good, needs, poor, worst }: { good: number; needs: number; poor: number; worst: ScoredPage[] }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Pages scored</CardTitle>
        <CardDescription>How the sampled pages break down, weakest first.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-emerald-500/10 py-2"><p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{good}</p><p className="text-xs text-muted-foreground">Good</p></div>
          <div className="rounded-lg bg-amber-500/12 py-2"><p className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">{needs}</p><p className="text-xs text-muted-foreground">Needs work</p></div>
          <div className="rounded-lg bg-destructive/10 py-2"><p className="text-lg font-semibold tabular-nums text-destructive">{poor}</p><p className="text-xs text-muted-foreground">Poor</p></div>
        </div>
        {worst.length > 0 && (
          <ul className="divide-y rounded-xl border">
            {worst.map((p) => (
              <li key={p.url} className="flex items-center gap-3 px-3 py-2">
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums", scoreBg(p.score))}>{p.score}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{p.url.replace(/^https?:\/\//, "")}</span>
                  <span className="text-xs text-muted-foreground">{pageTypeLabel(p.page_type)}</span>
                </span>
                <Link href={`/dashboard/page-score?url=${encodeURIComponent(p.url)}`}
                  className="shrink-0 text-xs font-medium text-primary hover:underline">Open</Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export default function SiteScorePage() {
  const s = useSiteScoreScreen()
  const { latest, running, job, jobError, error, domainName } = s
  const b = latest ? band(latest.overall) : null

  const RunButton = (
    <Button onClick={s.start} disabled={running || !s.domainId}>
      {running ? <><Loader2 className="size-4 animate-spin" /> Scoring…</>
        : latest ? <><RefreshCw className="size-4" /> Re-score site</>
        : <><Gauge className="size-4" /> Score site</>}
    </Button>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title={<><Globe className="size-5 text-primary" /> Site Score</>}
        description="One SEO score for the whole website — a weighted blend of your pages plus site-wide technical signals. Scores a representative sample and reuses recent page scores."
        actions={RunButton}
      />

      {running && (
        <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm" role="status" aria-busy="true">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span className="flex-1">{job?.step_label ?? "Starting…"}{job?.pages_total ? ` · ${job.pages_scored}/${job.pages_total} pages` : ""}</span>
        </div>
      )}

      {error && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</p>}

      {jobError && !running && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="flex-1 min-w-0">{jobError}</span>
          {/no pages/i.test(jobError) && (
            <Link href="/dashboard/page-discovery" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <ScanSearch className="size-3.5" /> Open Page Discovery
            </Link>
          )}
        </div>
      )}

      {s.loading ? (
        <div className="space-y-4"><Skeleton className="h-44 rounded-2xl" /><div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div></div>
      ) : latest ? (
        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
              <ScoreGauge score={latest.overall} />
              <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {b && <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", b.cls)}>{b.label}</span>}
                  <span className="text-xs text-muted-foreground">Updated {timeAgo(latest.created_at)}</span>
                </div>
                <h2 className="truncate text-lg font-semibold">{domainName}</h2>
                <p className="text-sm text-muted-foreground">
                  Scored {latest.pages_scored} of {latest.pages_total.toLocaleString()} discovered pages
                  {" "}· {latest.pages_indexable.toLocaleString()} indexable.
                </p>
                <div className="grid gap-2 pt-1 sm:grid-cols-2 sm:max-w-md">
                  <SubScore label="Page quality" score={latest.page_quality} />
                  <SubScore label="Site technical" score={latest.site_technical} />
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <CategoryBars averages={latest.category_averages} />
            <Distribution good={s.distribution.good} needs={s.distribution.needs} poor={s.distribution.poor} worst={s.worstPages} />
            <SiteChecks checks={latest.site_checks} />
            <Trend points={s.history} />
          </div>
        </div>
      ) : !running && !jobError ? (
        <section className="rounded-2xl border border-dashed bg-card/50 px-6 py-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Layers className="size-6" /></div>
          <h2 className="mt-3 text-base font-semibold">No site score yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Score this website to get one overall number from a sample of its pages plus site-wide checks. It uses Page Discovery to find pages, so run a scan first if you haven&apos;t.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            {RunButton}
            <Button variant="outline" render={<Link href="/dashboard/page-discovery" />}>Page Discovery <ArrowRight className="size-4" /></Button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
