"use client"

/**
 * Lazy-loaded chart components. Recharts is a large dependency; loading it via
 * next/dynamic (client-only) splits it into its own chunk that is fetched when a
 * chart actually renders, rather than blocking the page's initial JS. A skeleton
 * placeholder keeps layout stable while the chunk loads.
 */
import dynamic from "next/dynamic"

function Skeleton({ className }: { className: string }) {
  return <div className={`w-full animate-pulse rounded-lg bg-muted/50 ${className}`} />
}

export const ScoreTrendChart = dynamic(
  () => import("./score-trend-chart").then((m) => m.ScoreTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-48" /> }
)

export const CheckBreakdown = dynamic(
  () => import("./check-breakdown").then((m) => m.CheckBreakdown),
  { ssr: false, loading: () => <Skeleton className="h-32" /> }
)

export const RankTrendChart = dynamic(
  () => import("./rank-trend-chart").then((m) => m.RankTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-56" /> }
)

export const TrafficTrendChart = dynamic(
  () => import("./traffic-trend-chart").then((m) => m.TrafficTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-56" /> }
)

export const OpportunityMapChart = dynamic(
  () => import("./opportunity-map-chart").then((m) => m.OpportunityMapChart),
  { ssr: false, loading: () => <Skeleton className="h-80" /> }
)

export const QuickWinsChart = dynamic(
  () => import("./quick-wins-chart").then((m) => m.QuickWinsChart),
  { ssr: false, loading: () => <Skeleton className="h-80" /> }
)

export const CompetitorBenchmarkCharts = dynamic(
  () => import("./competitor-benchmark-charts").then((m) => m.CompetitorBenchmarkCharts),
  { ssr: false, loading: () => <Skeleton className="h-72" /> }
)

export const TrafficShareChart = dynamic(
  () => import("./traffic-share-chart").then((m) => m.TrafficShareChart),
  { ssr: false, loading: () => <Skeleton className="h-56" /> }
)

export const CompetitorRankChart = dynamic(
  () => import("./competitor-rank-chart").then((m) => m.CompetitorRankChart),
  { ssr: false, loading: () => <Skeleton className="h-72" /> }
)

export const OpportunityTrendChart = dynamic(
  () => import("./opportunity-trend-chart").then((m) => m.OpportunityTrendChart),
  { ssr: false, loading: () => <Skeleton className="h-72" /> }
)

export const PageSearchChart = dynamic(
  () => import("./page-search-chart").then((m) => m.PageSearchChart),
  { ssr: false, loading: () => <Skeleton className="h-60" /> }
)

export const PageTypeDonut = dynamic(
  () => import("./page-type-donut").then((m) => m.PageTypeDonut),
  { ssr: false, loading: () => <Skeleton className="h-56" /> }
)
