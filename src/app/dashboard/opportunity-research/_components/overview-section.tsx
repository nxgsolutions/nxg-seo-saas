"use client"

import { OpportunityTrendChart, type OppTrendPoint } from "@/components/charts/opportunity-trend-chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOpportunityOverview } from "@/hooks/api/use-opportunity"
import { type OppTrendPointApi } from "@/lib/api/opportunity"
import { cn } from "@/lib/utils"
import * as React from "react"
import { METRICS } from "../_lib/opportunity-research-helpers"

export function OverviewSection({ wid, did }: { wid: string; did: string }) {
  const [metric, setMetric] = React.useState<(typeof METRICS)[number]["key"]>("search_volume")
  // Tiles + volume change + metric trend (TanStack Query, cached per website).
  const query = useOpportunityOverview(wid, did)
  const overview = query.data?.overview ?? null
  const series = query.data?.series ?? []
  const points = query.data?.points ?? []
  const metricLabel = METRICS.find((m) => m.key === metric)!.label
  const trendData: OppTrendPoint[] = metric === "search_volume"
    ? series.map((p) => ({ label: p.month, value: p.volume }))
    : points.map((p) => ({ label: p.label, value: (p[metric as keyof OppTrendPointApi] as number) ?? 0 }))

  if (query.isPending) {
    return (
      <div className="space-y-5" role="status" aria-busy="true">
        <span className="sr-only">Loading opportunity data…</span>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i}><CardContent className="space-y-2 py-4"><Skeleton className="h-3 w-20" /><Skeleton className="h-7 w-16" /></CardContent></Card>
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {/* Real numbers only; show a change arrow only when there's a real delta. */}
        {(overview?.kpis ?? []).filter((k) => k.value !== "0").map((k) => (
          <Card key={k.label}>
            <CardContent className="py-4">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="ds-kpi">{k.value}</p>
                {k.delta !== 0 ? (
                  <span className={cn("text-xs font-medium", k.up ? "text-emerald-600" : "text-red-500")}>
                    {k.up ? "↑" : "↓"} {Math.abs(k.delta)}%
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="text-base">{metricLabel} Trend</CardTitle>
            <CardDescription>
              {metric === "search_volume"
                ? "Live · total search volume across tracked keywords (12 months)"
                : "Live · needs your search data for organic traffic/position"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap rounded-lg border border-border p-0.5">
            {METRICS.map((m) => (
              <button key={m.key} onClick={() => setMetric(m.key)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  metric === m.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                {m.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {trendData.length === 0 || trendData.every((d) => !d.value) ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No {metricLabel.toLowerCase()} data yet — connect your search data to populate this.
            </div>
          ) : (
            <OpportunityTrendChart data={trendData} label={metricLabel} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
