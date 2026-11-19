"use client"

/**
 * Gap & Overlap Analysis — keyword overlap vs gap, computed from the ranked-keyword
 * sets we already fetch (DB only, no paid call):
 *  - overlap = keywords we BOTH rank for;
 *  - gap     = keywords THEY rank for and we don't (the opportunity).
 *
 * A Venn shows keyword overlap between you and your top competitors; per-competitor
 * bars show overlap vs gap; and the keyword table below breaks every opportunity
 * into Missing / Weak / Shared with each domain's position, filterable + exportable.
 */
import Link from "next/link"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { Tooltip } from "@base-ui/react/tooltip"
import { Filter, X } from "lucide-react"

import { Favicon } from "@/app/dashboard/competitors/_components/favicon"
import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import {
  opportunityApi, type AnalyticsCountry, type GapBucket, type GapKeywordRow,
  type KeywordOverlap,
} from "@/lib/api/opportunity"

// Our-position and keyword-difficulty are filtered as ranges (value -> [min,max]).
const POS_RANGES: Record<string, [number | null, number | null]> = {
  "": [null, null],
  "1-3": [1, 3],
  "4-10": [4, 10],
  "11-20": [11, 20],
  "21-50": [21, 50],
  "51+": [51, null],
}
const KD_RANGES: Record<string, [number | null, number | null]> = {
  "": [null, null],
  "0-29": [0, 29],
  "30-69": [30, 69],
  "70-100": [70, 100],
}
// SERP features offered as a filter (values match the stored feature keys).
const SERP_FEATURES: { value: string; label: string }[] = [
  { value: "featured_snippet", label: "Featured snippet" },
  { value: "people_also_ask", label: "People also ask" },
  { value: "ai_overview", label: "AI overview" },
  { value: "local_pack", label: "Local pack" },
  { value: "image", label: "Image pack" },
  { value: "video", label: "Video" },
  { value: "shopping", label: "Shopping" },
  { value: "knowledge_graph", label: "Knowledge panel" },
  { value: "sitelinks", label: "Sitelinks" },
  { value: "top_stories", label: "Top stories" },
  { value: "reviews", label: "Reviews" },
]
const INTENTS: { value: string; label: string }[] = [
  { value: "all", label: "Any intent" },
  { value: "informational", label: "Informational" },
  { value: "navigational", label: "Navigational" },
  { value: "commercial", label: "Commercial" },
  { value: "transactional", label: "Transactional" },
]

/** Brand token from a domain host (first label, e.g. drishtiias.com → drishtiias). */
function brandTokenOf(domain: string | null | undefined): string {
  const host = (domain ?? "")
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split(/[/?#\s]/)[0]
  return host.split(".")[0] ?? ""
}

const OVERLAP = "var(--chart-2)"
const GAP = "var(--chart-4)"
// Stable per-set colors for the Venn (you first).
const VENN = ["var(--chart-1)", "var(--chart-3)", "var(--chart-5)"]

const fmtNum = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : `${n}`

/** Blue heat-map background for a position cell — the stronger the rank (lower
 * number), the deeper the theme blue. Blank for no run / not ranking. */
function heatBg(pos: number | null, hasRun: boolean): string {
  if (!hasRun || pos == null) return ""
  if (pos <= 3) return "bg-primary/25"
  if (pos <= 10) return "bg-primary/[0.18]"
  if (pos <= 20) return "bg-primary/[0.12]"
  if (pos <= 50) return "bg-primary/[0.06]"
  return "bg-primary/[0.03]"
}

const BUCKET_META: Record<GapBucket, { label: string; hint: string }> = {
  missing: { label: "Missing", hint: "They rank, you don't — new content to create." },
  weak: { label: "Weak", hint: "You rank, but below the best competitor — quick wins to improve." },
  shared: { label: "Shared", hint: "You both rank and you're equal or better — defend these." },
}

/** Schematic Venn of keyword sets (you + up to 2 competitors). Circles are
 * schematic; the exact counts are labelled in the legend below. */
function OverlapVenn({ data }: { data: KeywordOverlap }) {
  const sets = data.sets
  if (!sets.length) return null
  const pair = (a: string, b: string) =>
    data.overlaps.find((o) => o.domains.includes(a) && o.domains.includes(b))?.count ?? 0

  const layout =
    sets.length === 1 ? [{ cx: 120, cy: 95, r: 62 }]
      : sets.length === 2 ? [{ cx: 92, cy: 95, r: 60 }, { cx: 148, cy: 95, r: 60 }]
        : [{ cx: 95, cy: 78, r: 54 }, { cx: 145, cy: 78, r: 54 }, { cx: 120, cy: 128, r: 54 }]

  return (
    <div>
      <svg viewBox="0 0 240 200" className="mx-auto w-full max-w-[16rem]" role="img"
        aria-label="Keyword overlap between you and your competitors">
        {layout.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} fill={VENN[i]} fillOpacity={0.28}
            stroke={VENN[i]} strokeWidth={1.5} />
        ))}
        {sets.length === 2 && (
          <text x={120} y={100} textAnchor="middle" className="fill-foreground text-[13px] font-semibold">
            {pair(sets[0].domain, sets[1].domain).toLocaleString()}
          </text>
        )}
      </svg>
      <ul className="mt-3 space-y-1.5">
        {sets.map((s, i) => (
          <li key={s.domain} className="flex items-center justify-between gap-2 text-sm">
            <Link
              href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(s.domain)}`}
              className="flex min-w-0 items-center gap-2 text-muted-foreground hover:text-primary"
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: VENN[i] }} />
              <span className="truncate">{s.is_you ? `${s.domain} (you)` : s.domain}</span>
            </Link>
            <span className="font-semibold tabular-nums">{s.total.toLocaleString()}</span>
          </li>
        ))}
      </ul>
      {data.overlaps.some((o) => o.count > 0) && (
        <div className="mt-3 space-y-1 border-t border-border pt-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Shared keywords</p>
          {data.overlaps.map((o) => (
            <div key={o.domains.join("|")} className="flex items-center justify-between">
              <span className="truncate">{o.domains.join(" ∩ ")}</span>
              <span className="tabular-nums">{o.count.toLocaleString()}</span>
            </div>
          ))}
          {data.triple && data.triple.count > 0 && (
            <div className="flex items-center justify-between">
              <span className="truncate">all three</span>
              <span className="tabular-nums">{data.triple.count.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** One domain's position (+ traffic) cell in the keyword table. */
function PosCell({ pos, traffic, hasRun }: { pos: number | null; traffic?: number | null; hasRun: boolean }) {
  if (!hasRun) return <span className="text-xs text-muted-foreground/60">—</span>
  if (pos == null) return <span className="text-muted-foreground/60">·</span>
  return (
    <span className="inline-flex flex-col items-end leading-tight">
      <span className="font-semibold tabular-nums">{pos}</span>
      {traffic != null && traffic > 0 && (
        <span className="text-[11px] tabular-nums text-muted-foreground">{fmtNum(Math.round(traffic))}</span>
      )}
    </span>
  )
}

/** How strong a position is — drives the heat shade and the tooltip wording. */
function strengthLabel(pos: number | null): string {
  if (pos == null) return ""
  if (pos <= 3) return "Top 3 · very strong"
  if (pos <= 10) return "Top 10 · strong"
  if (pos <= 20) return "Page 2 (11–20)"
  if (pos <= 50) return "Ranking (21–50)"
  return "Low (50+)"
}

/** A heat-map position cell with a hover tooltip explaining what the box means:
 * which domain, the keyword, the rank + its strength, and the est. traffic. */
function HeatCell({
  domain, isYou, keyword, pos, traffic, hasRun,
}: {
  domain: string
  isYou: boolean
  keyword: string
  pos: number | null
  traffic: number | null
  hasRun: boolean
}) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<span className="inline-flex cursor-help" />}
        aria-label={`${isYou ? "Your site" : domain} position for ${keyword}`}
      >
        <PosCell pos={pos} traffic={traffic} hasRun={hasRun} />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6} className="z-50">
          <Tooltip.Popup className="max-w-64 rounded-lg border border-border bg-popover px-3 py-2 text-left text-xs leading-relaxed text-popover-foreground shadow-md">
            <p className="font-semibold">{isYou ? "Your site" : domain}</p>
            <p className="truncate text-muted-foreground" title={keyword}>{keyword}</p>
            <p className="mt-1">
              {!hasRun ? (
                "No keyword data fetched for this domain yet."
              ) : pos == null ? (
                isYou ? "You don’t rank for this keyword." : "Doesn’t rank for this keyword."
              ) : (
                <>
                  Ranks <span className="font-semibold">#{pos}</span> — {strengthLabel(pos)}
                </>
              )}
            </p>
            {hasRun && pos != null && traffic != null && traffic > 0 && (
              <p className="text-muted-foreground">≈ {fmtNum(Math.round(traffic))} visits/mo from this keyword</p>
            )}
            {hasRun && pos != null && (
              <p className="mt-1 text-[11px] text-muted-foreground/80">Deeper blue = stronger position.</p>
            )}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

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
  const activeDomain = useActiveDomain()
  const domainId = activeDomain?.id ?? null
  const ready = Boolean(workspaceId && domainId)
  const wid = workspaceId ?? ""
  const did = domainId ?? ""
  const compsKey = [...competitors].sort().join(",")
  const brandTerm = React.useMemo(
    () => brandTokenOf(activeDomain?.domain),
    [activeDomain],
  )

  const [bucket, setBucket] = React.useState<GapBucket>("missing")
  const [kwQuery, setKwQuery] = React.useState("")
  const [minVolume, setMinVolume] = React.useState(0)
  // Advanced (BrightEdge-style) filters — all backed by stored gap-row data.
  const [contains, setContains] = React.useState("")
  const [excludes, setExcludes] = React.useState("")
  const [serpFeature, setSerpFeature] = React.useState("")
  const [posRange, setPosRange] = React.useState("")
  const [kdRange, setKdRange] = React.useState("")
  const [brand, setBrand] = React.useState<"all" | "brand" | "non_brand">("all")
  const [intent, setIntent] = React.useState("all")
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)
  // Any filter change resets to the first page.
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(1) }

  const [posMin, posMax] = POS_RANGES[posRange] ?? [null, null]
  const [kdMin, kdMax] = KD_RANGES[kdRange] ?? [null, null]
  // What the gap query actually sends for the advanced filters (one object so
  // the query key, the fetch and the CSV export stay in sync).
  const advanced = {
    contains: contains.trim(),
    excludes: excludes.trim(),
    serpFeature,
    posMin,
    posMax,
    kdMin,
    kdMax,
    brand,
    brandTerm,
    intent,
  }
  // Active-filter chips (remove individually, or Reset all).
  const activeFilters: { key: string; label: string; clear: () => void }[] = []
  if (advanced.contains)
    activeFilters.push({ key: "contains", label: `contains “${advanced.contains}”`, clear: () => reset(setContains)("") })
  if (advanced.excludes)
    activeFilters.push({ key: "excludes", label: `excludes “${advanced.excludes}”`, clear: () => reset(setExcludes)("") })
  if (serpFeature)
    activeFilters.push({ key: "serp", label: SERP_FEATURES.find((f) => f.value === serpFeature)?.label ?? serpFeature, clear: () => reset(setSerpFeature)("") })
  if (posRange)
    activeFilters.push({ key: "pos", label: `Your position ${posRange}`, clear: () => reset(setPosRange)("") })
  if (kdRange)
    activeFilters.push({ key: "kd", label: `Difficulty ${kdRange}`, clear: () => reset(setKdRange)("") })
  if (brand !== "all")
    activeFilters.push({ key: "brand", label: brand === "brand" ? "Brand keywords" : "Non-brand keywords", clear: () => reset(setBrand)("all") })
  if (intent !== "all")
    activeFilters.push({ key: "intent", label: INTENTS.find((i) => i.value === intent)?.label ?? intent, clear: () => reset(setIntent)("all") })
  const resetAll = () => {
    setContains("")
    setExcludes("")
    setSerpFeature("")
    setPosRange("")
    setKdRange("")
    setBrand("all")
    setIntent("all")
    setPage(1)
  }

  const summary = useQuery({
    queryKey: ["competitor-gap-summary", wid, did, market, compsKey],
    queryFn: () => opportunityApi.competitorGapSummary(wid, did, { country: market, competitors }),
    enabled: ready && competitors.length > 0,
  })
  const overlapQ = useQuery({
    queryKey: ["keyword-overlap", wid, did, market, compsKey],
    queryFn: () => opportunityApi.keywordOverlap(wid, did, { country: market, competitors }),
    enabled: ready && competitors.length > 0,
  })
  const gapKwQ = useQuery({
    queryKey: [
      "gap-keywords", wid, did, market, compsKey, bucket, kwQuery, minVolume,
      advanced.contains, advanced.excludes, advanced.serpFeature,
      advanced.posMin, advanced.posMax, advanced.kdMin, advanced.kdMax,
      advanced.brand, advanced.intent, page,
    ],
    queryFn: () => opportunityApi.gapKeywords(wid, did, {
      country: market, competitors, bucket, q: kwQuery, minVolume,
      contains: advanced.contains, excludes: advanced.excludes,
      serpFeature: advanced.serpFeature, posMin: advanced.posMin, posMax: advanced.posMax,
      kdMin: advanced.kdMin, kdMax: advanced.kdMax,
      brand: advanced.brand, brandTerm: advanced.brandTerm, intent: advanced.intent,
      page, pageSize: 20,
    }),
    enabled: ready && competitors.length > 0,
    placeholderData: (prev) => prev,
  })

  async function exportCsv() {
    setExporting(true)
    try {
      const all = await opportunityApi.gapKeywords(wid, did, {
        country: market, competitors, bucket, q: kwQuery, minVolume,
        contains: advanced.contains, excludes: advanced.excludes,
        serpFeature: advanced.serpFeature, posMin: advanced.posMin, posMax: advanced.posMax,
        kdMin: advanced.kdMin, kdMax: advanced.kdMax,
        brand: advanced.brand, brandTerm: advanced.brandTerm, intent: advanced.intent,
        page: 1, pageSize: 1000,
      })
      const comps = all.columns.filter((c) => !c.is_you).map((c) => c.domain)
      const head = ["Keyword", "Bucket", "Volume", "KD", "CPC", "Intent", "You",
        ...comps].map((h) => `"${h}"`).join(",")
      const lines = all.rows.map((r) => [
        `"${r.keyword.replace(/"/g, '""')}"`, r.bucket, r.search_volume,
        r.keyword_difficulty ?? "", r.cpc ?? "", r.intent ?? "",
        r.our_position ?? "", ...comps.map((d) => r.competitors[d]?.position ?? ""),
      ].join(","))
      const blob = new Blob([[head, ...lines].join("\n")], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `keyword-gap-${bucket}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (competitors.length === 0) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Add competitors above to see your keyword gap against them.
      </CardContent></Card>
    )
  }

  if (summary.isLoading || !summary.data) {
    return (
      <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
        Loading keyword gap…
      </CardContent></Card>
    )
  }

  if (!summary.data.has_our_run) {
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
  const rows = summary.data.competitors.filter((c) => !q || c.domain.toLowerCase().includes(q))
  const withRun = rows.filter((c) => c.has_run)
  const totalGap = withRun.reduce((s, c) => s + c.gap, 0)
  const totalGapVolume = withRun.reduce((s, c) => s + c.gap_volume, 0)
  const biggest = withRun[0] // service sorts by gap_volume desc
  const maxTotal = Math.max(1, ...withRun.map((c) => c.overlap + c.gap))

  const gap = gapKwQ.data
  const counts = gap?.counts ?? {}
  const columns = gap?.columns ?? []
  const krows: GapKeywordRow[] = gap?.rows ?? []
  const pageInfo = gap?.pagination
  const totalPages = pageInfo?.total_pages ?? 1

  return (
    <div className="space-y-5 duration-300 animate-in fade-in slide-in-from-bottom-1">
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

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Per-competitor overlap vs gap + top gap keywords. */}
        <Card>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold leading-tight">Keyword overlap &amp; gap</h2>
                <p className="ds-meta">
                  How many keywords you both rank for, and where they rank and you don&apos;t
                  (sorted by opportunity size).
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
                    <div className="h-3.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="flex h-full transition-[width] duration-700 ease-out"
                        style={{ width: `${width}%` }}
                      >
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

        {/* Keyword overlap between you and your top competitors (Venn). */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-1 text-sm font-semibold">Keyword overlap</p>
          <p className="mb-3 text-xs text-muted-foreground">
            Keywords you share with your top competitors.
          </p>
          {overlapQ.isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
          ) : overlapQ.data && overlapQ.data.sets.length > 1 ? (
            <OverlapVenn data={overlapQ.data} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Fetch at least one competitor&apos;s keywords to see the overlap.
            </p>
          )}
        </div>
      </div>

      {/* Keyword-level opportunities: Missing / Weak / Shared. */}
      <Card>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold leading-tight">Keyword opportunities</h2>
              <p className="ds-meta">{BUCKET_META[bucket].hint}</p>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting || !krows.length}>
              {exporting ? "Exporting…" : "Export CSV"}
            </Button>
          </div>

          {/* Bucket tabs. */}
          <div className="flex flex-wrap gap-1 border-b border-border">
            {(Object.keys(BUCKET_META) as GapBucket[]).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => { setBucket(b); setPage(1) }}
                className={`-mb-px border-b-2 px-3 py-1.5 text-sm font-medium transition-colors ${
                  bucket === b
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {BUCKET_META[b].label}
                <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums text-muted-foreground">
                  {(counts[b] ?? 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>

          {/* Filters. */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={kwQuery}
              onChange={(e) => reset(setKwQuery)(e.target.value)}
              placeholder="Search keywords…"
              className="h-9 w-full max-w-xs bg-card"
            />
            <select
              value={minVolume}
              onChange={(e) => reset(setMinVolume)(Number(e.target.value))}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value={0}>All volumes</option>
              <option value={100}>≥ 100/mo</option>
              <option value={1000}>≥ 1K/mo</option>
              <option value={10000}>≥ 10K/mo</option>
            </select>

            <Popover>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium aria-expanded:border-primary"
                  >
                    <Filter className="size-4 text-muted-foreground" />
                    All filters
                    {activeFilters.length > 0 && (
                      <span className="rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
                        {activeFilters.length}
                      </span>
                    )}
                  </button>
                }
              />
              <PopoverContent align="start" className="w-80 p-4">
                <p className="mb-3 text-sm font-semibold">Filter keywords</p>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Contains</span>
                      <Input value={contains} onChange={(e) => reset(setContains)(e.target.value)} placeholder="e.g. upsc" className="h-9 bg-card" />
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Does not contain</span>
                      <Input value={excludes} onChange={(e) => reset(setExcludes)(e.target.value)} placeholder="e.g. pdf" className="h-9 bg-card" />
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Keywords</span>
                    <select
                      value={brand}
                      onChange={(e) => reset(setBrand)(e.target.value as "all" | "brand" | "non_brand")}
                      className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="all">Brand &amp; non-brand</option>
                      <option value="brand" disabled={!brandTerm}>Brand only{brandTerm ? ` (${brandTerm})` : ""}</option>
                      <option value="non_brand" disabled={!brandTerm}>Non-brand only</option>
                    </select>
                  </label>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Search intent</span>
                    <select
                      value={intent}
                      onChange={(e) => reset(setIntent)(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      {INTENTS.map((i) => (
                        <option key={i.value} value={i.value}>{i.label}</option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Your position</span>
                      <select
                        value={posRange}
                        onChange={(e) => reset(setPosRange)(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Any position</option>
                        {Object.keys(POS_RANGES).filter(Boolean).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Difficulty (KD)</span>
                      <select
                        value={kdRange}
                        onChange={(e) => reset(setKdRange)(e.target.value)}
                        className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      >
                        <option value="">Any KD</option>
                        {Object.keys(KD_RANGES).filter(Boolean).map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">SERP feature</span>
                    <select
                      value={serpFeature}
                      onChange={(e) => reset(setSerpFeature)(e.target.value)}
                      className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    >
                      <option value="">Any SERP feature</option>
                      {SERP_FEATURES.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </label>

                  {activeFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={resetAll}
                      className="w-full rounded-lg border border-border py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      Reset all filters
                    </button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {activeFilters.length > 0 && (
              <Button variant="ghost" size="sm" onClick={resetAll} className="text-muted-foreground">
                Reset all
              </Button>
            )}
          </div>

          {/* Active filter chips. */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeFilters.map((f) => (
                <span
                  key={f.key}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                >
                  {f.label}
                  <button type="button" onClick={f.clear} aria-label={`Clear ${f.label}`} className="hover:text-foreground">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Table — a blurred overlay covers it while filtered results reload. */}
          <div className="relative">
            <LoadingOverlay show={gapKwQ.isFetching && !!gap} label="Updating results…" />
            {gapKwQ.isLoading && !gap ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading keywords…</p>
          ) : krows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No {BUCKET_META[bucket].label.toLowerCase()} keywords{kwQuery || minVolume ? " match these filters" : ""}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="py-2 pr-3 text-left font-medium">Keyword</th>
                    <th className="px-2 py-2 text-right font-medium">Vol</th>
                    <th className="px-2 py-2 text-right font-medium">KD</th>
                    <th className="px-2 py-2 text-right font-medium">CPC</th>
                    {columns.map((c) => (
                      <th key={c.domain} className="px-2 py-2 text-right font-medium">
                        {c.has_run ? (
                          <span className="inline-flex items-center gap-1" title={c.domain}>
                            {c.is_you ? "You" : (
                              <Link
                                href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(c.domain)}`}
                                className="hover:text-primary"
                              >
                                <Favicon domain={c.domain} size={14} />
                              </Link>
                            )}
                          </span>
                        ) : (
                          <Link
                            href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(c.domain)}`}
                            className="text-primary hover:underline"
                            title={`${c.domain}: no keyword data yet`}
                          >
                            Fetch
                          </Link>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {krows.map((r) => (
                    <tr key={r.keyword} className="border-b border-border/60 last:border-0">
                      <td className="max-w-[18rem] py-2 pr-3">
                        <span className="block truncate font-medium" title={r.keyword}>{r.keyword}</span>
                        {(r.intent || r.serp_features.length > 0) && (
                          <span className="mt-0.5 flex flex-wrap gap-1">
                            {r.intent && (
                              <span className="rounded bg-muted px-1.5 py-px text-[10px] uppercase text-muted-foreground">
                                {r.intent}
                              </span>
                            )}
                            {r.serp_features.slice(0, 2).map((f) => (
                              <span key={f} className="rounded bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                                {f.replace(/_/g, " ")}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums">{fmtNum(r.search_volume)}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                        {r.keyword_difficulty ?? "—"}
                      </td>
                      <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">
                        {r.cpc != null ? `$${r.cpc.toFixed(2)}` : "—"}
                      </td>
                      {columns.map((c) => {
                        const pos = c.is_you
                          ? r.our_position
                          : (r.competitors[c.domain]?.position ?? null)
                        const traffic = c.is_you
                          ? r.our_traffic
                          : (r.competitors[c.domain]?.traffic ?? null)
                        return (
                          <td
                            key={c.domain}
                            className={`px-2 py-2 text-right ${heatBg(pos, c.has_run)}`}
                          >
                            <HeatCell
                              domain={c.domain}
                              isYou={c.is_you}
                              keyword={r.keyword}
                              pos={pos}
                              traffic={traffic}
                              hasRun={c.has_run}
                            />
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>

          {/* Pagination. */}
          {pageInfo && pageInfo.total > 0 && (
            <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
              <span>
                {((pageInfo.page - 1) * pageInfo.page_size + 1).toLocaleString()}–
                {Math.min(pageInfo.page * pageInfo.page_size, pageInfo.total).toLocaleString()} of{" "}
                {pageInfo.total.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
                <span className="px-1 tabular-nums">{pageInfo.page} / {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
