"use client"

/**
 * Competitive Strategy — live competitor comparison.
 *
 * Keeps the approved mockup layout (compare bar, view tabs, filter row,
 * Performance Summary) and feeds live data into the data-bearing parts:
 *  - domain chips + market come from the stored competitor set;
 *  - the trend chart and traffic-share donut come from stored analytics;
 *  - the Gap & Overlap tab shows the real keyword overlap vs gap.
 *
 * Data is DB-only (no paid call here); new analytics are fetched from the
 * Competitor Keywords page. The compare field, filters, date-range and the
 * export/columns/expand controls are presentational (not yet wired).
 */
import * as React from "react"
import Link from "next/link"
import {
  BarChart3,
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  Columns2,
  Download,
  Maximize2,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Swords,
  Users,
  X,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { PageHeader } from "@/components/dashboard/page-header"
import {
  CompetitorCombobox,
  type CompetitorOption,
} from "@/components/dashboard/competitor-combobox"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import type { AnalyticsCountry } from "@/lib/api/opportunity"
import {
  CompetitorShareDonut,
  CompetitorTrafficChart,
} from "@/components/charts/lazy"
import type {
  ShareSlice,
  TrafficRow,
  TrafficSeries,
} from "@/components/charts/competitor-comparison-chart"
import { useCompetitiveStrategyData } from "../_hooks/use-competitive-strategy-data"
import { CompetitorGapOverlap } from "./competitor-gap-overlap"

// Series colors — line + donut share one map so a domain keeps its color.
const PALETTE = [
  "var(--chart-1)", "var(--chart-3)", "#7c5cff", "var(--chart-4)",
  "var(--chart-5)", "var(--chart-2)", "#e34948", "#008380",
]
const MAX_LINES = 6

const METRICS = [
  { id: "traffic", label: "Estimated Traffic", field: "organic_traffic" },
  { id: "keywords", label: "Ranking Keywords", field: "ranking_keywords" },
  { id: "volume", label: "Search Volume", field: null },
] as const
type MetricId = (typeof METRICS)[number]["id"]

const VIEWS = [
  { id: "market", label: "Market Research", icon: BarChart3 },
  { id: "overlap", label: "Gap & Overlap Analysis", icon: Columns2 },
] as const
type ViewId = (typeof VIEWS)[number]["id"]

// Markets the user can compare in (default India). Each drives the `country`
// param of the analytics + trend queries.
const MARKET_OPTIONS: { code: AnalyticsCountry; flag: string; label: string }[] = [
  { code: "in", flag: "🇮🇳", label: "India" },
  { code: "us", flag: "🇺🇸", label: "United States" },
]

// Number of competitors shown in the compare bar by default (the strongest by
// traffic); the user can remove any or add their own with the Add field.
const DEFAULT_COMPARE = 4

/** Normalize a typed domain/URL to a bare host (drops scheme, www, path). */
function normHost(value: string): string {
  return value.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "")
}

function fmtMonth(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" })
}
function fmtMonthYear(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
}
function fmtRangeDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}
/** Local (not UTC) yyyy-mm-dd, to compare a Date against stored ISO day strings. */
function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}
/** Compact traffic figure for filter chips (12.3M / 840K / 500). */
function fmtTraffic(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <button type="button" onClick={onClear} aria-label={`Clear ${label}`} className="hover:text-foreground">
        <X className="size-3" />
      </button>
    </span>
  )
}

export default function CompetitiveStrategyScreen() {
  // Market (country) the comparison runs in — default India. Drives the queries.
  const [market, setMarket] = React.useState<AnalyticsCountry>("in")
  const { ready, analytics, history, strategy, loading, error } = useCompetitiveStrategyData(market)
  const [metric, setMetric] = React.useState<MetricId>("traffic")
  const [view, setView] = React.useState<ViewId>("market")
  // Which domains are in the comparison (null = default top set). The compare
  // bar drives the trend + donut below it.
  const [selected, setSelected] = React.useState<string[] | null>(null)
  // Filters (narrow what the charts show). Reset clears all of these.
  const [search, setSearch] = React.useState("")
  const [minTraffic, setMinTraffic] = React.useState(0)
  const [excludeYou, setExcludeYou] = React.useState(false)
  const [range, setRange] = React.useState<DateRange | undefined>(undefined)

  const header = (
    <PageHeader
      title={<> <Swords className="size-5 text-primary" /> Competitive Strategy </>}
      description="Compare domains side by side — estimated traffic, ranking keywords and market share over time."
      backHref="/dashboard/competitors"
      backLabel="Competitor Analysis"
    />
  )

  if (!ready) {
    return (
      <div className="space-y-5">
        {header}
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          Select a website from the top bar to compare its competitors.
        </CardContent></Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {header}
        <Card><CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-8 w-56" />
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <Skeleton className="h-[20rem] w-full" />
            <Skeleton className="h-[20rem] w-full" />
          </div>
        </CardContent></Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        {header}
        <Card><CardContent className="py-12 text-center text-sm text-destructive">{error}</CardContent></Card>
      </div>
    )
  }

  const rows = analytics?.rows ?? []
  const hasStrategy = (strategy?.competitors?.length ?? 0) > 0
  if (rows.length === 0 && !hasStrategy) {
    return (
      <div className="space-y-5">
        {header}
        <Card><CardContent className="space-y-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">
            No competitor data stored yet for this website.
          </p>
          <Button variant="outline" size="sm" render={<Link href="/dashboard/competitors/keywords" />}>
            <Users /> Open Competitor Keywords to fetch metrics
          </Button>
        </CardContent></Card>
      </div>
    )
  }

  // Stable color per domain (donut + lines match), by position in the full set.
  const colorFor = (domain: string, fallback = 0) => {
    const i = rows.findIndex((r) => r.domain === domain)
    return PALETTE[(i >= 0 ? i : fallback) % PALETTE.length]
  }

  // Comparison set: the chips drive the charts. Default = strongest few domains.
  const effectiveSelected = selected ?? rows.slice(0, DEFAULT_COMPARE).map((r) => r.domain)
  const selectedSet = new Set(effectiveSelected)
  const pickDomain = (d: string) => {
    const h = normHost(d)
    if (h && !effectiveSelected.includes(h)) setSelected([...effectiveSelected, h])
  }
  const removeDomain = (d: string) => setSelected(effectiveSelected.filter((x) => x !== d))

  // Options for the picker: your competitors / stored domains not already chosen.
  const knownDomains = new Map<string, CompetitorOption>()
  rows.forEach((r) =>
    knownDomains.set(r.domain, {
      domain: r.domain,
      tag: r.is_you ? "you" : "competitor",
      hint: `${r.traffic_share.toFixed(1)}%`,
    }))
  ;(strategy?.competitors ?? []).forEach((c) => {
    if (!knownDomains.has(c.domain)) knownDomains.set(c.domain, { domain: c.domain, tag: "competitor" })
  })
  const addOptions = [...knownDomains.values()].filter((o) => !selectedSet.has(o.domain))

  // --- Filters narrow which competitors + dates appear in the charts ---
  const q = search.trim().toLowerCase()
  const passes = (domain: string) => {
    const row = rows.find((r) => r.domain === domain)
    if (q && !domain.toLowerCase().includes(q)) return false
    if (minTraffic > 0 && (row?.organic_traffic ?? 0) < minTraffic) return false
    if (excludeYou && row?.is_you) return false
    return true
  }
  const activeFilterCount =
    (q ? 1 : 0) + (minTraffic > 0 ? 1 : 0) + (excludeYou ? 1 : 0) + (range?.from ? 1 : 0)
  const resetFilters = () => {
    setSearch(""); setMinTraffic(0); setExcludeYou(false); setRange(undefined)
  }

  // Donut: traffic share among the visible (selected + passing filters) domains.
  const visibleRows = rows.filter((r) => selectedSet.has(r.domain) && passes(r.domain))
  const totalTraffic = visibleRows.reduce((s, r) => s + r.organic_traffic, 0)
  const share: ShareSlice[] = visibleRows.map((r) => ({
    name: r.domain,
    value: totalTraffic ? (r.organic_traffic / totalTraffic) * 100 : 0,
    color: colorFor(r.domain),
  }))

  // Trend: one line per visible competitor, pivoted to one row/date.
  const seriesDomains = (history?.competitors ?? [])
    .filter((c) => selectedSet.has(c.domain) && passes(c.domain))
    .slice(0, MAX_LINES)
  const series: TrafficSeries[] = seriesDomains.map((c, i) => ({
    key: `d${i}`,
    label: c.domain,
    color: colorFor(c.domain, i),
  }))
  const field = METRICS.find((m) => m.id === metric)!.field

  // Date-range filter over the stored snapshot dates.
  const allDates = history?.dates ?? []
  const fromISO = range?.from ? toISODate(range.from) : null
  const toISO = range?.from ? toISODate(range.to ?? range.from) : null
  const dates = fromISO ? allDates.filter((d) => d >= fromISO && d <= toISO!) : allDates
  const trendRows: TrafficRow[] = field
    ? dates.map((date) => {
        const row: TrafficRow = { month: fmtMonth(date) }
        seriesDomains.forEach((c, i) => {
          const pt = c.points.find((p) => p.captured_on === date)
          row[`d${i}`] = pt ? pt[field] : (null as unknown as number)
        })
        return row
      })
    : []

  const latestDate = dates.at(-1) ?? allDates.at(-1) ?? analytics?.fetched_at?.slice(0, 10) ?? null
  const summaryMonth = latestDate ? fmtMonthYear(latestDate) : "latest snapshot"
  const defaultSpan = allDates.length
    ? `${fmtMonthYear(allDates[0])} – ${fmtMonthYear(allDates[allDates.length - 1])}`
    : "No history yet"
  const rangeLabel = range?.from
    ? `${fmtRangeDate(range.from)} – ${fmtRangeDate(range.to ?? range.from)}`
    : defaultSpan
  const currentMarket = MARKET_OPTIONS.find((m) => m.code === market) ?? MARKET_OPTIONS[0]
  const enoughHistory = dates.length >= 2 && Boolean(field)
  const calendarMonth = range?.from ?? (allDates.length ? new Date(allDates[allDates.length - 1] + "T00:00:00") : undefined)

  return (
    <div className="space-y-5">
      {header}

      {/* Compare bar — static picker row on top; selected cards below so the
          combobox never shifts as competitors are added/removed. */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <CompetitorCombobox
              className="min-w-[16rem] flex-1"
              options={addOptions}
              onPick={pickDomain}
              clearOnPick
              placeholder="Search competitors or enter a domain"
              actionLabel="Add"
              actionIcon={<Plus className="size-4" />}
            />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium aria-expanded:border-primary"
                  >
                    <span aria-hidden>{currentMarket.flag}</span>
                    {currentMarket.label}
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-44">
                {MARKET_OPTIONS.map((m) => (
                  <DropdownMenuItem key={m.code} onClick={() => setMarket(m.code)}>
                    <span aria-hidden className="text-base">{m.flag}</span>
                    {m.label}
                    {market === m.code && <Check className="ml-auto !text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button size="default" render={<Link href="/dashboard/competitors" />}>
              <Search /> Compare
            </Button>
          </div>

          {effectiveSelected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {effectiveSelected.map((d) => {
                const row = rows.find((r) => r.domain === d)
                return (
                  <div
                    key={d}
                    className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium"
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: colorFor(d) }} />
                    <span className="truncate">{d}</span>
                    {row?.is_you && <span className="shrink-0 text-xs text-primary">(you)</span>}
                    <button
                      type="button"
                      onClick={() => removeDomain(d)}
                      aria-label={`Remove ${d}`}
                      className="shrink-0 rounded text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* View tabs + date range. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="segmented-tabs flex w-fit gap-1 rounded-2xl border p-1">
          {VIEWS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setView(t.id)}
              data-active={view === t.id || undefined}
              className="segmented-tab flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium aria-expanded:border-primary"
                >
                  <CalendarIcon className="size-4 text-muted-foreground" />
                  {rangeLabel}
                  <ChevronDown className="size-4 text-muted-foreground" />
                </button>
              }
            />
            <PopoverContent align="end" className="w-auto p-3">
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                defaultMonth={calendarMonth}
                numberOfMonths={1}
              />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <button
                  type="button"
                  onClick={() => setRange(undefined)}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  All dates
                </button>
                {range?.from && <span className="text-xs text-muted-foreground">{rangeLabel}</span>}
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="default" render={<Link href="/dashboard/competitors/keywords" />}>
            <RefreshCw /> Compare
          </Button>
        </div>
      </div>

      {/* Filter row — working filters over the compared competitors. */}
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger
            render={
              <Button size="sm" variant={activeFilterCount ? "default" : "outline"}>
                <SlidersHorizontal /> All Filters{activeFilterCount ? ` · ${activeFilterCount}` : ""}
              </Button>
            }
          />
          <PopoverContent align="start" className="w-72 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="min-traffic" className="text-xs font-medium text-muted-foreground">
                Minimum estimated traffic
              </label>
              <input
                id="min-traffic"
                type="number"
                min={0}
                step={1000}
                value={minTraffic || ""}
                onChange={(e) => setMinTraffic(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                data-slot="input"
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus-visible:border-primary"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={excludeYou}
                onChange={(e) => setExcludeYou(e.target.checked)}
                className="size-4 accent-[var(--primary)]"
              />
              Exclude my domain
            </label>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!activeFilterCount}
              className="text-xs font-medium text-primary disabled:opacity-50"
            >
              Reset filters
            </button>
          </PopoverContent>
        </Popover>

        {q && <FilterChip label={`Search: ${search.trim()}`} onClear={() => setSearch("")} />}
        {minTraffic > 0 && <FilterChip label={`≥ ${fmtTraffic(minTraffic)} traffic`} onClear={() => setMinTraffic(0)} />}
        {excludeYou && <FilterChip label="Exclude you" onClear={() => setExcludeYou(false)} />}
        {range?.from && <FilterChip label={rangeLabel} onClear={() => setRange(undefined)} />}

        {activeFilterCount > 0 && (
          <button type="button" onClick={resetFilters} className="px-2 text-sm font-medium text-primary">
            Reset
          </button>
        )}

        <div className="ml-auto flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-sm focus-within:border-primary">
          <Search className="size-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search in results…"
            className="w-40 bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {view === "overlap" ? (
        <CompetitorGapOverlap strategy={strategy} search={q} />
      ) : (
        /* Performance summary. */
        <Card>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="dashboard-icon"><BarChart3 className="size-4" /></span>
                <div>
                  <h2 className="text-base font-semibold leading-tight">
                    Performance Summary for {summaryMonth}
                  </h2>
                  <p className="ds-meta">{rangeLabel}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="segmented-tabs flex gap-1 rounded-xl border p-0.5">
                  {METRICS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMetric(m.id)}
                      data-active={metric === m.id || undefined}
                      className="segmented-tab rounded-lg px-3 py-1.5 text-sm font-medium"
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="icon-sm" aria-label="Export">
                  <Download />
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="Columns">
                  <Columns2 />
                </Button>
                <Button variant="outline" size="icon-sm" aria-label="Expand">
                  <Maximize2 />
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div>
                {enoughHistory ? (
                  <>
                    <CompetitorTrafficChart rows={trendRows} series={series} />
                    <div className="mt-2 flex flex-wrap justify-center gap-5">
                      {series.map((s) => (
                        <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="size-2.5 rounded-full" style={{ background: s.color }} />
                          {s.label}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-[20rem] items-center justify-center rounded-xl border border-dashed border-border px-6 text-center text-sm text-muted-foreground">
                    {!field
                      ? "Search volume isn’t tracked per competitor yet — switch to Estimated Traffic or Ranking Keywords."
                      : dates.length === 1
                        ? "Only one snapshot in this date range — widen it to plot a trend."
                        : allDates.length >= 2
                          ? "No snapshots in the selected date range — widen the range to see the trend."
                          : "Only one snapshot stored so far. Refresh competitor analytics on another day to build the trend over time."}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="size-4 text-primary" /> Traffic Share
                </p>
                <CompetitorShareDonut data={share} centerLabel={summaryMonth} />
                <ul className="mt-3 space-y-1.5">
                  {share.map((s) => (
                    <li key={s.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2.5 rounded-sm" style={{ background: s.color }} />
                        {s.name}
                      </span>
                      <span className="font-semibold tabular-nums">{s.value.toFixed(1)}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
