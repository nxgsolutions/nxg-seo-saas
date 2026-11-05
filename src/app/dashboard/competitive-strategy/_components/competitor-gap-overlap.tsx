"use client"

/**
 * Gap & Overlap Analysis — keyword overlap vs gap per competitor.
 *
 * Built from our SERP footprint (opportunityApi.strategy, DB-only):
 *  - overlap / common = tracked keywords we BOTH rank for;
 *  - gap = keywords they rank for and we don't (the opportunity).
 *
 * Lightweight CSS bars (no extra chart dependency) keep it on-theme in both modes.
 */
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { OpportunityStrategy } from "@/lib/api/opportunity"

const OVERLAP = "var(--chart-2)"
const GAP = "var(--chart-4)"

export function CompetitorGapOverlap({
  strategy,
  search = "",
}: {
  strategy: OpportunityStrategy | null
  /** Substring filter on competitor domain (from the page's "Search in results"). */
  search?: string
}) {
  const competitors = strategy?.competitors ?? []
  const q = search.trim().toLowerCase()
  const ranking = competitors.filter(
    (c) => c.keywords_shared > 0 && (!q || c.domain.toLowerCase().includes(q)),
  )

  if (!strategy || ranking.length === 0) {
    return (
      <Card>
        <CardContent className="space-y-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No keyword overlap found yet. Open a keyword&apos;s Google results to record
            who ranks for your tracked keywords, then the gap fills in here.
          </p>
          <Button variant="outline" size="sm" render={<Link href="/dashboard/keyword-analysis" />}>
            Go to Keyword Analysis
          </Button>
        </CardContent>
      </Card>
    )
  }

  const coverage = strategy.total_keywords
    ? Math.round((strategy.our_ranked / strategy.total_keywords) * 100)
    : 0
  // Sort by the biggest gap (most keywords they rank for and we don't).
  const sorted = [...ranking].sort((a, b) => b.gap_keywords - a.gap_keywords)
  const maxTotal = Math.max(1, ...sorted.map((c) => c.common_keywords + c.gap_keywords))

  return (
    <div className="space-y-5">
      {/* KPI strip. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Tracked keywords</p>
          <p className="mt-1 ds-kpi">{strategy.total_keywords.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">You rank for</p>
          <p className="mt-1 ds-kpi">{strategy.our_ranked.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-muted-foreground">({coverage}%)</span></p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Competitors ranking</p>
          <p className="mt-1 ds-kpi">{ranking.length}
            <span className="ml-1 text-sm font-normal text-muted-foreground">of {competitors.length}</span></p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Largest gap</p>
          <p className="mt-1 ds-kpi">{sorted[0].gap_keywords.toLocaleString()}
            <span className="ml-1 text-sm font-normal text-muted-foreground">kw</span></p>
        </CardContent></Card>
      </div>

      {/* Per-competitor overlap vs gap. */}
      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold leading-tight">Keyword overlap &amp; gap</h2>
              <p className="ds-meta">On your tracked keywords, how much each competitor overlaps with you and where they rank and you don&apos;t.</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: OVERLAP }} /> Overlap
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ background: GAP }} /> Gap
              </span>
            </div>
          </div>

          <ul className="space-y-4">
            {sorted.map((c) => {
              const total = c.common_keywords + c.gap_keywords
              const width = (total / maxTotal) * 100
              const commonPct = total ? (c.common_keywords / total) * 100 : 0
              return (
                <li key={c.domain} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{c.domain}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.common_keywords}</span> overlap ·{" "}
                      <span className="font-semibold text-foreground">{c.gap_keywords}</span> gap
                      {c.avg_position != null && <> · avg #{Math.round(c.avg_position)}</>}
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div className="flex h-full" style={{ width: `${width}%` }}>
                      <div style={{ width: `${commonPct}%`, background: OVERLAP }} />
                      <div style={{ width: `${100 - commonPct}%`, background: GAP }} />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
