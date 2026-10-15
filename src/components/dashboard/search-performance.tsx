"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Download,
  Loader2,
  MousePointerClick,
  Search,
  Tag,
  TrendingUp,
} from "lucide-react"

import {
  gscApi,
  type GscKeywordPerformance,
} from "@/lib/api/gsc"
import { type Domain } from "@/lib/api/workspaces"
import { ApiError, errorMessage } from "@/lib/api/client"
import { fetchAllPages } from "@/lib/api/pagination"
import { GSC_FIRST_PAGE, useConnectGsc, useGscKeywords, useGscStatus } from "@/hooks/api/use-gsc"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Pager } from "@/components/ui/pager"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { TrafficTrendChart } from "@/components/charts/lazy"
import { ChartCardSkeleton, KpiRowSkeleton } from "@/components/dashboard/skeletons"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"

type Tab = "overview" | "keywords"

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}

function rankBucket(position: number): { label: string; className: string } {
  if (position <= 3) return { label: "1–3", className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" }
  if (position <= 10) return { label: "4–10", className: "bg-sky-500/12 text-sky-600 dark:text-sky-400" }
  if (position <= 20) return { label: "11–20", className: "bg-amber-500/12 text-amber-600 dark:text-amber-400" }
  return { label: "21+", className: "bg-muted text-muted-foreground" }
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Search; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="size-3.5" />
          {label}
        </div>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function RankDistribution({ d }: { d: GscKeywordPerformance["distribution"] }) {
  const segments = [
    { key: "top3", label: "1–3", value: d.top3, color: "var(--chart-pass)" },
    { key: "top10", label: "4–10", value: d.top10, color: "var(--chart-accent)" },
    { key: "top20", label: "11–20", value: d.top20, color: "var(--chart-warn)" },
    { key: "beyond", label: "21+", value: d.beyond, color: "var(--muted-foreground)" },
  ]
  const total = segments.reduce((s, x) => s + x.value, 0) || 1
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {segments.map((s) =>
          s.value > 0 ? (
            <div key={s.key} style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} title={`${s.label}: ${s.value}`} />
          ) : null
        )}
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-semibold tabular-nums">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type SortField = "clicks" | "impressions" | "ctr" | "position"
const PAGE_SIZE = 25

/** Keywords tab: ONE page from the server (search / sort / paging), previous page kept while the next loads. */
function KeywordTable({ wid, did, days }: { wid: string; did: string; days: number }) {
  const [filter, setFilter] = React.useState("")
  const q = useDebouncedValue(filter)
  const [sort, setSort] = React.useState<{ field: SortField; dir: "asc" | "desc" }>({ field: "clicks", dir: "desc" })
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)

  // A new search / sort starts again at page 1 (adjusted during render).
  const filterKey = `${q}|${sort.field}|${sort.dir}|${days}`
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey)
  if (filterKey !== prevFilterKey) { setPrevFilterKey(filterKey); setPage(1) }

  const list = { page, pageSize: PAGE_SIZE, sort: sort.field, order: sort.dir, q }
  const query = useGscKeywords(wid, did, days, list)
  const rows = query.data?.keywords ?? []

  function toggleSort(field: SortField) {
    setSort((s) =>
      s.field === field
        ? { field, dir: s.dir === "asc" ? "desc" : "asc" }
        : { field, dir: field === "position" ? "asc" : "desc" }
    )
  }

  const th = (field: SortField, label: string, right?: boolean) => {
    const active = sort.field === field
    return (
      <th className={cn("px-3 py-2 font-medium", right && "text-right")}>
        <button
          type="button"
          onClick={() => toggleSort(field)}
          className={cn("inline-flex items-center gap-1 hover:text-foreground", right && "flex-row-reverse", active ? "text-foreground" : "")}
        >
          {label}
          {active ? (sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />) : null}
        </button>
      </th>
    )
  }

  /** Every matching keyword (fetched in big pages), as CSV. */
  async function exportCsv() {
    setExporting(true)
    try {
      const all = await fetchAllPages((p, size) => gscApi.keywords(wid, did, days, { ...list, page: p, pageSize: size })
        .then((d) => ({ rows: d.keywords, pagination: d.pagination! })))
      downloadCsv(
        "search-performance-keywords",
        ["Keyword", "Clicks", "Impressions", "CTR", "Position"],
        all.map((r) => [r.keyword, Math.round(r.clicks), Math.round(r.impressions), pct(r.ctr), r.position.toFixed(1)])
      )
    } catch (err) {
      toast.error(errorMessage(err, "Could not export."))
    } finally { setExporting(false) }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={filter} onValueChange={setFilter} placeholder="Filter keywords…" className="h-9 pl-9" />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting} className="shrink-0">
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export CSV
        </Button>
      </div>
      {query.isError ? (
        <Alert variant="destructive"><AlertDescription>{errorMessage(query.error, "Could not load keywords.")}</AlertDescription></Alert>
      ) : null}
      <div className={cn("overflow-x-auto rounded-lg border border-border transition-opacity", query.isPlaceholderData && "opacity-60")}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Keyword</th>
              <th className="px-3 py-2 font-medium">Rank</th>
              {th("clicks", "Clicks", true)}
              {th("impressions", "Impr.", true)}
              {th("ctr", "CTR", true)}
              {th("position", "Pos.", true)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {query.isPending ? Array.from({ length: 8 }, (_, i) => (
              <tr key={i}>{Array.from({ length: 6 }, (_, c) => (
                <td key={c} className="px-3 py-2.5"><Skeleton className={cn("h-4", c === 0 ? "w-48" : "ml-auto w-12")} /></td>
              ))}</tr>
            )) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">No keywords match.</td>
              </tr>
            ) : (
              rows.map((r) => {
                const b = rankBucket(r.position)
                return (
                  <tr key={r.keyword} className="hover:bg-muted/30">
                    <td className="max-w-[280px] truncate px-3 py-2 font-medium" title={r.keyword}>{r.keyword}</td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-semibold", b.className)}>{b.label}</span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{Math.round(r.clicks).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{Math.round(r.impressions).toLocaleString()}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{pct(r.ctr)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.position.toFixed(1)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <Pager noun="keywords" pagination={query.data?.pagination} fetching={query.isFetching} onPageChange={setPage} />
    </div>
  )
}

/** Shown instead of data until Search Console is connected (never placeholder numbers). */
function ConnectGsc({ configured, connecting, onConnect }: { configured: boolean; connecting: boolean; onConnect: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><BarChart3 className="size-6" /></div>
        <p className="font-medium">Connect Google Search Console</p>
        <p className="max-w-md text-sm text-muted-foreground">
          See your real clicks, impressions, average position and ranking keywords, straight from Google.
        </p>
        {/* `configured` = the server has Google OAuth credentials (GOOGLE_CLIENT_ID / SECRET). */}
        {configured ? (
          <Button onClick={onConnect} disabled={connecting}>
            {connecting ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Connect Search Console
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">Search Console connection isn&apos;t available yet. Please try again later.</p>
        )}
      </CardContent>
    </Card>
  )
}

export function SearchPerformanceView() {
  // The workspace + website picked in the top bar.
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const domain: Domain | null = activeDomain

  const [tab, setTab] = React.useState<Tab>("overview")
  const [days, setDays] = React.useState<28 | 90>(28)

  // Data (TanStack Query): connection status + site performance (cached 5 min).
  const statusQuery = useGscStatus(workspaceId)
  const status = statusQuery.data ?? null
  const connected = Boolean(status?.connected)
  const perf = useGscKeywords(workspaceId, domain?.id ?? null, days, GSC_FIRST_PAGE, connected)
  const connect = useConnectGsc(workspaceId)
  const data = perf.data ?? null
  const error = perf.isError
    ? { message: errorMessage(perf.error, "Could not load Search Console data."), status: perf.error instanceof ApiError ? perf.error.status : 0 }
    : connect.isError ? { message: errorMessage(connect.error, "Could not start the Google connection."), status: 0 } : null

  function startConnect() {
    const returnPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard/search-performance"
    connect.mutate(returnPath)
  }

  const periodToggle = (
    <div className="inline-flex h-9 rounded-lg border border-border p-0.5">
      {([28, 90] as const).map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => setDays(d)}
          className={cn(
            "rounded-md px-3 text-sm font-medium transition-colors",
            days === d ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {d}d
        </button>
      ))}
    </div>
  )

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Search Performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Live impressions, clicks, CTR and rankings from Google Search Console.
        </p>
      </div>
      {connected ? <div className="flex items-center gap-2">{periodToggle}</div> : null}
    </div>
  )

  if (statusQuery.isPending) {
    return (
      <div className="space-y-6" role="status" aria-busy="true">
        <span className="sr-only">Checking Search Console…</span>
        {header}
        <KpiRowSkeleton />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ChartCardSkeleton className="lg:col-span-2" />
          <ChartCardSkeleton height="h-40" />
        </div>
      </div>
    )
  }
  if (!connected) {
    return (
      <div className="space-y-6">
        {header}
        {error ? <Alert variant="destructive"><AlertDescription>{error.message}</AlertDescription></Alert> : null}
        <ConnectGsc configured={Boolean(status?.configured)} connecting={connect.isPending} onConnect={startConnect} />
      </div>
    )
  }
  if (!domain) {
    return <p className="py-4 text-sm text-muted-foreground">Add a domain to this workspace to see its Search Console data.</p>
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "keywords", label: "Keywords" },
  ]

  return (
    <div className="space-y-6">
      {header}

      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors",
              tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
            {tab === t.id ? (
              <motion.span layoutId="sp-tab-underline" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />
            ) : null}
          </button>
        ))}
      </div>

      {data ? (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{data.site_url}</span>
          {` · ${data.start_date} → ${data.end_date}`}
        </p>
      ) : null}

      {tab === "keywords" ? (
        <KeywordTable wid={workspaceId!} did={domain.id} days={days} />
      ) : perf.isPending ? (
        <div className="space-y-6" role="status" aria-busy="true">
          <span className="sr-only">Loading Search Console data…</span>
          <KpiRowSkeleton />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ChartCardSkeleton className="lg:col-span-2" />
            <ChartCardSkeleton height="h-40" />
          </div>
        </div>
      ) : error || !data ? (
        <Alert variant={error?.status === 404 ? "default" : "destructive"}>
          <AlertTriangle />
          <AlertTitle>{error?.status === 404 ? "No matching property" : "Couldn't load data"}</AlertTitle>
          <AlertDescription>{error?.message ?? "No data."}</AlertDescription>
        </Alert>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className={cn("space-y-6 transition-opacity", perf.isPlaceholderData && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi icon={Tag} label="Ranking keywords" value={data.keyword_count.toLocaleString()} />
            <Kpi icon={MousePointerClick} label="Clicks" value={Math.round(data.total_clicks).toLocaleString()} />
            <Kpi icon={Search} label="Impressions" value={Math.round(data.total_impressions).toLocaleString()} />
            <Kpi icon={BarChart3} label="Avg position" value={data.avg_position.toFixed(1)} />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="size-4 text-primary" /> Estimated traffic
                </CardTitle>
                <CardDescription>Daily clicks over the last {data.days} days.</CardDescription>
              </CardHeader>
              <CardContent>
                <TrafficTrendChart data={data.trend} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Rank distribution</CardTitle>
                <CardDescription>Where your keywords rank.</CardDescription>
              </CardHeader>
              <CardContent>
                <RankDistribution d={data.distribution} />
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  )
}
