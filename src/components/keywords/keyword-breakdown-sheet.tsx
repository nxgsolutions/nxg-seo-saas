"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { HeaderWithHelp } from "@/components/ui/column-help"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ApiError, NetworkError } from "@/lib/api/client"
import { useAddCompetitor, useCompetitorHosts, useKeywordBreakdown, usePlannerHistory } from "@/hooks/api/use-keyword-breakdown"
import { queryKeys } from "@/lib/query/keys"
import { useQueryClient } from "@tanstack/react-query"
import type { MonthlyVolume, PlannerRow } from "@/lib/api/keyword-planner"
import { serpApi, type KeywordBreakdown } from "@/lib/api/serp"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"
import {
  BarChart3, Check, ChevronLeft, ChevronRight, Copy, Download, ExternalLink, Info, Loader2, Plus, RefreshCw, Search, Swords, UserPlus, X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { toast } from "sonner"

export type BreakdownTab = "metrics" | "results"

const PAGE = 10
const MONTHS = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"]

/** Country code chip (flag emoji don't render on Windows). */
function Country({ code }: { code: string }) {
  return <span className="rounded border border-border bg-muted px-1 py-px text-xs font-semibold uppercase tracking-wide text-muted-foreground">{code}</span>
}

const HELP = {
  seoDifficulty: "Estimated difficulty to rank in Google's top 10, 0–100. Lower is easier.",
  intent: "Why people search it: informational (learn), commercial (compare), transactional (buy / sign up), navigational (a specific site).",
  cpc: "Cost per click: what advertisers pay per click. Higher = more commercial value.",
  paidDifficulty: "Advertising competition, 0–100: how many advertisers bid on this keyword.",
  volume: "Average Google searches per month, with the monthly trend.",
  result: "The pages ranking on Google for this keyword, from the latest saved results.",
  visits: "Estimated monthly visits this page gets from this keyword. A ≈ value is our estimate from search volume and rank.",
  authority: "Domain authority, 0–100, based on the site's backlinks. Higher = stronger site.",
  backlinks: "Total links pointing to the whole site.",
  refDomains: "Number of different websites linking to the domain.",
}

/** Level tag. `neutral`: demand levels aren't good/bad, so no traffic-light colours. */
function level(v: number | null | undefined, cuts: [number, number], labels: [string, string, string], neutral = false) {
  if (v == null) return null
  const i = v < cuts[0] ? 0 : v < cuts[1] ? 1 : 2
  const tone = neutral ? "bg-primary/10 text-primary" : ["bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", "bg-amber-500/10 text-amber-700 dark:text-amber-400", "bg-red-500/10 text-red-700 dark:text-red-400"][i]
  return <span className={cn("rounded-md px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide", tone)}>{labels[i]}</span>
}

const fmt = (v: number | null | undefined) => (v == null ? "—" : v.toLocaleString())
const compact = (v: number | null | undefined) =>
  v == null ? "—" : new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(v)

function errorText(err: unknown, fallback: string) {
  return err instanceof ApiError || err instanceof NetworkError ? err.message : fallback
}

/**
 * Keyword Breakdown (Ubersuggest-style side panel): Metrics (difficulty, intent,
 * CPC, paid difficulty, monthly volume trend) and Search Results (the stored
 * Google SERP with each domain's authority, backlinks and estimated visits).
 * Opening it reads stored data only; "Update" is the one paid action.
 */
export function KeywordBreakdownSheet({
  keyword, open, onOpenChange, workspaceId, domainId, country = "in", language = "en", tab: initialTab = "results", options,
}: {
  keyword: string
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string | null | undefined
  /** Your domain — needed to add a result's domain to your competitor list. */
  domainId?: string | null
  country?: string
  language?: string
  tab?: BreakdownTab
  /** The keyword's "+ Options" menu, rendered in the header. */
  options?: React.ReactNode
}) {
  const [tab, setTab] = React.useState<BreakdownTab>(initialTab)
  const qc = useQueryClient()
  // Stored SERP + metrics, monthly trend and your competitor list — all free reads (hooks/api).
  const breakdown = useKeywordBreakdown(workspaceId ?? null, keyword, country, language, open)
  const plannerQuery = usePlannerHistory(keyword, country, language, open)
  const competitorHosts = useCompetitorHosts(workspaceId ?? null, domainId ?? null, open)
  const addCompetitorMutation = useAddCompetitor(workspaceId ?? null, domainId ?? null)

  const data = breakdown.data ?? null
  const error = breakdown.isError ? errorText(breakdown.error, "Could not load the keyword breakdown.") : null
  const planner: { row?: PlannerRow; note?: string } | null = plannerQuery.data
    ?? (plannerQuery.isError ? { note: errorText(plannerQuery.error, "Monthly history is unavailable.") } : null)
  // null = list unavailable (no website / still loading) → "Add" stays disabled.
  const competitors = competitorHosts.data ?? null

  function addCompetitor(host: string) {
    addCompetitorMutation.mutate(host, {
      onSuccess: (c) => toast.success(`Added ${c.competitor} to your competitors`),
      onError: (err) => toast.error(errorText(err, "Could not add the competitor.")),
    })
  }

  // After a paid SERP refresh: reload the stored breakdown and its AI summary.
  function onSerpUpdated() {
    if (!workspaceId) return
    void qc.invalidateQueries({ queryKey: queryKeys.keywordBreakdown(workspaceId, keyword, country, language) })
    void qc.invalidateQueries({ queryKey: queryKeys.aiOverviewAll(workspaceId) })
  }

  const loading = open && breakdown.isPending

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup
          className="dashboard-shell fixed inset-y-0 right-0 z-50 flex w-full max-w-[min(56rem,100vw)] flex-col border-l border-border bg-card shadow-2xl outline-none transition-transform duration-200 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
            <div className="min-w-0 space-y-2">
              <Dialog.Title className="font-heading text-xl font-bold tracking-tight">Keyword Breakdown</Dialog.Title>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {options}
                <span className="flex min-w-0 items-center gap-1.5 text-base font-semibold text-primary">
                  <Country code={country} />
                  <span className="truncate">{keyword}</span>
                </span>
              </div>
            </div>
            <Dialog.Close render={<Button variant="ghost" size="icon" />} aria-label="Close keyword breakdown"><X /></Dialog.Close>
          </div>

          {/* Tabs */}
          <div className="px-4 pt-4 sm:px-6">
            <SegmentedTabs fill label="Keyword breakdown" value={tab} onChange={setTab} items={[
              { value: "metrics", label: "Metrics", icon: BarChart3 },
              { value: "results", label: "Search Results", icon: Search },
            ]} />
          </div>

          {/* scroll-pane: scrolls with wheel / touch / keyboard, scrollbar hidden. */}
          <div className="scroll-pane min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6" aria-busy={loading}>
            {error ? (
              <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
            ) : loading || !data ? (
              <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</p>
            ) : tab === "metrics" ? (
              <MetricsTab data={data} planner={planner} />
            ) : (
              <ResultsTab data={data} workspaceId={workspaceId} onUpdated={onSerpUpdated}
                competitors={domainId ? competitors : null} onAddCompetitor={addCompetitor} />
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Metrics ─────────────────────────────────────────────────────────────────

function Tile({ label, help, children }: { label: string; help: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center">
      <HeaderWithHelp help={help}><span className="text-sm font-medium">{label}</span></HeaderWithHelp>
      {children}
    </div>
  )
}

function MetricsTab({ data, planner }: {
  data: KeywordBreakdown; planner: { row?: PlannerRow; note?: string } | null
}) {
  const m = data.metrics
  const p = planner?.row
  // Stored metrics first; the live Keyword Planner row fills gaps.
  const volume = m.search_volume ?? p?.avg_monthly_searches ?? null
  const difficulty = m.difficulty ?? p?.seo_difficulty ?? null
  const cpc = m.cpc ?? p?.cpc_high ?? null
  const paid = m.competition ?? p?.competition_index ?? null
  const intent = m.intent ?? p?.intent ?? null
  const monthly: MonthlyVolume[] = React.useMemo(() => [...(p?.monthly ?? [])].sort((a, b) =>
    (a.year ?? 0) - (b.year ?? 0) || MONTHS.indexOf((a.month ?? "").toUpperCase()) - MONTHS.indexOf((b.month ?? "").toUpperCase())), [p])
  const chart = monthly.map((x) => ({ label: `${(x.month ?? "").slice(0, 3).replace(/^\w/, (c) => c.toUpperCase()).replace(/\B\w+/, (w) => w.toLowerCase())} ${String(x.year ?? "").slice(2)}`, searches: x.searches }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="SEO Difficulty" help={HELP.seoDifficulty}>
          <span className="ds-kpi">{difficulty != null ? Math.round(difficulty) : "—"}</span>
          {level(difficulty, [30, 60], ["Easy", "Medium", "Hard"])}
        </Tile>
        <Tile label="Search Intent" help={HELP.intent}>
          <span className="text-lg font-semibold capitalize">{intent && intent !== "unknown" ? intent : "—"}</span>
          {!intent || intent === "unknown" ? <span className="ds-meta">Not classified yet</span> : null}
        </Tile>
        <Tile label="Cost Per Click" help={HELP.cpc}>
          <span className="ds-kpi">{cpc != null ? cpc.toFixed(2) : "—"}</span>
          {cpc != null && p?.cpc_low != null && m.cpc == null ? <span className="ds-meta">range {p.cpc_low.toFixed(2)}–{cpc.toFixed(2)}</span> : null}
        </Tile>
        <Tile label="Paid Difficulty" help={HELP.paidDifficulty}>
          <span className="ds-kpi">{paid != null ? Math.round(paid) : "—"}</span>
          {level(paid, [34, 67], ["Low", "Medium", "High"])}
        </Tile>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <HeaderWithHelp help={HELP.volume}><span className="text-sm font-medium">Search Volume</span></HeaderWithHelp>
            <div className="mt-1 flex items-center gap-2">
              <span className="ds-kpi">{fmt(volume)}</span>
              {level(volume, [1000, 10000], ["Low", "Average", "High"], true)}
            </div>
          </div>
          <span className="ds-meta flex items-center gap-1.5"><Country code={data.country} /> per month</span>
        </div>
        <div className="mt-3">
          {planner == null ? (
            <p className="flex items-center gap-2 py-10 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading monthly trend…</p>
          ) : chart.length ? (
            <div className="h-56" role="img" aria-label={`Monthly Google searches for ${data.keyword}`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="breakdownVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--viz-accent)" stopOpacity={0.28} />
                      <stop offset="100%" stopColor="var(--viz-accent)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis width={44} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false}
                    tickFormatter={(v: number) => compact(v)} />
                  <Tooltip formatter={(v) => [Number(v).toLocaleString(), "Searches"]}
                    contentStyle={{ background: "var(--popover)", color: "var(--popover-foreground)", borderColor: "var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Area dataKey="searches" stroke="var(--viz-accent)" strokeWidth={2} fill="url(#breakdownVolume)"
                    activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">{planner.note ?? "No monthly history returned for this keyword."}</p>
          )}
        </div>
      </div>

      <p className="ds-meta">
        {m.metric_date ? `Updated ${new Date(m.metric_date).toLocaleDateString()}. ` : ""}Difficulty and intent are estimates.
      </p>
    </div>
  )
}

// ── Search results ──────────────────────────────────────────────────────────

function DomainMenu({ host, url, isYou, competitor, onAddCompetitor }: {
  host: string; url: string; isYou: boolean
  /** true = already in your list; false = can add; null = list unavailable (no domain / still loading). */
  competitor: boolean | null
  onAddCompetitor: (host: string) => void
}) {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`Actions for ${host}`}
        className={cn(buttonVariants({ variant: "outline", size: "icon-xs" }),
          "bg-card text-muted-foreground shadow-xs hover:border-primary/40 hover:bg-accent hover:text-primary data-[popup-open]:border-primary/40 data-[popup-open]:bg-accent data-[popup-open]:text-primary")}>
        <Plus className="size-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuItem onClick={() => window.open(url, "_blank", "noopener,noreferrer")}><ExternalLink /> Open ranking page</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(url).then(() => toast.success("URL copied"), () => toast.error("Could not copy."))}>
          <Copy /> Copy URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {!isYou && (
          competitor ? (
            <DropdownMenuItem disabled><Check /> In your competitors</DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={competitor == null} onClick={() => onAddCompetitor(host)}>
              <UserPlus /> Add to my competitors
            </DropdownMenuItem>
          )
        )}
        <DropdownMenuItem onClick={() => router.push(`/dashboard/competitive-strategy?competitor=${encodeURIComponent(host)}`)}>
          <Swords /> Analyze {host}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ResultsTab({ data, workspaceId, onUpdated, competitors, onAddCompetitor }: {
  data: KeywordBreakdown; workspaceId: string | null | undefined; onUpdated: () => void
  competitors: Set<string> | null; onAddCompetitor: (host: string) => void
}) {
  const [page, setPage] = React.useState(0)
  const [confirming, setConfirming] = React.useState(false)
  const [updating, setUpdating] = React.useState(false)

  // Your own ranking row(s) float to the top so you see your rank without
  // paging past the results above you; the # column still shows real positions.
  const ordered = React.useMemo(
    () => [...data.rows.filter((r) => r.is_you), ...data.rows.filter((r) => !r.is_you)],
    [data.rows],
  )
  const pages = Math.max(1, Math.ceil(ordered.length / PAGE))
  const rows = ordered.slice(page * PAGE, page * PAGE + PAGE)
  const sandbox = data.environment === "sandbox"
  const s = data.summary

  async function update() {
    if (!workspaceId) return
    // Confirm guards re-spending on a SERP we already stored. The first-time
    // "Fetch results" (nothing captured yet) loads in one click.
    const needsConfirm = !sandbox && data.captured_at != null
    if (needsConfirm && !confirming) { setConfirming(true); return }
    setConfirming(false); setUpdating(true)
    try {
      await serpApi.analyze(workspaceId, data.keyword, { country: data.country, language: data.language, depth: 100, refresh: true })
      toast.success("Search results updated")
      setPage(0); onUpdated()
    } catch (err) {
      toast.error(errorText(err, "Could not update the search results."))
    } finally { setUpdating(false) }
  }

  // Update (paid SERP re-fetch): a compact refresh icon; clicking a stored SERP
  // expands it to a labelled confirm so re-spending is never a single stray tap.
  const updateButton = confirming ? (
    <div className="flex items-center gap-2">
      <span className="ds-meta hidden sm:inline">Loads the latest Google results.</span>
      <Button size="sm" variant="default" onClick={update} disabled={updating}>
        {updating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
        Confirm update
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
    </div>
  ) : (
    <Button size="icon-sm" variant="outline" onClick={update} disabled={updating || !workspaceId}
      title="Update search results" aria-label="Update search results">
      {updating ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
    </Button>
  )

  if (!data.captured_at) {
    return (
      <div className="flex min-h-[340px] flex-col items-center justify-center gap-5 px-6 py-12 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 ring-8 ring-primary/5">
          <Search className="size-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-heading text-xl font-bold tracking-tight">No results yet</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Load Google&apos;s results for <span className="font-medium text-foreground">“{data.keyword}”</span>.
          </p>
        </div>
        <Button size="lg" onClick={update} disabled={updating || !workspaceId} className="min-w-[200px] shadow-sm">
          {updating ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {updating ? "Loading…" : "Load results"}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="font-heading text-lg font-bold">Search Results</h3>
          {s.your_position != null
            ? <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">You rank #{s.your_position}</span>
            : <span className="ds-meta">You&apos;re not in these results</span>}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {updateButton}
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-accent px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-primary" />
        {s.top10_with_metrics > 0 ? (
          <p>
            Top sites here average <strong>{compact(s.avg_backlinks)} backlinks</strong> and{" "}
            <strong>{s.avg_authority} authority</strong>
            <span className="text-muted-foreground"> (based on {s.top10_with_metrics} of the top 10).</span>
          </p>
        ) : (
          <p className="text-muted-foreground">Authority and backlinks show for sites we track. A ≈ visit count is an estimate.</p>
        )}
      </div>

      {/* Horizontal-only scroller. Not .scroll-pane: its overscroll containment trapped the
          mouse wheel here, so the sheet didn't scroll while the cursor was over the table. */}
      <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-border">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium"><HeaderWithHelp help={HELP.result}>Google search result</HeaderWithHelp></th>
              <th className="px-3 py-2.5 text-right font-medium"><HeaderWithHelp help={HELP.visits}>Est. visits</HeaderWithHelp></th>
              <th className="px-3 py-2.5 text-right font-medium"><HeaderWithHelp help={HELP.authority}>Authority</HeaderWithHelp></th>
              <th className="px-3 py-2.5 text-right font-medium"><HeaderWithHelp help={HELP.backlinks}>Backlinks</HeaderWithHelp></th>
              <th className="px-3 py-2.5 text-right font-medium"><HeaderWithHelp help={HELP.refDomains}>Ref. domains</HeaderWithHelp></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((r, i) => (
              <tr key={`${r.position}:${i}`} className={cn("align-top hover:bg-muted/40", r.is_you && "bg-primary/5")}>
                <td className="px-3 py-2.5 font-semibold tabular-nums text-muted-foreground">{r.position}</td>
                <td className="max-w-[380px] px-3 py-2.5">
                  <div className="flex min-w-0 items-start gap-2">
                    <DomainMenu host={r.host} url={r.url} isYou={r.is_you}
                      competitor={competitors ? competitors.has(r.host) : null} onAddCompetitor={onAddCompetitor} />
                    <div className="min-w-0">
                      <a href={r.url} target="_blank" rel="noopener noreferrer" title={r.url} className="group block min-w-0">
                        <span className="flex items-center gap-1.5 font-medium text-primary group-hover:underline">
                          <span className="truncate">{r.host}</span>
                          {r.is_you && <span className="rounded bg-primary px-1 text-xs font-semibold text-primary-foreground">you</span>}
                          {!r.is_you && competitors?.has(r.host) && (
                            // inline-block: keeps the link's hover underline off the chip.
                            <span className="inline-block shrink-0 rounded-full bg-violet-500/10 px-2 py-px text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-500/25 dark:text-violet-300">
                              Competitor
                            </span>
                          )}
                          {r.type && r.type !== "organic" && <span className="rounded bg-muted px-1 text-xs font-normal text-muted-foreground">{r.type.replace(/_/g, " ")}</span>}
                        </span>
                        {r.title && <span className="block truncate text-xs text-foreground/80">{r.title}</span>}
                        <span className="block truncate text-xs text-muted-foreground">{r.url}</span>
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums"
                  title={r.visits_source === "estimate" ? "Estimated from search volume and rank" : r.visits_source === "dataforseo" ? "Estimated from this site's rankings" : undefined}>
                  {r.visits == null ? "—" : `${r.visits_source === "estimate" ? "≈" : ""}${compact(r.visits)}`}
                </td>
                <td className="px-3 py-2.5 text-right font-medium tabular-nums">{r.authority ?? "—"}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{compact(r.backlinks)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{compact(r.referring_domains)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {pages > 1 && (
            <div className="flex items-center gap-1">
              <Button size="icon-sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft /></Button>
              {Array.from({ length: pages }, (_, n) => (
                <Button key={n} size="icon-sm" variant={n === page ? "default" : "ghost"} onClick={() => setPage(n)} aria-current={n === page ? "page" : undefined}>{n + 1}</Button>
              ))}
              <Button size="icon-sm" variant="outline" disabled={page >= pages - 1} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight /></Button>
            </div>
          )}
          <Button size="sm" variant="outline" onClick={() => downloadCsv(`serp-${data.keyword.replace(/\s+/g, "-")}`,
            ["Position", "Domain", "Title", "URL", "Est. visits", "Visits source", "Authority", "Backlinks", "Referring domains"],
            data.rows.map((r) => [r.position, r.host, r.title ?? "", r.url, r.visits ?? "", r.visits_source ?? "", r.authority ?? "", r.backlinks ?? "", r.referring_domains ?? ""]))}>
            <Download className="size-3.5" /> Export all
          </Button>
        </div>
        <span className="ds-meta">Search results last updated: {new Date(data.captured_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</span>
      </div>
    </div>
  )
}
