"use client"

import { AiOverviewCard } from "@/components/dashboard/ai-overview-card"
import { contentOptimizationHref } from "@/components/keywords/keyword-actions-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ColumnHelp, HeaderWithHelp } from "@/components/ui/column-help"
import { SearchInput } from "@/components/ui/search-input"
import { kdBand } from "../_lib/opportunity-research-helpers"
import { aiOverviewApi } from "@/lib/api/ai-overview"
import { Pager } from "@/components/ui/pager"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useActionItems, useActionPlan, useTrackKeyword } from "@/hooks/api/use-action-plan"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { errorMessage } from "@/lib/api/client"
import { actionPlanApi, type ActionItem, type ActionType } from "@/lib/api/opportunity"
import { fetchAllPages } from "@/lib/api/pagination"
import { COLUMN_HELP } from "@/lib/column-help"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"
import {
  ArrowRight, Check, Download, ExternalLink, FileSearch, Loader2,
  PenLine, Plus, Sparkles, Swords, TrendingUp, Wand2,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import { InsightPanel } from "./insight-panel"

type View = "top" | "improve" | "gaps" | "targets"
/** List view -> the action type the /action-plan/items endpoint pages. */
const VIEW_TYPE: Record<Exclude<View, "top">, ActionType> = { improve: "improve", gaps: "gap", targets: "target" }

const TYPE_META: Record<ActionType, { label: string; icon: typeof TrendingUp; className: string }> = {
  improve: { label: "Improve", icon: TrendingUp, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  gap: { label: "Competitor gap", icon: Swords, className: "bg-primary/10 text-primary" },
  target: { label: "New target", icon: Sparkles, className: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
}
const PAGE_SIZE = 15
const num = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString())

function TypeBadge({ type }: { type: ActionType }) {
  const m = TYPE_META[type]
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium", m.className)}>
      <m.icon className="size-3" aria-hidden="true" />{m.label}
    </span>
  )
}

/** Difficulty as a colour-coded chip (green = easy, amber = medium, red = hard). */
function Kd({ kd }: { kd: number | null | undefined }) {
  if (kd == null) return <span className="text-muted-foreground">—</span>
  return (
    <span className={cn("inline-flex min-w-9 justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums", kdBand(kd))}>
      {kd}
    </span>
  )
}

/** One fixed-width metric column (label on top, value below) so every row lines
 *  up — even rows that have no value for a slot (e.g. "Your pos." on a new target). */
function Metric({ label, children, width = "w-20", highlight }: {
  label: string; children: React.ReactNode; width?: string; highlight?: boolean
}) {
  return (
    <div className={cn("flex flex-col items-end gap-0.5 text-right", width)}>
      <dt className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{label}</dt>
      <dd className={cn("text-sm font-semibold tabular-nums", highlight && "text-primary")}>{children}</dd>
    </div>
  )
}

/** Current position as a short tone-coded badge. */
function PosPill({ pos }: { pos: number | null | undefined }) {
  if (pos == null) return <span className="text-muted-foreground">—</span>
  const tone = pos <= 3 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : pos <= 10 ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
      : pos <= 20 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
        : "bg-muted text-muted-foreground"
  return <span className={cn("inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums", tone)}>#{pos}</span>
}

/** The next-step buttons for one action (links out + Track). */
function Actions({ item, tracked, onTrack, busy, open, onDetails }: {
  item: ActionItem; tracked: boolean; onTrack: (k: string) => void; busy: boolean
  open: boolean; onDetails: () => void
}) {
  const link = item.type === "improve" ? item.url : item.type === "gap" ? item.competitor_url : null
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
      <Button size="xs" variant={open ? "default" : "outline"} onClick={onDetails}
        aria-expanded={open} title="Your page details + content suggestions">
        <FileSearch className="size-3.5" /> Details
      </Button>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer"
          className={buttonVariants({ variant: "outline", size: "xs" })}>
          {item.type === "improve" ? <PenLine className="size-3.5" /> : <ExternalLink className="size-3.5" />}
          {item.type === "improve" ? "Your page" : "Their page"}
        </a>
      )}
      {/* One-click next step: optimize the existing page (improve) or draft new
          content for a keyword you don't rank for yet (gap / target). */}
      <Link
        href={contentOptimizationHref(item.keyword, item.type === "improve" ? item.url : null)}
        className={buttonVariants({ variant: "outline", size: "xs" })}
        title={item.type === "improve" ? "Optimize this page's content" : "Draft content for this keyword"}
      >
        <Wand2 className="size-3.5" /> {item.type === "improve" ? "Optimize" : "Write content"}
      </Link>
      {tracked ? (
        <Link href="/dashboard/rankings"
          className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground hover:text-foreground"
          title="View in Rank Tracking">
          <Check className="size-3.5" /> Tracked
        </Link>
      ) : (
        <Button size="xs" variant="outline" disabled={busy} onClick={() => onTrack(item.keyword)}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Track
        </Button>
      )}
    </div>
  )
}

/**
 * Opportunity Research — the action plan: what to do next, prioritized, from
 * data already stored (Search Console, your rankings, competitor rankings,
 * keyword research). No paid API calls.
 */
export function ActionPlan({ wid, did }: { wid: string; did: string }) {
  const [view, setView] = React.useState<View>("top")
  const [q, setQ] = React.useState("")
  const debouncedQ = useDebouncedValue(q)
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)
  const [trackedNow, setTrackedNow] = React.useState<Set<string>>(new Set())
  // The one action whose Details panel is open (type:keyword).
  const [openKey, setOpenKey] = React.useState<string | null>(null)
  const toggle = (i: ActionItem) => setOpenKey((k) => (k === `${i.type}:${i.keyword}` ? null : `${i.type}:${i.keyword}`))
  const isOpen = (i: ActionItem) => openKey === `${i.type}:${i.keyword}`

  // A new search starts again at page 1 (adjusted during render).
  const [prevQ, setPrevQ] = React.useState(debouncedQ)
  if (debouncedQ !== prevQ) { setPrevQ(debouncedQ); setPage(1) }

  // Data (TanStack Query): the plan (Top 10 + counts) and ONE page of the open list.
  const plan = useActionPlan(wid, did)
  const listType: ActionType | null = view === "top" ? null : VIEW_TYPE[view]
  const listParams = { page, pageSize: PAGE_SIZE, q: debouncedQ }
  const items = useActionItems(wid, did, listType, listParams)
  const trackMutation = useTrackKeyword(wid, did)
  const tracking = trackMutation.isPending ? trackMutation.variables : null

  function track(keyword: string) {
    trackMutation.mutate(keyword, {
      onSuccess: (r) => {
        setTrackedNow((s) => new Set(s).add(keyword.toLowerCase()))
        toast.success(r.created ? `“${keyword}” added to Rank Tracking` : `“${keyword}” is already tracked`, {
          action: { label: "View", onClick: () => { window.location.href = "/dashboard/rankings" } },
        })
      },
      onError: (err) => toast.error(errorMessage(err, "Could not track the keyword.")),
    })
  }

  const data = plan.data ?? null
  const isTracked = (i: ActionItem) => i.tracked || trackedNow.has(i.keyword.toLowerCase())

  if (plan.isPending) return <ActionPlanSkeleton />
  if (plan.isError || !data) {
    return <Alert variant="destructive"><AlertDescription>{errorMessage(plan.error, "Could not build the action plan.")}</AlertDescription></Alert>
  }

  const s = data.sources
  const pageRows = items.data?.rows ?? []
  const pick = (v: View) => { setView(v); setPage(1); setQ("") }

  /** One action row, shared by the Detailed "Top" list and the Simple effort
   *  lanes so both read identically. `rank` shows the numbered badge (Top list). */
  const renderRow = (i: ActionItem, rank?: number) => (
    <li key={`${i.type}:${i.keyword}`}
      className={cn("px-4 py-3.5 transition-colors", isOpen(i) ? "bg-primary/[0.04]" : "hover:bg-muted/40")}>
      {/* Below xl: flexible wrapping. At xl: a fixed grid so every column
          (metrics + actions) lines up across all rows, regardless of which
          buttons a row shows or whether a value is missing. */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-3 xl:grid xl:items-center xl:gap-x-4"
        style={{
          gridTemplateColumns: rank != null
            ? "2rem minmax(200px,1fr) 5rem 4rem 4rem 6rem 23.5rem"
            : "minmax(200px,1fr) 5rem 4rem 4rem 6rem 23.5rem",
        }}
      >
        {rank != null && (
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
            rank <= 3 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{rank}</span>
        )}
        <div className="min-w-[220px] flex-1 space-y-1 xl:min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={i.type} />
            <span className="ds-item">{i.keyword}</span>
          </div>
          <p className="ds-meta">{i.reason}</p>
        </div>
        {/* flex group on small screens; each metric becomes its own grid column at xl. */}
        <dl className="flex shrink-0 items-start gap-5 xl:contents">
          <Metric label="Volume" width="w-20">{num(i.volume)}</Metric>
          <Metric label="Difficulty" width="w-16"><Kd kd={i.difficulty} /></Metric>
          <Metric label="Your pos." width="w-16">
            {i.type === "improve" ? <PosPill pos={i.position} /> : <span className="text-muted-foreground/30">—</span>}
          </Metric>
          <Metric label="Potential" width="w-24" highlight>
            +{num(i.gain)}<span className="text-[11px] font-normal text-muted-foreground">/mo</span>
          </Metric>
        </dl>
        <div className="flex shrink-0 justify-end sm:w-[376px] xl:w-full">
          <Actions item={i} tracked={isTracked(i)} onTrack={track} busy={tracking === i.keyword}
            open={isOpen(i)} onDetails={() => toggle(i)} />
        </div>
      </div>
      {isOpen(i) && (
        <div className="mt-3 border-t border-border pt-3">
          <InsightPanel wid={wid} did={did} item={i} />
        </div>
      )}
    </li>
  )

  const key = `${wid}:${did}`

  /** Top 10, or every row of the open list (fetched in big pages), as CSV. */
  async function exportCsv() {
    setExporting(true)
    try {
      const rows = view === "top" ? data!.top : await fetchAllPages((p, size) =>
        actionPlanApi.items(wid, did, VIEW_TYPE[view as Exclude<View, "top">], { q: debouncedQ, page: p, pageSize: size }))
      downloadCsv(`action-plan-${view}`,
        ["Type", "Keyword", "Volume", "Difficulty", "Your position", "Your page", "Competitor", "Competitor position",
          "Competitor page", "Potential visits/mo", "Next step", "Why"],
        rows.map((i) => [i.type, i.keyword, i.volume ?? "", i.difficulty ?? "", i.position ?? "", i.url ?? "",
          i.competitor ?? "", i.competitor_position ?? "", i.competitor_url ?? "", i.gain, i.action ?? "", i.reason ?? ""]))
    } catch (err) {
      toast.error(errorMessage(err, "Could not export."))
    } finally { setExporting(false) }
  }

  const summary: { v: View; label: string; count: number; hint: string; type: ActionType; help: string }[] = [
    { v: "improve", label: "Improve rankings", count: data.counts.improve, hint: `keywords you rank #4–50 for`, type: "improve",
      help: "Keywords you already rank for on positions #4–50. A few on-page tweaks — title, intro, internal links — can push these toward the top 3. These are usually your fastest wins." },
    { v: "gaps", label: "Competitor gaps", count: data.counts.gaps, hint: "keywords competitors win, you don't", type: "gap",
      help: "Keywords a competitor ranks in Google's top 10 for, while you don't rank at all. Create or strengthen a page to compete for this traffic." },
    { v: "targets", label: "New targets", count: data.counts.targets, hint: "easy research ideas not tracked yet", type: "target",
      help: "Low-difficulty keyword ideas with real search demand that you aren't tracking yet — good new topics to build pages for." },
  ]

  return (
    <div className="space-y-5">
      {/* Only when there's a plan to summarise — the empty state below already explains what to do. */}
      {data.top.length > 0 && (() => {
        // "Take action" → open Content Optimization pointed at the top page to improve
        // (or, failing that, the top keyword to target), so the user can change its content.
        const improve = data.top.find((i) => i.type === "improve" && i.url)
        const target = improve ?? data.top[0]
        const action = target
          ? {
              label: improve ? "Improve this page" : "Optimize for this keyword",
              href: contentOptimizationHref(target.keyword, improve ? improve.url : null),
            }
          : null
        return (
          <AiOverviewCard requestKey={`plan:${key}`} action={action}
            load={(refresh) => aiOverviewApi.actionPlan(wid, did, refresh)} />
        )
      })()}

      {/* Summary — each tile explains its number via the “?” and (except the total) filters the list. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="h-full">
          <CardContent className="flex h-full flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                <TrendingUp className="size-3.5" aria-hidden="true" />Actions to do
              </span>
              <ColumnHelp label="Actions to do"
                text="The total of Improve + Competitor gaps + New targets — every prioritised keyword action we found. Work the list from the top down." />
            </div>
            <p className="ds-kpi">{num(data.counts.improve + data.counts.gaps + data.counts.targets)}</p>
            <p className="ds-meta mt-auto">prioritised keyword actions — work the list top to bottom</p>
          </CardContent>
        </Card>
        {summary.map((x) => {
          const m = TYPE_META[x.type]
          const active = view === x.v
          return (
            <div
              key={x.v}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onClick={() => pick(x.v)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(x.v) } }}
              className="group cursor-pointer rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Card className={cn("h-full transition-all group-hover:border-primary/40 group-hover:shadow-sm",
                active && "border-primary/60 ring-1 ring-primary/30")}>
                <CardContent className="flex h-full flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium", m.className)}>
                      <m.icon className="size-3.5" aria-hidden="true" />{m.label}
                    </span>
                    {/* stop the “?” click from also switching the view */}
                    <span onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
                      <ColumnHelp label={x.label} text={x.help} />
                    </span>
                  </div>
                  <p className="ds-kpi">{num(x.count)}</p>
                  <p className="ds-meta mt-auto">{x.hint}{active ? " · showing" : ""}</p>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Built from {num(s.search_console_keywords)} keywords your site ranks for and stored rankings for{" "}
        {s.competitors_with_rankings.length} of {s.competitors.length} competitors
        {s.competitors_with_rankings.length ? ` (${s.competitors_with_rankings.join(", ")})` : ""}.
        {s.competitors_with_rankings.length < s.competitors.length && (
          <> More competitor data → more gaps: <Link href="/dashboard/competitive-strategy" className="text-primary hover:underline">Competitive Strategy</Link>.</>
        )}
      </p>

      <Card>
        <CardContent className="space-y-4 pt-6">
          {/* Which list to show + export */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1 rounded-lg border border-border p-0.5 text-xs">
              {([["top", "Top 10"], ["improve", `Improve (${data.counts.improve})`],
                ["gaps", `Competitor gaps (${data.counts.gaps})`], ["targets", `New targets (${data.counts.targets})`]] as const)
                .map(([v, label]) => (
                  <button key={v} type="button" onClick={() => pick(v)}
                    className={cn("rounded-md px-2.5 py-1.5 font-medium transition-colors",
                      view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                    {label}
                  </button>
                ))}
            </div>
            <div className="flex items-center gap-2">
              {view !== "top" && <SearchInput value={q} onValueChange={setQ} placeholder="Filter keywords…" className="w-52" />}
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export
              </Button>
            </div>
          </div>

          {data.top.length === 0 ? (
            <div className="mx-auto max-w-md py-10 text-center">
              <p className="text-sm font-semibold">No actions yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The plan builds from your rankings, competitors and your site&apos;s search data. Do these, then come back:
              </p>
              <div className="mx-auto mt-4 flex max-w-xs flex-col gap-2 text-left">
                {[
                  { href: "/dashboard/competitive-strategy", label: "Pull your keyword rankings" },
                  { href: "/dashboard/competitors", label: "Add competitors (for gaps)" },
                  { href: "/dashboard/settings", label: "Connect your search data" },
                  { href: "/dashboard/keyword-analysis", label: "Research keywords" },
                ].map((a) => (
                  <Link key={a.href} href={a.href}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "justify-between")}>
                    {a.label} <ArrowRight className="size-4" />
                  </Link>
                ))}
              </div>
            </div>
          ) : view === "top" ? (
            <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border">
              {data.top.map((i, n) => renderRow(i, n + 1))}
            </ol>
          ) : items.isError ? (
            <p className="py-10 text-center text-sm text-destructive">{errorMessage(items.error, "Could not load this list.")}</p>
          ) : !items.data ? (
            <div className="rounded-lg border border-border"><TableSkeleton rows={8} columns={6} label="Loading actions…" /></div>
          ) : items.data.pagination.total === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Nothing here{q ? " for this filter" : " yet"}.</p>
          ) : (
            <>
              <div className={cn("overflow-x-auto rounded-lg border border-border transition-opacity", items.isPlaceholderData && "opacity-60")}>
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="px-4 py-2 font-medium"><HeaderWithHelp help={COLUMN_HELP.keyword}>Keyword</HeaderWithHelp></th>
                      <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.volume}>Volume</HeaderWithHelp></th>
                      <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.seoDifficulty}>Difficulty</HeaderWithHelp></th>
                      {view === "improve" && <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.yourPosition}>Your pos.</HeaderWithHelp></th>}
                      {view === "gaps" && <th className="px-3 py-2 font-medium"><HeaderWithHelp help={COLUMN_HELP.bestCompetitor}>Best competitor</HeaderWithHelp></th>}
                      <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.potentialGain}>Potential</HeaderWithHelp></th>
                      <th className="px-3 py-2 font-medium"><HeaderWithHelp help={COLUMN_HELP.whyAction}>Why</HeaderWithHelp></th>
                      <th className="px-4 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.nextStep}>Next step</HeaderWithHelp></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {pageRows.map((i) => (
                      <React.Fragment key={i.keyword}>
                      <tr className={cn("transition-colors hover:bg-muted/40", isOpen(i) && "bg-primary/[0.04]")}>
                        <td className="max-w-[260px] px-4 py-2.5 font-medium"><span className="block truncate" title={i.keyword}>{i.keyword}</span></td>
                        <td className="px-3 py-2.5 text-right tabular-nums">{num(i.volume)}</td>
                        <td className="px-3 py-2.5"><div className="flex justify-end"><Kd kd={i.difficulty} /></div></td>
                        {view === "improve" && <td className="px-3 py-2.5"><div className="flex justify-end"><PosPill pos={i.position} /></div></td>}
                        {view === "gaps" && (
                          <td className="px-3 py-2.5 text-xs">
                            <span className="font-medium">{i.competitor}</span> <PosPill pos={i.competitor_position} />
                            {i.competitors_count && i.competitors_count > 1 ? <span className="text-muted-foreground"> +{i.competitors_count - 1} more</span> : null}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-primary">+{num(i.gain)}<span className="text-[11px] font-normal text-muted-foreground">/mo</span></td>
                        <td className="max-w-[320px] px-3 py-2.5 text-xs text-muted-foreground">{i.reason}</td>
                        <td className="px-4 py-2.5"><Actions item={i} tracked={isTracked(i)} onTrack={track} busy={tracking === i.keyword}
                          open={isOpen(i)} onDetails={() => toggle(i)} /></td>
                      </tr>
                      {isOpen(i) && (
                        <tr><td colSpan={8} className="bg-muted/20 px-4"><InsightPanel wid={wid} did={did} item={i} /></td></tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pager noun="actions" pagination={items.data.pagination} fetching={items.isFetching} onPageChange={setPage} />
              <p className="text-xs text-muted-foreground">Potential = estimated extra visits per month at #{data.target_position}.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


/** First-load placeholder with the plan's shape: summary tiles, tabs, list rows. */
function ActionPlanSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-busy="true">
      <span className="sr-only">Building your action plan…</span>
      <Skeleton className="h-24 w-full rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="h-full"><CardContent className="space-y-2">
            <Skeleton className="h-5 w-28" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-40" />
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="space-y-4">
        <div className="flex gap-2">{[96, 88, 120, 96].map((w, i) => <Skeleton key={i} className="h-8" style={{ width: w }} />)}</div>
        <TableSkeleton rows={6} columns={4} />
      </CardContent></Card>
    </div>
  )
}

