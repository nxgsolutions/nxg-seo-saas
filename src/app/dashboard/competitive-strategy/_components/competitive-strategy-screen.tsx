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
 * Competitor Keywords page. The metric tabs, date range, search, CSV export
 * and full-screen expand are all wired to the live data below.
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
  Loader2,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Search,
  Swords,
  Users,
  X,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { PageHeader } from "@/components/dashboard/page-header"
import { Favicon } from "@/app/dashboard/competitors/_components/favicon"
import { useActiveDomain } from "@/hooks/dashboard"
import {
  CompetitorCombobox,
  type CompetitorOption,
} from "@/components/dashboard/competitor-combobox"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  "var(--chart-1)",
  "var(--chart-3)",
  "#7c5cff",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
  "#e34948",
  "#008380",
]
const MAX_LINES = 6

const METRICS = [
  { id: "traffic", label: "Estimated Traffic", field: "organic_traffic" },
  { id: "keywords", label: "Ranking Keywords", field: "ranking_keywords" },
  { id: "volume", label: "Search Volume", field: "search_volume" },
] as const
type MetricId = (typeof METRICS)[number]["id"]

const VIEWS = [
  { id: "market", label: "Market Research", icon: BarChart3 },
  { id: "overlap", label: "Gap & Overlap Analysis", icon: Columns2 },
] as const
type ViewId = (typeof VIEWS)[number]["id"]

// Markets the user can compare in (default India). Each drives the `country`
// param of the analytics + trend queries.
const MARKET_OPTIONS: {
  code: AnalyticsCountry
  flag: string
  label: string
}[] = [
  { code: "in", flag: "🇮🇳", label: "India" },
  { code: "us", flag: "🇺🇸", label: "United States" },
]

/** Inline SVG flag — flag emoji don't render on Windows, so draw them. */
function MarketFlag({ code }: { code: AnalyticsCountry }) {
  const props = {
    width: 18, height: 12, "aria-hidden": true,
    className: "shrink-0 rounded-[2px] ring-1 ring-black/10",
  } as const
  if (code === "in") {
    return (
      <svg viewBox="0 0 24 16" {...props}>
        <rect width="24" height="16" fill="#fff" />
        <rect width="24" height="5.333" fill="#FF9933" />
        <rect y="10.667" width="24" height="5.333" fill="#138808" />
        <circle cx="12" cy="8" r="1.9" fill="none" stroke="#000080" strokeWidth="0.5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 26 16" {...props}>
      <rect width="26" height="16" fill="#B22234" />
      {[1, 3, 5, 7, 9, 11].map((i) => (
        <rect key={i} y={(i * 16) / 13} width="26" height={16 / 13} fill="#fff" />
      ))}
      <rect width="11" height={(16 * 7) / 13} fill="#3C3B6E" />
    </svg>
  )
}

// Number of competitors shown in the compare bar by default (the strongest by
// traffic); the user can remove any or add their own with the Add field.
const DEFAULT_COMPARE = 4

/** The last N months (today minus N months → today) for the date presets. */
function lastMonthsRange(months: number): DateRange {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - months)
  return { from, to }
}

// Date-range presets (GSC-style). Default is the last 6 months.
const DATE_PRESETS = [
  { id: "6m", label: "Last 6 months", months: 6 },
  { id: "12m", label: "Last 12 months", months: 12 },
] as const
type DatePreset = (typeof DATE_PRESETS)[number]["id"] | "custom"

/** shadcn-style single date picker: a button showing the date that opens a
 *  calendar popover. Used for the Custom "Start date" / "End date" fields. */
function DatePicker({
  value,
  onChange,
  min,
  max,
  placeholder,
}: {
  value?: Date
  onChange: (d: Date | undefined) => void
  min?: Date
  max?: Date
  placeholder: string
}) {
  const disabled = [
    ...(min ? [{ before: min }] : []),
    ...(max ? [{ after: max }] : []),
  ]
  // Open on a month that actually has selectable days (clamp into [min, max]),
  // so a value that sits outside the window never shows an all-disabled month.
  const openMonth = value
    ? min && value < min
      ? min
      : max && value > max
        ? max
        : value
    : (max ?? min)
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 font-normal"
          >
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            {value ? fmtDay(value) : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        }
      />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          defaultMonth={openMonth}
          disabled={disabled.length ? disabled : undefined}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Normalize a typed domain/URL to a bare host (drops scheme, www, path). */
function normHost(value: string): string {
  return value
    .trim()
    .toLowerCase()
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
function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}
/** Local (not UTC) yyyy-mm-dd, to compare a Date against stored ISO day strings. */
function toISODate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}
function FilterChip({
  label,
  onClear,
}: {
  label: string
  onClear: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/50 px-2.5 py-1.5 text-xs font-medium text-muted-foreground">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear ${label}`}
        className="hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

export default function CompetitiveStrategyScreen() {
  // Market (country) the comparison runs in — default India. Drives the queries.
  const [market, setMarket] = React.useState<AnalyticsCountry>("in")
  const {
    ready,
    analytics,
    history,
    strategy,
    loading,
    error,
    refreshAnalytics,
    refreshing,
  } = useCompetitiveStrategyData(market)
  // Primary website comes from the currently selected project (top bar), never
  // hardcoded — it is always pinned first in the comparison.
  const activeDomain = useActiveDomain()
  const [metric, setMetric] = React.useState<MetricId>("traffic")
  const [view, setView] = React.useState<ViewId>("market")
  // Which domains are in the comparison (null = default top set). The compare
  // bar drives the trend + donut below it.
  const [selected, setSelected] = React.useState<string[] | null>(null)
  // Filters (narrow what the charts show): free-text search + date range.
  const [search, setSearch] = React.useState("")
  // Current text in the Add-competitor field (drives the Add button's enabled state).
  const [addText, setAddText] = React.useState("")
  const [datePreset, setDatePreset] = React.useState<DatePreset>("6m")
  const [range, setRange] = React.useState<DateRange | undefined>(() => lastMonthsRange(6))
  // Expand the chart + donut area to fill the screen (in-app overlay).
  const [expanded, setExpanded] = React.useState(false)
  React.useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [expanded])

  const header = (
    <PageHeader
      title={
        <>
          {" "}
          <Swords className="size-5 text-primary" /> Competitive Strategy{" "}
        </>
      }
      description="Compare domains side by side — estimated traffic, ranking keywords."
      backHref="/dashboard/competitors"
      backLabel="Competitor Analysis"
    />
  )

  if (!ready) {
    return (
      <div className="space-y-5">
        {header}
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Select a website from the top bar to compare its competitors.
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-5">
        {header}
        <Card>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-8 w-56" />
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <Skeleton className="h-[20rem] w-full" />
              <Skeleton className="h-[20rem] w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-5">
        {header}
        <Card>
          <CardContent className="py-12 text-center text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      </div>
    )
  }

  const rows = analytics?.rows ?? []
  const hasStrategy = (strategy?.competitors?.length ?? 0) > 0
  if (rows.length === 0 && !hasStrategy) {
    return (
      <div className="space-y-5">
        {header}
        <Card>
          <CardContent className="space-y-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No competitor data stored yet for this website.
            </p>
            <Button
              variant="outline"
              size="sm"
              render={<Link href="/dashboard/competitors/keywords" />}
            >
              <Users /> Open Competitor Keywords to fetch metrics
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Stable color per domain (donut + lines match), by position in the full set.
  const colorFor = (domain: string, fallback = 0) => {
    const i = rows.findIndex((r) => r.domain === domain)
    return PALETTE[(i >= 0 ? i : fallback) % PALETTE.length]
  }

  const primaryHost = normHost(activeDomain?.domain ?? "")

  // Comparison set: primary is ALWAYS present and first; competitors follow.
  // Default competitor set = strongest few domains.
  const chosen = selected ?? rows.slice(0, DEFAULT_COMPARE).map((r) => r.domain)
  const effectiveSelected = primaryHost
    ? [primaryHost, ...chosen.filter((d) => d !== primaryHost)]
    : chosen
  const selectedSet = new Set(effectiveSelected)
  const competitorDomains = effectiveSelected.filter((d) => d !== primaryHost)

  // Known competitors for THIS website: stored analytics rows + its SERP
  // footprint. The comparison only ever uses these — never an external domain.
  const knownDomains = new Map<string, CompetitorOption>()
  rows.forEach((r) =>
    knownDomains.set(r.domain, {
      domain: r.domain,
      tag: r.is_you ? "you" : "competitor",
      hint: `${r.traffic_share.toFixed(1)}%`,
    }),
  )
  ;(strategy?.competitors ?? []).forEach((c) => {
    if (!knownDomains.has(c.domain))
      knownDomains.set(c.domain, { domain: c.domain, tag: "competitor" })
  })
  const addOptions = [...knownDomains.values()].filter(
    (o) => !selectedSet.has(o.domain),
  )
  // The Add button is enabled only when the field holds a known competitor that
  // isn't already compared (i.e. one the user actually selected from the list).
  const canAddCompetitor =
    !!normHost(addText) &&
    knownDomains.has(normHost(addText)) &&
    !selectedSet.has(normHost(addText))

  const pickDomain = (d: string) => {
    const h = normHost(d)
    // Only this website's own competitors can be added — reject external domains.
    if (h && knownDomains.has(h) && !effectiveSelected.includes(h))
      setSelected([...effectiveSelected, h])
  }
  // Primary can never be removed; only competitors are removable.
  const removeDomain = (d: string) => {
    if (d === primaryHost) return
    setSelected(effectiveSelected.filter((x) => x !== d))
  }

  // --- Filters narrow which competitors + dates appear in the charts ---
  const q = search.trim().toLowerCase()
  const passes = (domain: string) => {
    if (domain === primaryHost) return true // primary is always shown
    if (q && !domain.toLowerCase().includes(q)) return false
    return true
  }

  // Active metric + the date window — shared by BOTH the line chart and the donut
  // so they always reflect the same tab, range and selection.
  const field = METRICS.find((m) => m.id === metric)!.field
  const shareTitle =
    metric === "traffic"
      ? "Traffic Share"
      : metric === "keywords"
        ? "Keyword Share"
        : "Volume Share"
  const allDates = history?.dates ?? []
  // Selectable window for the date pickers: earliest stored month → today.
  const minDate = allDates[0] ? new Date(allDates[0] + "T00:00:00") : undefined
  const maxDate = new Date()
  // Clamp a date into [minDate, maxDate].
  const clampDate = (d: Date) =>
    minDate && d < minDate ? minDate : d > maxDate ? maxDate : d
  // Apply a preset, clamping its start into the available data window so the
  // picker never lands on an all-disabled month (presets can reach before the
  // first stored month).
  const applyPreset = (p: (typeof DATE_PRESETS)[number]) => {
    setDatePreset(p.id)
    const r = lastMonthsRange(p.months)
    setRange({ from: r.from ? clampDate(r.from) : r.from, to: r.to })
  }
  const fromISO = range?.from ? toISODate(range.from) : null
  const toISO = range?.from ? toISODate(range.to ?? range.from) : null
  const dates = fromISO
    ? allDates.filter((d) => d >= fromISO && d <= toISO!)
    : allDates

  // Trend: one line per visible competitor, pivoted to one row/date.
  const seriesDomains = (history?.competitors ?? [])
    .filter((c) => selectedSet.has(c.domain) && passes(c.domain))
    .slice(0, MAX_LINES)
  const series: TrafficSeries[] = seriesDomains.map((c, i) => ({
    key: `d${i}`,
    label: c.domain,
    color: colorFor(c.domain, i),
  }))
  const trendRows: TrafficRow[] = dates.map((date) => {
    const row: TrafficRow = { month: fmtMonth(date) }
    seriesDomains.forEach((c, i) => {
      const pt = c.points.find((p) => p.captured_on === date)
      row[`d${i}`] = (pt ? pt[field] : null) as number
    })
    return row
  })
  // True only when the ACTIVE metric has values to plot for the selected domains.
  const hasSeriesData = seriesDomains.some((c) =>
    c.points.some((p) => p[field] != null),
  )
  // The donut's reference month = the month in range where the MOST selected
  // domains have a value for the ACTIVE metric (latest on a tie). A trailing
  // month often has data for only one domain (search volume lags, runs differ),
  // which would make the share reflect just that domain — this picks the most
  // complete recent month so the donut shows ALL competitors.
  const valueAt = (c: (typeof seriesDomains)[number], d: string) => {
    const pt = c.points.find((p) => p.captured_on === d)
    return pt != null ? pt[field] : null
  }
  let currentMonth: string | null = null
  let bestCount = 0
  for (const d of dates) {
    const count = seriesDomains.reduce(
      (n, c) => n + (valueAt(c, d) != null ? 1 : 0),
      0,
    )
    if (count > 0 && count >= bestCount) {
      bestCount = count
      currentMonth = d
    }
  }

  // Donut: share of the ACTIVE metric at the current month, among the same
  // domains plotted above. Value / total of selected domains × 100.
  const metricAt = (domain: string): number => {
    const c = seriesDomains.find((s) => s.domain === domain)
    const pt = currentMonth
      ? c?.points.find((p) => p.captured_on === currentMonth)
      : undefined
    return (pt?.[field] as number | null) ?? 0
  }
  const shareTotal = seriesDomains.reduce((s, c) => s + metricAt(c.domain), 0)
  const share: ShareSlice[] = seriesDomains
    .map((c) => ({
      name: c.domain,
      value: shareTotal ? (metricAt(c.domain) / shareTotal) * 100 : 0,
      color: colorFor(c.domain),
    }))
    .filter((s) => s.value > 0)

  const latestDate =
    currentMonth ??
    allDates.at(-1) ??
    analytics?.fetched_at?.slice(0, 10) ??
    null
  const summaryMonth = latestDate ? fmtMonthYear(latestDate) : "latest snapshot"
  const defaultSpan = allDates.length
    ? `${fmtMonthYear(allDates[0])} – ${fmtMonthYear(allDates[allDates.length - 1])}`
    : "No history yet"
  const rangeLabel = range?.from
    ? `${fmtMonthYear(toISODate(range.from))} – ${fmtMonthYear(toISODate(range.to ?? range.from))}`
    : defaultSpan
  const currentMarket =
    MARKET_OPTIONS.find((m) => m.code === market) ?? MARKET_OPTIONS[0]
  const enoughHistory = dates.length >= 2 && hasSeriesData

  // Export the active tab's series as CSV (one column per domain, one row/month).
  const exportCsv = () => {
    if (!trendRows.length || !series.length) return
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
    const header = ["Month", ...series.map((s) => s.label)]
    const body = trendRows.map((r) =>
      [r.month, ...series.map((s) => r[s.key] ?? "")].map(esc).join(","),
    )
    const csv = [header.map(esc).join(","), ...body].join("\n")
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    )
    const a = document.createElement("a")
    a.href = url
    a.download = `competitive-strategy-${metric}-${market}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }
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
              formId="add-competitor"
              options={addOptions}
              onPick={pickDomain}
              onTextChange={setAddText}
              clearOnPick
              addOnSelect={false}
              selectOnly
              placeholder="Competitor to compare"
            />

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium aria-expanded:border-primary"
                  >
                    <MarketFlag code={currentMarket.code} />
                    {currentMarket.label}
                    <ChevronDown className="size-4 text-muted-foreground" />
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="min-w-44">
                {MARKET_OPTIONS.map((m) => (
                  <DropdownMenuItem
                    key={m.code}
                    onClick={() => setMarket(m.code)}
                  >
                    <MarketFlag code={m.code} />
                    {m.label}
                    {market === m.code && (
                      <Check className="ml-auto !text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              type="submit"
              form="add-competitor"
              variant="default"
              disabled={!canAddCompetitor}
              className="shrink-0 text-white disabled:pointer-events-auto disabled:cursor-not-allowed disabled:bg-sky-400 disabled:hover:bg-sky-400 disabled:opacity-100"
            >
              <Plus className="size-4" /> Add
            </Button>
          </div>

          {/* VS comparison: your website vs each selected competitor. */}
          <div className="flex flex-wrap items-center gap-2">
            {primaryHost && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-3 py-2 text-sm font-semibold">
                <Favicon domain={primaryHost} size={16} />
                <span className="truncate">{primaryHost}</span>
                <span className="shrink-0 rounded bg-primary/15 px-1.5 py-px text-xs font-medium text-primary">
                  Your Website
                </span>
              </div>
            )}
            {competitorDomains.length > 0 && (
              <span className="px-0.5 text-xs font-bold text-muted-foreground">
                VS
              </span>
            )}
            {competitorDomains.map((d) => (
              <div
                key={d}
                className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2 text-sm font-medium"
              >
                <Link
                  href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(d)}`}
                  title={`View ${d} keywords`}
                  className="flex min-w-0 items-center gap-2 hover:text-primary"
                >
                  <Favicon domain={d} size={16} />
                  <span className="truncate">{d}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => removeDomain(d)}
                  aria-label={`Remove ${d}`}
                  className="shrink-0 rounded text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
            <span className="ml-1 text-xs text-muted-foreground">
              {competitorDomains.length} competitor
              {competitorDomains.length === 1 ? "" : "s"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Controls — view tabs · All Filters · date range · search, all one row. */}
      <div className="flex flex-wrap items-center gap-2">
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

        {/* "All Filters" removed for now — it only held a min-traffic filter that
            wasn't useful yet. Re-add a <Popover> of filters here (and the backing
            state) when there are real filters to offer. The free-text "Search in
            results" box on the right still works. */}

        {q && (
          <FilterChip
            label={`Search: ${search.trim()}`}
            onClear={() => setSearch("")}
          />
        )}

        {/* Right side: date range (from → to, defaults to last 12 months) + search. */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
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
            <PopoverContent align="end" className="w-auto min-w-56 p-3">
              <p className="mb-2 px-1 text-sm font-semibold">Date range</p>
              <div className="space-y-0.5">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                  >
                    <span
                      className={`grid size-4 shrink-0 place-items-center rounded-full border ${datePreset === p.id ? "border-primary" : "border-input"}`}
                    >
                      {datePreset === p.id && (
                        <span className="size-2 rounded-full bg-primary" />
                      )}
                    </span>
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setDatePreset("custom")}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                >
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded-full border ${datePreset === "custom" ? "border-primary" : "border-input"}`}
                  >
                    {datePreset === "custom" && (
                      <span className="size-2 rounded-full bg-primary" />
                    )}
                  </span>
                  Custom
                </button>
              </div>
              {datePreset === "custom" && (
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">Start date</span>
                    <DatePicker
                      value={range?.from}
                      onChange={(d) => setRange({ from: d, to: range?.to })}
                      min={minDate}
                      max={range?.to ?? maxDate}
                      placeholder="Start date"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted-foreground">End date</span>
                    <DatePicker
                      value={range?.to}
                      onChange={(d) => setRange({ from: range?.from, to: d })}
                      min={range?.from ?? minDate}
                      max={maxDate}
                      placeholder="End date"
                    />
                  </div>
                </div>
              )}
              <p className="mt-2 border-t border-border px-1 pt-2 text-xs text-muted-foreground">
                {rangeLabel}
              </p>
            </PopoverContent>
          </Popover>

          <div className="relative w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in results…"
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {view === "overlap" ? (
        <CompetitorGapOverlap
          competitors={competitorDomains}
          market={market}
          search={q}
        />
      ) : (
        /* Performance summary. */
        <Card className="duration-300 animate-in fade-in slide-in-from-bottom-1">
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="dashboard-icon">
                  <BarChart3 className="size-4" />
                </span>
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
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label="Download CSV"
                  onClick={exportCsv}
                  disabled={!trendRows.length}
                >
                  <Download />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  aria-label={expanded ? "Exit full screen" : "Full screen"}
                  onClick={() => setExpanded((e) => !e)}
                >
                  {expanded ? <Minimize2 /> : <Maximize2 />}
                </Button>
              </div>
            </div>

            <div
              className={
                expanded
                  ? "fixed inset-0 z-50 grid content-center gap-6 overflow-auto bg-background p-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
                  : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
              }
            >
              {expanded && (
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="Exit full screen"
                  className="fixed right-5 top-5 z-10 rounded-lg border border-input bg-card p-2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
              <div key={metric} className="duration-300 animate-in fade-in">
                {enoughHistory ? (
                  <>
                    <CompetitorTrafficChart rows={trendRows} series={series} />
                    <div className="mt-2 flex flex-wrap justify-center gap-5">
                      {series.map((s) => (
                        <Link
                          key={s.key}
                          href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(s.label)}`}
                          title={`View ${s.label} keywords`}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
                        >
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: s.color }}
                          />
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : hasSeriesData ? (
                  <div className="flex h-[20rem] items-center justify-center rounded-xl border border-dashed border-border px-6 text-center text-sm text-muted-foreground">
                    No data in the selected date range — widen the range to see
                    the trend.
                  </div>
                ) : metric === "volume" ? (
                  // Search volume is derived from each domain's ranked keywords.
                  <div className="flex h-[20rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 text-center">
                    <p className="text-sm font-medium">
                      No search-volume data yet for these domains.
                    </p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Search volume is built from each domain’s ranked keywords.
                      Fetch ranked keywords for your website and competitors to
                      populate this tab.
                    </p>
                    <Button
                      size="sm"
                      render={<Link href="/dashboard/competitors/keywords" />}
                    >
                      <RefreshCw /> Fetch keyword data
                    </Button>
                  </div>
                ) : (
                  // No monthly traffic/keyword history yet: one fetch pulls 12 months.
                  <div className="flex h-[20rem] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 text-center">
                    <p className="text-sm font-medium">
                      No trend data yet for this market.
                    </p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Fetch the last 12 months of competitor estimated traffic
                      and ranking-keyword history. One fetch builds the whole
                      trend.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => refreshAnalytics(allDates.length > 0)}
                      disabled={refreshing || !ready}
                    >
                      {refreshing ? (
                        <Loader2 className="animate-spin" />
                      ) : (
                        <RefreshCw />
                      )}
                      {refreshing
                        ? "Fetching 12-month history…"
                        : "Fetch metrics data"}
                    </Button>
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <BarChart3 className="size-4 text-primary" /> {shareTitle}
                </p>
                {share.length > 0 ? (
                  <>
                    <CompetitorShareDonut
                      data={share}
                      centerLabel={summaryMonth}
                    />
                    <ul className="mt-3 space-y-1.5">
                      {share.map((s) => (
                        <li
                          key={s.name}
                          className="flex items-center justify-between text-sm"
                        >
                          <Link
                            href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(s.name)}`}
                            title={`View ${s.name} keywords`}
                            className="flex min-w-0 items-center gap-2 text-muted-foreground hover:text-primary"
                          >
                            <span
                              className="size-2.5 shrink-0 rounded-sm"
                              style={{ background: s.color }}
                            />
                            <span className="truncate">{s.name}</span>
                          </Link>
                          <span className="font-semibold tabular-nums">
                            {s.value >= 0.05
                              ? `${s.value.toFixed(1)}%`
                              : s.value > 0
                                ? "<0.1%"
                                : "0.0%"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No {shareTitle.toLowerCase()} for this month yet.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
