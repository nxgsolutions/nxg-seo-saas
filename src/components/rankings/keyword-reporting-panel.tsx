"use client"

/**
 * Keyword Reporting section ("Total Ranked Keywords") — a stacked bar chart of
 * Page 1/2/3 ranked-keyword counts over time, with date-range + Daily/Weekly/
 * Monthly filters matching the rest of the page. Reads stored SERP snapshots only.
 */
import { KeywordReportingChart } from "@/components/charts/lazy"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useKeywordReporting, useReportingFacets } from "@/hooks/api/use-rankings"
import { cn } from "@/lib/utils"
import {
  BarChart3, Calendar as CalendarIcon, CalendarClock, CalendarDays, CalendarRange, SlidersHorizontal,
} from "lucide-react"
import * as React from "react"

type Freq = "daily" | "weekly" | "monthly"
type Preset = "7d" | "30d" | "3m" | "6m" | "12m" | "custom"

const MAX_RANGE_DAYS = 366

const PRESETS: { id: Exclude<Preset, "custom">; label: string; days: number }[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "3m", label: "Last 3 months", days: 90 },
  { id: "6m", label: "Last 6 months", days: 183 },
  { id: "12m", label: "Last 12 months", days: 365 },
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
function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
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

export function KeywordReportingPanel({ workspaceId, domainId }: { workspaceId: string | null; domainId: string | null }) {
  const [freq, setFreq] = React.useState<Freq>("monthly")
  const [preset, setPreset] = React.useState<Preset>("6m")
  const [customFrom, setCustomFrom] = React.useState<Date | undefined>(() => daysAgo(183))
  const [customTo, setCustomTo] = React.useState<Date | undefined>(() => new Date())

  const { start, end, rangeLabel } = React.useMemo(() => {
    if (preset === "custom") {
      const f = customFrom, t = customTo ?? new Date()
      return f ? { start: toISO(f), end: toISO(t), rangeLabel: `${fmtDay(f)} – ${fmtDay(t)}` }
        : { start: toISO(daysAgo(183)), end: undefined, rangeLabel: "Last 6 months" }
    }
    const p = PRESETS.find((x) => x.id === preset)!
    return { start: toISO(daysAgo(p.days)), end: undefined, rangeLabel: p.label }
  }, [preset, customFrom, customTo])

  // Device / location filters are driven by what's actually in the stored SERPs:
  // a selector only appears once more than one value exists (so today, with
  // desktop/India-only data, both stay hidden and auto-appear later).
  const facetsQuery = useReportingFacets(workspaceId, domainId)
  const facets = facetsQuery.data ?? { devices: [], locations: [] }
  const [device, setDevice] = React.useState<string | undefined>(undefined)
  const [locationCode, setLocationCode] = React.useState<number | undefined>(undefined)
  const showDevice = facets.devices.length > 1
  const showLocation = facets.locations.length > 1

  const q = useKeywordReporting(workspaceId, domainId, {
    freq, start, end,
    device: showDevice ? device : undefined,
    location_code: showLocation ? locationCode : undefined,
  })
  const data = q.data ?? null
  const loading = q.isPending && Boolean(workspaceId && domainId)
  const activeFilters =
    (preset !== "6m" ? 1 : 0) + (showDevice && device ? 1 : 0) + (showLocation && locationCode != null ? 1 : 0)

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-primary" /> Keyword Reporting · Total Ranked Keywords
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            How many of your tracked keywords rank on Page 1, 2 and 3 over time.
          </p>
        </div>

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
            <PopoverContent align="start" className="w-72 p-4">
              <p className="mb-2 text-sm font-semibold">Filters</p>
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
                      <DatePicker value={customFrom} onChange={(d) => {
                        setCustomFrom(d)
                        if (d && customTo && customTo.getTime() - d.getTime() > MAX_RANGE_DAYS * 864e5) setCustomTo(addDays(d, MAX_RANGE_DAYS))
                      }} placeholder="Start" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-muted-foreground">End</span>
                      <DatePicker value={customTo} onChange={setCustomTo} placeholder="End" />
                    </div>
                  </div>
                )}
                <p className="px-0.5 text-xs text-muted-foreground">{rangeLabel} · max 12 months</p>
              </div>
            </PopoverContent>
          </Popover>
          </div>

          {showDevice ? (
            <div className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Device</span>
              <Select value={device ?? "__all__"} onValueChange={(v) => setDevice(!v || v === "__all__" ? undefined : v)}>
                <SelectTrigger className="min-w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All devices</SelectItem>
                  {facets.devices.map((d) => (
                    <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          {showLocation ? (
            <div className="space-y-1">
              <span className="block text-xs font-medium text-muted-foreground">Location</span>
              <Select
                value={locationCode != null ? String(locationCode) : "__all__"}
                onValueChange={(v) => setLocationCode(!v || v === "__all__" ? undefined : Number(v))}
              >
                <SelectTrigger className="min-w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All locations</SelectItem>
                  {facets.locations.map((l) => (
                    <SelectItem key={l.code} value={String(l.code)}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="ml-auto space-y-1">
            <span className="block text-right text-xs font-medium text-muted-foreground">Frequency</span>
            <SegmentedTabs label="Frequency" value={freq} onChange={setFreq} items={FREQ_TABS} />
          </div>
          </div>
          <p className="min-h-4 text-xs text-muted-foreground">{rangeLabel}</p>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-72 w-full rounded-lg" /> : data ? <KeywordReportingChart data={data} /> : null}
      </CardContent>
    </Card>
  )
}
