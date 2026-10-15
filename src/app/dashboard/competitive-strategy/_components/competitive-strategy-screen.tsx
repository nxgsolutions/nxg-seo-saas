"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { cn } from "@/lib/utils"
import { useCompetitiveStrategyScreen } from "../_hooks/use-competitive-strategy-screen"
import { CompetitorAnalyticsCard } from "./competitor-analytics-card"
import { CompetitorBenchmarkCharts } from "@/components/charts/lazy"
import { CompetitorFootprintTable } from "./competitor-footprint-table"
import { RankedKeywordsCard } from "./ranked-keywords-card"

export default function CompetitiveStrategyPage({ initialCompetitor = null }: { initialCompetitor?: string | null }) {
  const {
    workspaceId, domainId, data, loading, coverage,
    analytics, analyticsLoading, refreshing, analyticsError, refreshAnalytics,
    rankedTarget, setRankedTarget, setScope,
  } = useCompetitiveStrategyScreen(initialCompetitor)

  function showRankings(domain: string) {
    setRankedTarget(domain)
    document.getElementById("ranked-keywords")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Competitor keywords first, then who ranks for your tracked keywords.
      </p>

      {/* 1. Keywords competitors actually rank for — first, and independent of
          our SERP footprint (works for any domain, even with no SERP data). */}
      {workspaceId && domainId && (
        <RankedKeywordsCard key={domainId} workspaceId={workspaceId} domainId={domainId}
          selected={rankedTarget} onSelect={setRankedTarget} />
      )}

      {/* 2. Our SERP footprint: tiles, footprint table, whole-site analytics. */}
      {/* Skeleton only on first load; later scope changes keep the current data (dimmed). */}
      {!data && loading ? (
        <div className="space-y-5" role="status" aria-busy="true">
          <span className="sr-only">Loading competitor footprint…</span>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Card key={i}><CardContent className="space-y-2 py-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-7 w-16" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-0"><TableSkeleton rows={6} columns={5} /></CardContent></Card>
        </div>
      ) : !data || data.competitors.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          No Google results saved for your tracked keywords yet. Open a keyword&apos;s Google results to see who ranks for it.
        </CardContent></Card>
      ) : (
        <div className={cn("space-y-5 transition-opacity", loading && "opacity-60")}>
          {/* Summary tiles */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Card><CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Tracked keywords</p>
              <p className="mt-1 ds-kpi">{data.total_keywords}</p>
            </CardContent></Card>
            <Card><CardContent className="py-4">
              <p className="text-xs text-muted-foreground">You rank for</p>
              <p className="mt-1 ds-kpi">{data.our_ranked}
                <span className="ml-1 text-sm font-normal text-muted-foreground">({coverage}%)</span></p>
            </CardContent></Card>
            <Card><CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Competitors ranking</p>
              <p className="mt-1 ds-kpi">
                {data.competitors.filter((c) => c.keywords_shared > 0).length}
                {data.scope === "curated" && (
                  <span className="ml-1 text-sm font-normal text-muted-foreground">of {data.competitors.length}</span>
                )}</p>
            </CardContent></Card>
            <Card><CardContent className="py-4">
              <p className="text-xs text-muted-foreground">Top rival share</p>
              <p className="mt-1 ds-kpi">
                {data.competitors[0]?.keywords_shared ?? 0}
                <span className="ml-1 text-sm font-normal text-muted-foreground">kw</span></p>
            </CardContent></Card>
          </div>

          {/* Competitor footprint — common keywords / gap, expandable */}
          {workspaceId && (
            <CompetitorFootprintTable workspaceId={workspaceId} domainId={domainId}
              data={data} analytics={analytics} onShowRankings={showRankings} onScopeChange={setScope} />
          )}

          {/* Benchmark charts from the stored whole-site analytics (table below holds every value). */}
          {analytics && analytics.rows.length > 1 && (
            <Card><CardContent className="pt-6">
              <p className="mb-1 text-base font-semibold">Competitor benchmark</p>
              <p className="mb-5 text-xs text-muted-foreground">
                How much organic traffic each site earns, and how much of its ranking is on page 1.
              </p>
              <CompetitorBenchmarkCharts rows={analytics.rows} />
            </CardContent></Card>
          )}

          <CompetitorAnalyticsCard
            analytics={analytics}
            loading={analyticsLoading}
            refreshing={refreshing}
            error={analyticsError}
            onRefresh={refreshAnalytics}
          />
        </div>
      )}
    </div>
  )
}
