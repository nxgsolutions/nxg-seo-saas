"use client"

/**
 * Competitor rank over time, aggregated across the domain's tracked keywords.
 * Shared by the Rankings page (variant="full": date range, frequency, competitor
 * + keyword multi-selects) and the Competitors page (variant="simple": clean
 * overview + a "View details" link to /dashboard/rankings). Reuses KeywordRankChart.
 */
import { KeywordRankChart } from "@/components/charts/lazy"
import { RANK_LINE_COLORS } from "@/components/charts/chart-colors"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Combobox } from "@/components/ui/combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useRankTimeline } from "@/hooks/api/use-rankings"
import { cn } from "@/lib/utils"
import {
  ArrowRight, Calendar as CalendarIcon, CalendarClock, CalendarDays, CalendarRange, Check,
  SlidersHorizontal, TrendingUp,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

type Freq = "daily" | "weekly" | "monthly"
type Preset = "3m" | "6m" | "12m" | "custom"

const ALL_KEYWORDS = "__all_keywords__"

const MAX_RANGE_DAYS = 366 // 12 months is the maximum range

const PRESETS: { id: Exclude<Preset, "custom">; label: string }[] = [
  { id: "3m", label: "Last 3 months" },
  { id: "6m", label: "Last 6 months" },
  { id: "12m", label: "Last 12 months" },
]

const FREQ_TABS = [
  { value: "daily" as const, label: "Daily", icon: CalendarClock },
  { value: "weekly" as const, label: "Weekly", icon: CalendarDays },
  { value: "monthly" as const, label: "Monthly", icon: CalendarRange },
]

function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${m}-${day}`
}
function fmtDay(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}
function monthsAgo(n: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return d
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function DatePicker({ value, onChange, placeholder }: { value?: Date; onChange: (d?: Date) => void; placeholder: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 font-normal">
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          {value ? fmtDay(value) : <span className="text-muted-foreground">{placeholder}</span>}
        </Button>
      } />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="single" selected={value} onSelect={(d) => { onChange(d); if (d) setOpen(false) }}
          defaultMonth={value} disabled={{ after: new Date() }} />
      </PopoverContent>
    </Popover>
  )
}

/** Generic multi-select popover (checkbox list + select/clear all). */
function MultiSelect({
  label, options, off, onToggle, onAll, onClear, colored,
}: {
  label: string
  options: { value: string; label: string }[]
  off: Set<string>
  onToggle: (v: string) => void
  onAll: () => void
  onClear: () => void
  colored?: boolean
}) {
  const on = options.length - options.filter((o) => off.has(o.value)).length
  return (
    <div className="space-y-1.5 border-t border-border pt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label} ({on}/{options.length})</span>
        <span className="flex gap-2 text-xs">
          <button type="button" className="text-primary hover:underline" onClick={onAll}>Select all</button>
          <button type="button" className="text-muted-foreground hover:underline" onClick={onClear}>Clear all</button>
        </span>
      </div>
      <div className="max-h-44 space-y-0.5 overflow-y-auto">
        {options.map((o, i) => {
          const isOff = off.has(o.value)
          const color = RANK_LINE_COLORS[i % RANK_LINE_COLORS.length]
          return (
            <button key={o.value} type="button" onClick={() => onToggle(o.value)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
              <span className={cn("grid size-4 shrink-0 place-items-center rounded border",
                isOff ? "border-input" : "border-primary bg-primary text-primary-foreground")}>
                {!isOff && <Check className="size-3" />}
              </span>
              {colored && <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
              <span className="truncate">{o.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CompetitorRankTimeline({
  workspaceId,
  domainId,
  variant = "full",
  keywordOptions = [],
  selectedKeywordId = null,
  onKeywordChange,
  top,
  bare = false,
}: {
  workspaceId: string | null
  domainId: string | null
  variant?: "full" | "simple"
  /** Tracked keywords for the keyword combobox (full variant). */
  keywordOptions?: { id: string; term: string }[]
  /** Selected keyword id, or null for "All keywords (average)". */
  selectedKeywordId?: string | null
  /** Called when the keyword combobox changes (id, or null for All). */
  onKeywordChange?: (id: string | null) => void
  /** Max competitor lines to request. */
  top?: number
  /** Render just the filter bar + chart (no Card wrapper) for embedding. */
  bare?: boolean
}) {
  const [freq, setFreq] = React.useState<Freq>("weekly")
  const [preset, setPreset] = React.useState<Preset>(variant === "simple" ? "12m" : "6m")
  const [customFrom, setCustomFrom] = React.useState<Date | undefined>(() => monthsAgo(6))
  const [customTo, setCustomTo] = React.useState<Date | undefined>(() => new Date())
  const [compOff, setCompOff] = React.useState<Set<string>>(new Set())

  const defaultPreset: Preset = variant === "simple" ? "12m" : "6m"

  const { start, end, rangeLabel } = React.useMemo(() => {
    if (preset === "custom") {
      const f = customFrom, t = customTo ?? new Date()
      return f ? { start: toISO(f), end: toISO(t), rangeLabel: `${fmtDay(f)} – ${fmtDay(t)}` }
        : { start: toISO(monthsAgo(6)), end: undefined, rangeLabel: "Last 6 months" }
    }
    const n = preset === "3m" ? 3 : preset === "6m" ? 6 : 12
    return { start: toISO(monthsAgo(n)), end: undefined, rangeLabel: `Last ${n} months` }
  }, [preset, customFrom, customTo])

  // One keyword → that keyword's SERP competitors; null → all keywords averaged.
  const kwParam = selectedKeywordId ? [selectedKeywordId] : undefined

  // all_competitors is computed server-side independently of the competitor
  // filter, so one query drives both the stable option list and the plotted set.
  // Narrowing sends the chosen hosts so any candidate (not just the default top)
  // can be plotted.
  const data0 = useRankTimeline(workspaceId, domainId, {
    freq, start, end, keywords: kwParam, top,
  }).data
  const allComps = data0?.all_competitors ?? []
  const visibleComps = allComps.filter((h) => !compOff.has(h))
  const compParam = variant === "full" && compOff.size > 0 && visibleComps.length > 0 ? visibleComps : undefined

  const timeline = useRankTimeline(workspaceId, domainId, {
    freq, start, end, keywords: kwParam, competitors: compParam, top,
  })
  const data = timeline.data ?? null
  const loading = timeline.isPending && Boolean(workspaceId && domainId)

  // A trend needs at least two days of data; with one point (or none) we show a
  // clear, plain-language message instead of a chart.
  const dataDays = React.useMemo(() => {
    if (!data) return 0
    const days = new Set<string>()
    for (const p of data.you.points) if (p.position != null) days.add(p.date)
    for (const c of data.competitors) for (const p of c.points) if (p.position != null) days.add(p.date)
    return days.size
  }, [data])

  const activeFilters =
    (preset !== defaultPreset ? 1 : 0) + (compOff.size > 0 ? 1 : 0)

  const notEnough = (
    <div className="flex h-72 flex-col items-center justify-center gap-1 px-6 text-center">
      <p className="text-sm font-medium">Not enough data yet to show a trend</p>
      <p className="text-sm text-muted-foreground">
        We need at least two updates for this keyword. Check back after it has been
        updated again.
      </p>
    </div>
  )

  const chart = loading ? (
    <Skeleton className="h-72 w-full rounded-lg" />
  ) : dataDays < 2 ? (
    notEnough
  ) : variant === "full" && visibleComps.length === 0 && allComps.length > 0 ? (
    <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
      Select at least one competitor to show.
    </div>
  ) : (
    <KeywordRankChart data={data!} />
  )

  if (variant === "simple") {
    return (
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" /> Competitor rank tracking over time
            </CardTitle>
            <p className="text-sm text-muted-foreground">How your competitors’ Google rankings move across your tracked keywords.</p>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/dashboard/rankings" />}>
            View details <ArrowRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>{chart}</CardContent>
      </Card>
    )
  }

  const filterBar = (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
          <span className="block text-xs font-medium text-muted-foreground">Filters</span>
          <Popover>
            <PopoverTrigger render={
              <button type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-input bg-card px-3 py-2 text-sm font-medium aria-expanded:border-primary">
                <SlidersHorizontal className="size-4 text-muted-foreground" /> Filters
                {activeFilters > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-xs font-semibold text-primary">{activeFilters}</span>}
              </button>
            } />
            <PopoverContent align="start" className="max-h-[32rem] w-80 overflow-y-auto p-4">
              <p className="mb-2 text-sm font-semibold">Filters</p>
              {/* Date range */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-muted-foreground">Date range</span>
                <div className="space-y-0.5">
                  {PRESETS.map((p) => (
                    <button key={p.id} type="button" onClick={() => setPreset(p.id)}
                      className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                      <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", preset === p.id ? "border-primary" : "border-input")}>
                        {preset === p.id && <span className="size-2 rounded-full bg-primary" />}
                      </span>
                      {p.label}
                    </button>
                  ))}
                  <button type="button" onClick={() => setPreset("custom")}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted">
                    <span className={cn("grid size-4 shrink-0 place-items-center rounded-full border", preset === "custom" ? "border-primary" : "border-input")}>
                      {preset === "custom" && <span className="size-2 rounded-full bg-primary" />}
                    </span>
                    Custom
                  </button>
                </div>
                {preset === "custom" && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">Start</span>
                      <DatePicker
                        value={customFrom}
                        onChange={(d) => {
                          setCustomFrom(d)
                          // Keep the range within 12 months of the chosen start.
                          if (d && customTo && customTo.getTime() - d.getTime() > MAX_RANGE_DAYS * 864e5) {
                            setCustomTo(addDays(d, MAX_RANGE_DAYS))
                          }
                        }}
                        placeholder="Start"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">End</span>
                      <DatePicker value={customTo} onChange={setCustomTo} placeholder="End" />
                    </div>
                  </div>
                )}
                <p className="px-0.5 text-xs text-muted-foreground">{rangeLabel} · max 12 months</p>
              </div>

              {/* Competitors */}
              {allComps.length > 0 && (
                <MultiSelect label="Competitors" colored
                  options={allComps.map((h) => ({ value: h, label: h }))}
                  off={compOff}
                  onToggle={(v) => setCompOff((p) => { const n = new Set(p); n.has(v) ? n.delete(v) : n.add(v); return n })}
                  onAll={() => setCompOff(new Set())}
                  onClear={() => setCompOff(new Set(allComps))} />
              )}
            </PopoverContent>
          </Popover>
          </div>

          {/* Keyword selector: one keyword, or All keywords (average) */}
          {keywordOptions.length > 0 && onKeywordChange && (
            <div className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Keyword</span>
              <Combobox
                className="w-56"
                value={selectedKeywordId ?? ALL_KEYWORDS}
                placeholder="All keywords (average)"
                searchPlaceholder="Search keywords…"
                options={[
                  { value: ALL_KEYWORDS, label: "All keywords (average)" },
                  ...keywordOptions.map((k) => ({ value: k.id, label: k.term })),
                ]}
                onSelect={(v) => onKeywordChange(v === ALL_KEYWORDS ? null : v)}
              />
            </div>
          )}

          <div className="ml-auto space-y-1">
            <span className="block text-right text-xs font-medium text-muted-foreground">Frequency</span>
            <SegmentedTabs label="Frequency" value={freq} onChange={setFreq} items={FREQ_TABS} />
          </div>
      </div>
      <p className="min-h-4 text-xs text-muted-foreground">
        {rangeLabel}
        {allComps.length > 0 ? ` · ${visibleComps.length}/${allComps.length} competitors` : ""}
      </p>
    </div>
  )

  if (bare) {
    return <div className="space-y-4">{filterBar}{chart}</div>
  }

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-3 space-y-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4 text-primary" /> Ranking over time
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Average Google position for you vs. competitors across your tracked keywords.
            </p>
          </div>
        </div>
        {filterBar}
      </CardHeader>
      <CardContent>{chart}</CardContent>
    </Card>
  )
}
