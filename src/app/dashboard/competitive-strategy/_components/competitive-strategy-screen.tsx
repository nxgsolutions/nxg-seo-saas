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
  Filter,
  History,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Search,
  Swords,
  Users,
  X,
} from "lucide-react"
import type { DateRange } from "react-day-picker"

import { PageHeader } from "@/components/dashboard/page-header"
import { Favicon } from "@/app/dashboard/competitors/_components/favicon"
import {
  useActiveDomain,
  useActiveMarket,
  useCompetitorSelection,
} from "@/hooks/dashboard"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
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
import { LoadingOverlay } from "@/components/ui/loading-overlay"
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
// Primary website + up to 4 competitors = 5 series max.
const MAX_LINES = 5

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

// Markets the user can compare in — every country the analytics/location table
// supports. Each drives the `country` param of the analytics + trend queries.
// The default is the active website's own market (see `coerceMarket`), not a
// fixed country.
const MARKET_OPTIONS: {
  code: AnalyticsCountry
  label: string
}[] = [
  { code: "in", label: "India" },
  { code: "us", label: "United States" },
]
const SUPPORTED_MARKETS = MARKET_OPTIONS.map((m) => m.code)

/** The website's own market if it's one we support here, else India (the only
 *  market enabled for now). Keeps the picker honest about which markets have data. */
function coerceMarket(country: string | undefined): AnalyticsCountry {
  return (SUPPORTED_MARKETS as readonly string[]).includes(country ?? "")
    ? (country as AnalyticsCountry)
    : "in"
}

/** Inline SVG flag — flag emoji don't render on Windows, so draw them. */
function MarketFlag({ code }: { code: AnalyticsCountry }) {
  const props = {
    width: 18, height: 12, "aria-hidden": true,
    className: "shrink-0 rounded-[2px] ring-1 ring-black/10",
  } as const
  switch (code) {
    case "us":
      return (
        <svg viewBox="0 0 26 16" {...props}>
          <rect width="26" height="16" fill="#B22234" />
          {[1, 3, 5, 7, 9, 11].map((i) => (
            <rect key={i} y={(i * 16) / 13} width="26" height={16 / 13} fill="#fff" />
          ))}
          <rect width="11" height={(16 * 7) / 13} fill="#3C3B6E" />
        </svg>
      )
    case "gb":
      return (
        <svg viewBox="0 0 24 16" {...props}>
          <rect width="24" height="16" fill="#012169" />
          <g stroke="#fff" strokeWidth="3.2">
            <line x1="0" y1="0" x2="24" y2="16" />
            <line x1="24" y1="0" x2="0" y2="16" />
          </g>
          <g stroke="#C8102E" strokeWidth="1.6">
            <line x1="0" y1="0" x2="24" y2="16" />
            <line x1="24" y1="0" x2="0" y2="16" />
          </g>
          <rect x="9" width="6" height="16" fill="#fff" />
          <rect y="5" width="24" height="6" fill="#fff" />
          <rect x="10" width="4" height="16" fill="#C8102E" />
          <rect y="6" width="24" height="4" fill="#C8102E" />
        </svg>
      )
    case "ca":
      return (
        <svg viewBox="0 0 24 16" {...props}>
          <rect width="24" height="16" fill="#fff" />
          <rect width="6" height="16" fill="#D52B1E" />
          <rect x="18" width="6" height="16" fill="#D52B1E" />
          <path
            fill="#D52B1E"
            d="M12 3.4l.85 1.7 1.9-.4-.85 1.8 1.5 1-1.8.55.3 1.95-1.5-1.05v2.1h-.8V9.95l-1.5 1.05.3-1.95-1.8-.55 1.5-1-.85-1.8 1.9.4z"
          />
        </svg>
      )
    case "au":
      return (
        <svg viewBox="0 0 24 16" {...props}>
          <rect width="24" height="16" fill="#00247D" />
          <g stroke="#fff" strokeWidth="1.6">
            <line x1="0" y1="0" x2="12" y2="8" />
            <line x1="12" y1="0" x2="0" y2="8" />
          </g>
          <rect x="5" width="2" height="8" fill="#fff" />
          <rect y="3" width="12" height="2" fill="#fff" />
          <rect x="5.4" width="1.2" height="8" fill="#C8102E" />
          <rect y="3.4" width="12" height="1.2" fill="#C8102E" />
          <circle cx="6" cy="12.5" r="1.3" fill="#fff" />
          <circle cx="18" cy="4" r="0.8" fill="#fff" />
          <circle cx="20.5" cy="8" r="0.8" fill="#fff" />
          <circle cx="17" cy="11" r="0.8" fill="#fff" />
          <circle cx="21" cy="12.5" r="0.6" fill="#fff" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 16" {...props}>
          <rect width="24" height="16" fill="#fff" />
          <rect width="24" height="5.333" fill="#FF9933" />
          <rect y="10.667" width="24" height="5.333" fill="#138808" />
          <circle cx="12" cy="8" r="1.9" fill="none" stroke="#000080" strokeWidth="0.5" />
        </svg>
      )
  }
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
/** Full date as DD-MM-YYYY (zero-padded). */
function fmtDMY(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0")
  const month = String(d.getMonth() + 1).padStart(2, "0")
  return `${day}-${month}-${d.getFullYear()}`
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
  // Market (country) the comparison runs in — defaults to the active website's
  // OWN configured market (not a fixed country). The picker can still override
  // it; the override holds until the user switches to another website, at which
  // point it follows that website's market again.
  const domainMarket = coerceMarket(useActiveMarket().country)
  const [market, setMarket] = React.useState<AnalyticsCountry>(domainMarket)
  const [prevDomainMarket, setPrevDomainMarket] = React.useState(domainMarket)
  if (domainMarket !== prevDomainMarket) {
    setPrevDomainMarket(domainMarket)
    setMarket(domainMarket)
  }
  const {
    ready,
    analytics,
    history,
    strategy,
    loading,
    error,
    refreshAnalytics,
    refreshAnalyticsAsync,
    refreshing,
  } = useCompetitiveStrategyData(market)
  // Primary website comes from the currently selected project (top bar), never
  // hardcoded — it is always pinned first in the comparison.
  const activeDomain = useActiveDomain()
  const domainId = activeDomain?.id ?? null
  // The user's own website — always pinned, never a "competitor", and never
  // counted toward the 4-competitor limit.
  const primaryHost = normHost(activeDomain?.domain ?? "")
  // Persistent, capped (max 4) competitor selection — survives navigation and
  // refresh. `draft` = the chips being built; `compared` = what the charts show.
  const {
    draft,
    compared,
    add,
    remove,
    setDraft,
    compare,
    hydrated,
    isDirty,
    atLimit,
    count,
    max,
  } = useCompetitorSelection(domainId, primaryHost)
  const [metric, setMetric] = React.useState<MetricId>("traffic")
  const [view, setView] = React.useState<ViewId>("market")
  // Confirm dialog for the paid "fetch history" action (competitors missing data).
  // Opened straight from Compare when a drafted competitor has no stored history:
  // Fetch pulls it then shows results; Cancel drops that competitor automatically.
  const [confirmFetch, setConfirmFetch] = React.useState(false)
  // The drafted competitors the dialog is about (no stored history yet).
  const [pendingMissing, setPendingMissing] = React.useState<string[]>([])
  // Set once a fetch has succeeded, so closing the dialog then doesn't also treat
  // it as a cancel (which would remove the competitors we just fetched).
  const confirmedRef = React.useRef(false)
  // Filters (narrow what the charts show): free-text search + date range.
  const [search, setSearch] = React.useState("")
  // Market Research filters — thresholds on each competitor's current whole-site
  // snapshot. Keyword/URL/SERP-level filters live in the Gap & Overlap tab (the
  // trend/share here are whole-site monthly aggregates with no such dimensions).
  const [minTraffic, setMinTraffic] = React.useState(0)
  const [minKeywords, setMinKeywords] = React.useState(0)
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

  // Seed the default comparison (strongest few competitors) the first time a
  // website is opened with no saved selection. Runs once after the localStorage
  // restore (`hydrated`) — afterwards the user's own selection is persisted and
  // this never overwrites it.
  React.useEffect(() => {
    if (!domainId || !hydrated) return
    if (draft.length > 0 || compared.length > 0) return
    const r = analytics?.rows ?? []
    if (r.length === 0) return
    const primary = normHost(activeDomain?.domain ?? "")
    const defaults = r
      .filter((row) => !row.is_you && row.domain !== primary)
      .slice(0, DEFAULT_COMPARE)
      .map((row) => row.domain)
    if (defaults.length === 0) return
    setDraft(defaults)
    compare()
  }, [
    domainId,
    hydrated,
    draft.length,
    compared.length,
    analytics,
    activeDomain,
    setDraft,
    compare,
  ])

  // Brief "updating" flash after a Market Research filter / date / metric change,
  // so the charts show a blurred loading overlay while they recompute.
  const [mrPending, setMrPending] = React.useState(false)
  const mrFilterKey = `${minTraffic}|${minKeywords}|${metric}|${market}|${datePreset}|${range?.from?.getTime() ?? ""}|${range?.to?.getTime() ?? ""}`
  const mrFirstRun = React.useRef(true)
  React.useEffect(() => {
    if (mrFirstRun.current) {
      mrFirstRun.current = false
      return
    }
    setMrPending(true)
    const t = setTimeout(() => setMrPending(false), 450)
    return () => clearTimeout(t)
  }, [mrFilterKey])

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
  // Whether THIS workspace + website has any competitors to compare. A competitor
  // is any non-primary domain in the SERP footprint or the analytics rows — both
  // workspace/website-scoped. We deliberately do NOT count the primary domain's
  // own whole-site metrics here: those tables are keyed by domain string and are
  // global, so a brand-new workspace can already have the primary's data. Without
  // competitors there is nothing to compare, so we show an empty state instead of
  // a solo chart of the primary (and never any mock/fallback data).
  const hasCompetitors =
    (strategy?.competitors?.length ?? 0) > 0 || rows.some((r) => !r.is_you)
  if (!hasCompetitors) {
    return (
      <div className="space-y-5">
        {header}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <span
              aria-hidden
              className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Users className="size-6" />
            </span>
            <div className="space-y-1.5">
              <p className="text-base font-semibold">No competitors added yet</p>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Head to Competitor Analysis to fetch and add your competitors,
                then come back here to compare them.
              </p>
            </div>
            <Button size="lg" render={<Link href="/dashboard/competitors" />}>
              <Users /> Get Your Competitors
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

  // Two sets: `draft` drives the chips the user is building; `compared` (the
  // committed set, via the Compare button) drives the charts below. Primary is
  // always pinned first and never counts toward the 4-competitor cap.
  const draftCompetitors = draft.filter((d) => d !== primaryHost)
  const comparedCompetitors = compared.filter((d) => d !== primaryHost)
  const effectiveSelected = primaryHost
    ? [primaryHost, ...comparedCompetitors]
    : comparedCompetitors
  const selectedSet = new Set(effectiveSelected)
  const competitorDomains = comparedCompetitors

  // Known competitors for THIS website: stored analytics rows + its SERP
  // footprint. The combobox only ever offers these — never an external domain.
  const knownDomains = new Map<string, ComboboxOption>()
  rows.forEach((r) => {
    if (r.is_you || r.domain === primaryHost) return
    knownDomains.set(r.domain, {
      value: r.domain,
      hint: `${r.traffic_share.toFixed(1)}%`,
      icon: <Favicon domain={r.domain} size={16} />,
    })
  })
  ;(strategy?.competitors ?? []).forEach((c) => {
    if (c.domain === primaryHost) return
    if (!knownDomains.has(c.domain))
      knownDomains.set(c.domain, {
        value: c.domain,
        icon: <Favicon domain={c.domain} size={16} />,
      })
  })
  const comboOptions = [...knownDomains.values()]

  // Selecting a competitor in the combobox adds it as a chip immediately (no Add
  // button). The cap is enforced in the hook; the combobox is also disabled at 4.
  const pickDomain = (d: string) => {
    const h = normHost(d)
    if (h && h !== primaryHost) add(h)
  }
  // Primary can never be removed; only competitors are removable from the draft.
  const removeDomain = (d: string) => {
    if (d === primaryHost) return
    remove(d)
  }

  // --- Filters narrow which competitors + dates appear in the charts ---
  const q = search.trim().toLowerCase()
  // Each competitor's current whole-site snapshot (for the threshold filters).
  const rowByDomain = new Map(rows.map((r) => [r.domain, r]))
  const passes = (domain: string) => {
    if (domain === primaryHost) return true // primary is always shown
    if (q && !domain.toLowerCase().includes(q)) return false
    const row = rowByDomain.get(domain)
    if (minTraffic > 0 && (row?.organic_traffic ?? 0) < minTraffic) return false
    if (minKeywords > 0 && (row?.ranking_keywords ?? 0) < minKeywords) return false
    return true
  }
  // Active Market Research filter chips (search chip is rendered separately).
  const marketFilters: { key: string; label: string; clear: () => void }[] = []
  if (minTraffic > 0)
    marketFilters.push({ key: "mt", label: `Traffic ≥ ${minTraffic.toLocaleString()}`, clear: () => setMinTraffic(0) })
  if (minKeywords > 0)
    marketFilters.push({ key: "mk", label: `Keywords ≥ ${minKeywords.toLocaleString()}`, clear: () => setMinKeywords(0) })
  const resetMarketFilters = () => {
    setMinTraffic(0)
    setMinKeywords(0)
    applyPreset(DATE_PRESETS[0]) // back to the default last-6-months window
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
    ? `${fmtDMY(range.from)} – ${fmtDMY(range.to ?? range.from)}`
    : defaultSpan
  const currentMarket =
    MARKET_OPTIONS.find((m) => m.code === market) ?? MARKET_OPTIONS[0]
  const enoughHistory = dates.length >= 2 && hasSeriesData

  // Compared competitors with no stored history yet (absent from the trend, or
  // only null points). They stay selected; charts still render for the rest.
  const historyDomainsWithData = new Set(
    (history?.competitors ?? [])
      .filter((c) =>
        c.points.some(
          (p) =>
            p.organic_traffic != null ||
            p.ranking_keywords != null ||
            p.search_volume != null,
        ),
      )
      .map((c) => c.domain),
  )
  // Compare is the trigger: when a drafted competitor has no stored history we
  // don't quietly commit it — we ask first (fetch now, or cancel & drop it).
  //
  // Compare button. If every drafted competitor already has data, commit now.
  // Otherwise open the confirm dialog for the ones that don't.
  const handleCompare = () => {
    const missing = draftCompetitors.filter((d) => !historyDomainsWithData.has(d))
    if (missing.length > 0) {
      confirmedRef.current = false
      setPendingMissing(missing)
      setConfirmFetch(true)
      return
    }
    compare()
  }

  // Fetch now: pull the missing domains (stored data reused), then show results.
  const confirmFetchHistory = async () => {
    await refreshAnalyticsAsync(
      false,
      pendingMissing.length > 0 ? pendingMissing : undefined,
    )
    compare()
    confirmedRef.current = true
  }

  // Closing the dialog. "Still compare now" (or a dismiss) commits the
  // comparison as-is, keeping the competitors that had no data — their chart
  // lines simply stay empty until the data is fetched later.
  const handleFetchDialogOpenChange = (open: boolean) => {
    if (!open) {
      if (!confirmedRef.current && pendingMissing.length > 0) {
        compare()
      }
      setPendingMissing([])
      confirmedRef.current = false
    }
    setConfirmFetch(open)
  }

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
            <div className="min-w-[16rem] flex-1">
              <Combobox
                options={comboOptions}
                exclude={draftCompetitors}
                onSelect={pickDomain}
                disabled={atLimit}
                loading={loading}
                placeholder={
                  atLimit
                    ? "Maximum of 4 competitors selected"
                    : "Search competitors by domain…"
                }
                searchPlaceholder="Search competitors…"
                emptyLabel="No competitors found for this website yet."
                noResultsLabel="No matching competitor."
              />
            </div>

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
              type="button"
              variant="default"
              onClick={handleCompare}
              disabled={!isDirty}
              className="shrink-0"
            >
              <Swords className="size-4" /> Compare
            </Button>
          </div>

          {/* Selection count + the max-4 notice. */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-muted-foreground">
              {count}/{max} competitors selected
            </span>
            {atLimit ? (
              <span className="text-amber-600 dark:text-amber-400">
                You can compare a maximum of 4 competitors. Remove one to add
                another.
              </span>
            ) : isDirty ? (
              <span className="text-primary">
                Selection changed — click Compare to update the charts.
              </span>
            ) : null}
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
            {draftCompetitors.length > 0 && (
              <span className="px-0.5 text-xs font-bold text-muted-foreground">
                VS
              </span>
            )}
            {draftCompetitors.map((d) => (
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
              {draftCompetitors.length} competitor
              {draftCompetitors.length === 1 ? "" : "s"}
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

        {/* All Filters — whole-site thresholds for the Market Research charts. */}
        {view === "market" && (
          <Popover>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium aria-expanded:border-primary"
                >
                  <Filter className="size-4 text-muted-foreground" />
                  All filters
                  {marketFilters.length > 0 && (
                    <span className="rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">
                      {marketFilters.length}
                    </span>
                  )}
                </button>
              }
            />
            <PopoverContent align="start" className="w-80 p-4">
              <p className="mb-1 text-sm font-semibold">Filter competitors</p>
              <p className="mb-3 text-xs text-muted-foreground">
                Thresholds on each competitor’s current whole-site metrics. Keyword,
                position and SERP-feature filters live in the Gap &amp; Overlap tab.
              </p>
              <div className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Minimum estimated traffic / mo
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={minTraffic || ""}
                    onChange={(e) => setMinTraffic(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="e.g. 100000"
                    className="h-9 bg-card"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Minimum ranking keywords
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={minKeywords || ""}
                    onChange={(e) => setMinKeywords(Math.max(0, Number(e.target.value) || 0))}
                    placeholder="e.g. 5000"
                    className="h-9 bg-card"
                  />
                </label>

                {/* Date range — the window the trend + donut cover. */}
                <div className="space-y-1.5 border-t border-border pt-3">
                  <span className="text-xs font-medium text-muted-foreground">Date range</span>
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
                    <div className="grid grid-cols-2 gap-2 pt-1">
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
                  <p className="px-0.5 text-xs text-muted-foreground">{rangeLabel}</p>
                </div>

                {(marketFilters.length > 0 || datePreset !== "6m") && (
                  <button
                    type="button"
                    onClick={resetMarketFilters}
                    className="w-full rounded-lg border border-border py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {q && (
          <FilterChip
            label={`Search: ${search.trim()}`}
            onClear={() => setSearch("")}
          />
        )}
        {view === "market" &&
          marketFilters.map((f) => (
            <FilterChip key={f.key} label={f.label} onClear={f.clear} />
          ))}
        {view === "market" && range?.from && (
          <FilterChip
            label={`Date: ${rangeLabel}`}
            onClear={() => applyPreset(DATE_PRESETS[0])}
          />
        )}

        {/* Right side: free-text search. The date range + thresholds live in the
            All filters dropdown; the active range shows as a removable chip. */}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="relative w-48">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in results…"
              className="bg-card pl-9"
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
                  : "relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]"
              }
            >
              <LoadingOverlay show={mrPending} />
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

      {/* Opened from Compare when a competitor has no data yet: "Get now and
          compare" fetches it then shows results; "Still compare now" compares
          as-is, keeping the competitor (its line just stays empty). */}
      <ConfirmDialog
        open={confirmFetch}
        onOpenChange={handleFetchDialogOpenChange}
        tone="default"
        icon={<History className="size-5" />}
        title="Competitor data not available"
        description={
          pendingMissing.length === 1
            ? `No data currently for ${pendingMissing[0]}.`
            : `No data currently for ${pendingMissing.join(", ")}.`
        }
        confirmLabel="Get now and compare"
        cancelLabel="Still compare now"
        onConfirm={confirmFetchHistory}
      />
    </div>
  )
}
