"use client"

import * as React from "react"
import {
  BarChart3,
  Link2,
  ListChecks,
  MousePointerClick,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { type Domain } from "@/lib/api/workspaces"
import {
  GSC_FIRST_PAGE,
  useGscKeywords,
  useGscStatus,
} from "@/hooks/api/use-gsc"
import type { GscTrendPoint } from "@/lib/api/gsc"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ConnectGscDialog } from "@/components/dashboard/connect-gsc-dialog"
import { cn } from "@/lib/utils"

type Tone = "up" | "down" | "flat"

/** Period-over-period change over a window's trend: recent half vs prior half. */
function splitDelta(trend: GscTrendPoint[], pick: (p: GscTrendPoint) => number) {
  if (trend.length < 4) return null
  const mid = Math.floor(trend.length / 2)
  const sum = (arr: GscTrendPoint[]) => arr.reduce((s, p) => s + pick(p), 0)
  const prior = sum(trend.slice(0, mid))
  const recent = sum(trend.slice(mid))
  if (prior === 0) return null
  return ((recent - prior) / prior) * 100
}

/** Average position per half (lower is better) → improvement in places. */
function positionDelta(trend: GscTrendPoint[]) {
  if (trend.length < 4) return null
  const mid = Math.floor(trend.length / 2)
  const avg = (arr: GscTrendPoint[]) =>
    arr.reduce((s, p) => s + p.position, 0) / Math.max(1, arr.length)
  const prior = avg(trend.slice(0, mid))
  const recent = avg(trend.slice(mid))
  if (!prior || !recent) return null
  return prior - recent // positive = moved up the page
}

function DeltaChip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  if (tone === "flat") return null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        tone === "up"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-destructive/10 text-destructive",
      )}
    >
      {tone === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {children}
    </span>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  sub,
}: {
  icon: typeof Search
  label: string
  value: string
  delta?: React.ReactNode
  sub?: string
}) {
  return (
    <Card className="dashboard-stat">
      <CardHeader className="flex-row items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="dashboard-icon"><Icon aria-hidden="true" className="size-4" /></span>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <p className="dashboard-stat-value">{value}</p>
          {delta}
        </div>
        {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
      </CardContent>
    </Card>
  )
}

/**
 * Outcome-first hero for the dashboard: the four numbers that answer "how is my
 * search doing?" — clicks, impressions, average position and keywords ranking,
 * each with its period-over-period move. Real GSC data only; until Search
 * Console is connected it shows a single connect prompt instead of empty cards.
 */
export function SearchKpis({
  workspaceId,
  domain,
}: {
  workspaceId: string | null
  domain: Domain | null
}) {
  const [connectOpen, setConnectOpen] = React.useState(false)
  const status = useGscStatus(workspaceId)
  const connected = Boolean(status.data?.connected)
  const perf = useGscKeywords(
    workspaceId,
    domain?.id ?? null,
    28,
    GSC_FIRST_PAGE,
    connected,
  )
  const data = perf.data ?? null
  const loading =
    status.isPending || (connected && Boolean(domain) && perf.isPending)

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" role="status" aria-busy="true">
        <span className="sr-only">Loading search performance…</span>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>
    )
  }

  // Not connected (or no domain / no data yet) → one clear prompt, not four blanks.
  if (!connected || !data) {
    return (
      <>
        <Card className="dashboard-setup">
          <CardContent className="flex flex-col items-start gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <Link2 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {connected ? "No search data for this website yet" : "See your real search performance"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {connected
                    ? "Google hasn't returned data for this site. It can take a day or two after connecting."
                    : "Connect Google Search Console to track clicks, impressions, average position and ranking keywords."}
                </p>
              </div>
            </div>
            {!connected ? (
              <Button className="shrink-0" onClick={() => setConnectOpen(true)}>
                <Link2 className="size-4" /> Connect Search Console
              </Button>
            ) : null}
          </CardContent>
        </Card>
        <ConnectGscDialog
          workspaceId={workspaceId}
          open={connectOpen}
          onOpenChange={setConnectOpen}
          returnPath="/dashboard"
        />
      </>
    )
  }

  const clicksPct = splitDelta(data.trend, (p) => p.clicks)
  const imprPct = splitDelta(data.trend, (p) => p.impressions)
  const posChange = positionDelta(data.trend)
  const d = data.distribution

  const pctChip = (pct: number | null) => {
    if (pct === null || Math.abs(pct) < 1) return undefined
    const tone: Tone = pct > 0 ? "up" : "down"
    return <DeltaChip tone={tone}>{pct > 0 ? "+" : ""}{Math.round(pct)}%</DeltaChip>
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KpiCard
        icon={MousePointerClick}
        label="Clicks"
        value={Math.round(data.total_clicks).toLocaleString()}
        delta={pctChip(clicksPct)}
        sub="Last 28 days"
      />
      <KpiCard
        icon={Search}
        label="Impressions"
        value={Math.round(data.total_impressions).toLocaleString()}
        delta={pctChip(imprPct)}
        sub="Last 28 days"
      />
      <KpiCard
        icon={BarChart3}
        label="Avg. position"
        value={data.avg_position.toFixed(1)}
        delta={
          posChange !== null && Math.abs(posChange) >= 0.1 ? (
            <DeltaChip tone={posChange > 0 ? "up" : "down"}>
              {posChange > 0 ? "↑" : "↓"} {Math.abs(posChange).toFixed(1)}
            </DeltaChip>
          ) : undefined
        }
        sub="Across ranking keywords"
      />
      <KpiCard
        icon={ListChecks}
        label="Keywords ranking"
        value={data.keyword_count.toLocaleString()}
        sub={`${d.top3.toLocaleString()} in top 3 · ${d.top10.toLocaleString()} in top 10`}
      />
    </div>
  )
}
