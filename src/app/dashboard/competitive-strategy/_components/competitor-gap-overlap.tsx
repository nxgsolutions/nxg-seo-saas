"use client"

/**
 * Gap & Overlap Analysis — keyword overlap vs gap per competitor, computed from
 * the ranked-keyword sets we already fetch (DB only, no paid call):
 *  - overlap = keywords we BOTH rank for;
 *  - gap     = keywords THEY rank for and we don't (the opportunity);
 *  - gap volume = total search volume of the gap (how big the opportunity is).
 *
 * The biggest gap keywords are previewed inline; "View all" deep-links into the
 * Competitor Keywords page for the full, filterable table.
 */
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"

import { Favicon } from "@/app/dashboard/competitors/_components/favicon"
import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { opportunityApi, type AnalyticsCountry } from "@/lib/api/opportunity"

const OVERLAP = "var(--chart-2)"
const GAP = "var(--chart-4)"

const fmtNum = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`

export function CompetitorGapOverlap({
  competitors,
  market,
  search = "",
}: {
  /** The compared competitor domains (from the VS header), minus your website. */
  competitors: string[]
  market: AnalyticsCountry
  /** Substring filter on competitor domain (from the page's "Search in results"). */
  search?: string
}) {
  const workspaceId = useActiveWorkspace()?.id ?? null
  const domainId = useActiveDomain()?.id ?? null
  const ready = Boolean(workspaceId && domainId)
  const wid = workspaceId ?? ""
  const did = domainId ?? ""

  const { data, isLoading } = useQuery({
    queryKey: ["competitor-gap-summary", wid, did, market, [...competitors].sort().join(",")],
    queryFn: () =>
      opportunityApi.competitorGapSummary(wid, did, { country: market, competitors }),
    enabled: ready && competitors.length > 0,
  })

  if (competitors.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Add competitors above to see your keyword gap against them.
      </CardContent></Card>
    )
  }

  if (isLoading || !data) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Loading keyword gap…
      </CardContent></Card>
    )
  }

  if (!data.has_our_run) {
    return (
      <Card><CardContent className="space-y-3 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Fetch your website&apos;s ranked keywords first — the gap is computed by comparing
          your keywords against each competitor&apos;s.
        </p>
        <Button variant="outline" size="sm" render={<Link href="/dashboard/competitors/keywords" />}>
          Fetch keyword data
        </Button>
      </CardContent></Card>
    )
  }

  const q = search.trim().toLowerCase()
  const rows = data.competitors.filter((c) => !q || c.domain.toLowerCase().includes(q))
  const withRun = rows.filter((c) => c.has_run)
  const totalGap = withRun.reduce((s, c) => s + c.gap, 0)
  const totalGapVolume = withRun.reduce((s, c) => s + c.gap_volume, 0)
  const biggest = withRun[0] // service sorts by gap_volume desc
  const maxTotal = Math.max(1, ...withRun.map((c) => c.overlap + c.gap))

  return (
    <div className="space-y-5">
      {/* KPI strip. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Competitors analyzed</p>
          <p className="mt-1 ds-kpi">{withRun.length}
            <span className="ml-1 text-sm font-normal text-muted-foreground">of {rows.length}</span></p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Total gap keywords</p>
          <p className="mt-1 ds-kpi">{totalGap.toLocaleString()}</p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Gap search volume</p>
          <p className="mt-1 ds-kpi">{fmtNum(totalGapVolume)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">/mo</span></p>
        </CardContent></Card>
        <Card><CardContent className="py-4">
          <p className="text-xs text-muted-foreground">Biggest opportunity</p>
          <p className="mt-1 truncate text-base font-semibold">{biggest?.domain ?? "—"}</p>
        </CardContent></Card>
      </div>

      {/* Per-competitor overlap vs gap + top gap keywords. */}
      <Card>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold leading-tight">Keyword overlap &amp; gap</h2>
              <p className="ds-meta">
                From each competitor&apos;s ranked keywords: how many you both rank for, and where
                they rank and you don&apos;t (sorted by opportunity size).
              </p>
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

          <ul className="space-y-6">
            {rows.map((c) => {
              if (!c.has_run) {
                return (
                  <li key={c.domain} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-4 last:border-0">
                    <Link
                      href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(c.domain)}`}
                      className="flex items-center gap-2 text-sm font-medium hover:text-primary"
                    >
                      <Favicon domain={c.domain} size={16} /> {c.domain}
                    </Link>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      No keyword data yet
                      <Button variant="outline" size="sm"
                        render={<Link href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(c.domain)}`} />}>
                        Fetch
                      </Button>
                    </span>
                  </li>
                )
              }
              const total = c.overlap + c.gap
              const width = (total / maxTotal) * 100
              const commonPct = total ? (c.overlap / total) * 100 : 0
              return (
                <li key={c.domain} className="space-y-2 border-b border-border/60 pb-5 last:border-0">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <Link
                      href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(c.domain)}`}
                      className="flex items-center gap-2 font-medium hover:text-primary"
                    >
                      <Favicon domain={c.domain} size={16} /> {c.domain}
                    </Link>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground">{c.overlap.toLocaleString()}</span> overlap ·{" "}
                      <span className="font-semibold text-foreground">{c.gap.toLocaleString()}</span> gap ·{" "}
                      <span className="font-semibold text-foreground">{fmtNum(c.gap_volume)}</span> vol
                    </span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                    <div className="flex h-full" style={{ width: `${width}%` }}>
                      <div style={{ width: `${commonPct}%`, background: OVERLAP }} />
                      <div style={{ width: `${100 - commonPct}%`, background: GAP }} />
                    </div>
                  </div>
                  {c.top_gaps.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-xs text-muted-foreground">Top gaps:</span>
                      {c.top_gaps.map((g) => (
                        <span key={g.keyword}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2 py-0.5 text-xs">
                          <span className="truncate max-w-[14rem]">{g.keyword}</span>
                          <span className="tabular-nums text-muted-foreground">{fmtNum(g.search_volume)}</span>
                        </span>
                      ))}
                      <Link
                        href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(c.domain)}`}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        View all {c.gap.toLocaleString()} →
                      </Link>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
