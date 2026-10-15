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
  ArrowRight, CalendarClock, Check, ChevronRight, Download, ExternalLink, FileSearch, LayoutList, Loader2, Mountain,
  PenLine, Plus, Sparkles, Swords, Table2, Target, TrendingUp, Wand2, X, Zap,
} from "lucide-react"
import { Dialog } from "@base-ui/react/dialog"
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

/** Effort lanes for the Simple view — how hard each action is, in plain terms. */
type Effort = "quick" | "month" | "bet"
const effortOf = (i: ActionItem): Effort => {
  const kd = i.difficulty ?? 0
  if (i.type === "improve" || kd < 30) return "quick" // already ranking, or easy
  if (kd >= 55) return "bet"
  return "month"
}
const EFFORT_META: Record<Effort, { label: string; desc: string; icon: typeof Zap; className: string }> = {
  quick: { label: "Quick wins", desc: "Do this week — easy, fast ranking gains", icon: Zap,
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  month: { label: "This month", desc: "Medium effort — new or stronger pages", icon: CalendarClock,
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
  bet: { label: "Bigger bets", desc: "High effort — build authority first", icon: Mountain,
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
}
const EFFORT_ORDER: Effort[] = ["quick", "month", "bet"]

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
      <dt className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{label}</dt>
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
        <span className="inline-flex h-7 items-center gap-1 px-2 text-xs text-muted-foreground"><Check className="size-3.5" /> Tracked</span>
      ) : (
        <Button size="xs" variant="outline" disabled={busy} onClick={() => onTrack(item.keyword)}>
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Track
        </Button>
      )}
    </div>
  )
}

/** One labelled metric for the solution sheet (label above, value below). */
function SheetMetric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold tabular-nums">{children}</dd>
    </div>
  )
}

/**
 * Side sheet showing one keyword's full "solution": its metrics, why it matters,
 * the next-step actions, and the InsightPanel (your page vs the competitor pages
 * that rank, with content suggestions). Opened by clicking a card in Simple view.
 */
function KeywordSolutionSheet({ item, wid, did, tracked, busy, onTrack, onClose }: {
  item: ActionItem | null; wid: string; did: string; tracked: boolean; busy: boolean
  onTrack: (keyword: string) => void; onClose: () => void
}) {
  return (
    <Dialog.Root open={!!item} onOpenChange={(open) => { if (!open) onClose() }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className="dashboard-shell fixed inset-y-0 right-0 z-50 flex w-full max-w-[min(42rem,100vw)] flex-col border-l border-border bg-card shadow-2xl outline-none transition-transform duration-200 data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          {item && (() => {
            const pageLink = item.type === "improve" ? item.url : item.type === "gap" ? item.competitor_url : null
            const href = contentOptimizationHref(item.keyword, item.type === "improve" ? item.url : null)
            return (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                  <div className="min-w-0 space-y-2">
                    <Dialog.Title className="font-heading text-lg font-bold tracking-tight">Keyword solution</Dialog.Title>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <TypeBadge type={item.type} />
                      <span className="truncate text-base font-semibold text-primary">{item.keyword}</span>
                    </div>
                  </div>
                  <Dialog.Close render={<Button variant="ghost" size="icon" />} aria-label="Close solution"><X /></Dialog.Close>
                </div>

                <div className="scroll-pane min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SheetMetric label="Volume">{num(item.volume)}</SheetMetric>
                    <SheetMetric label="Difficulty"><Kd kd={item.difficulty} /></SheetMetric>
                    <SheetMetric label="Your position">
                      {item.type === "improve" ? <PosPill pos={item.position} /> : <span className="text-muted-foreground">—</span>}
                    </SheetMetric>
                    <SheetMetric label="Potential"><span className="text-primary">+{num(item.gain)}<span className="text-[11px] font-normal text-muted-foreground">/mo</span></span></SheetMetric>
                  </dl>

                  {item.reason && (
                    <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Why this matters: </span>{item.reason}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Link href={href} className={buttonVariants({ size: "sm" })}>
                      <Wand2 className="size-4" /> {item.type === "improve" ? "Optimize this page" : "Write content"}
                    </Link>
                    {pageLink && (
                      <a href={pageLink} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "sm" })}>
                        {item.type === "improve" ? <PenLine className="size-4" /> : <ExternalLink className="size-4" />}
                        {item.type === "improve" ? "Your page" : "Their page"}
                      </a>
                    )}
                    {tracked ? (
                      <span className="inline-flex h-8 items-center gap-1 px-2 text-xs text-muted-foreground"><Check className="size-4" /> Tracked</span>
                    ) : (
                      <Button size="sm" variant="outline" disabled={busy} onClick={() => onTrack(item.keyword)}>
                        {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Track
                      </Button>
                    )}
                  </div>

                  <InsightPanel wid={wid} did={did} item={item} />
                </div>
              </>
            )
          })()}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * Opportunity Research — the action plan: what to do next, prioritized, from
 * data already stored (Search Console, your rankings, competitor rankings,
 * keyword research). No paid API calls.
 */
export function ActionPlan({ wid, did }: { wid: string; did: string }) {
  const [mode, setMode] = React.useState<"simple" | "detailed">("simple")
  const [view, setView] = React.useState<View>("top")
  const [q, setQ] = React.useState("")
  const debouncedQ = useDebouncedValue(q)
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)
  const [trackedNow, setTrackedNow] = React.useState<Set<string>>(new Set())
  // The one action whose Details panel is open (type:keyword) — Detailed view.
  const [openKey, setOpenKey] = React.useState<string | null>(null)
  // The action whose solution sheet is open (Simple view: click a card).
  const [solutionItem, setSolutionItem] = React.useState<ActionItem | null>(null)
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
        toast.success(r.created ? `“${keyword}” added to tracked keywords` : `“${keyword}” is already tracked`)
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
  const pick = (v: View) => { setMode("detailed"); setView(v); setPage(1); setQ("") }

  /** One action row, shared by the Detailed "Top" list and the Simple effort
   *  lanes so both read identically. `rank` shows the numbered badge (Top list). */
  const renderRow = (i: ActionItem, rank?: number) => (
    <li key={`${i.type}:${i.keyword}`}
      className={cn("px-4 py-3.5 transition-colors", isOpen(i) ? "bg-primary/[0.04]" : "hover:bg-muted/40")}>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {rank != null && (
          <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
            rank <= 3 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{rank}</span>
        )}
        <div className="min-w-[220px] flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={i.type} />
            <span className="ds-item">{i.keyword}</span>
          </div>
          <p className="ds-meta">{i.reason}</p>
        </div>
        <dl className="flex shrink-0 items-start gap-5">
          <Metric label="Volume" width="w-20">{num(i.volume)}</Metric>
          <Metric label="Difficulty" width="w-16"><Kd kd={i.difficulty} /></Metric>
          <Metric label="Your pos." width="w-16">
            {i.type === "improve" ? <PosPill pos={i.position} /> : <span className="text-muted-foreground/30">—</span>}
          </Metric>
          <Metric label="Potential" width="w-24" highlight>
            +{num(i.gain)}<span className="text-[11px] font-normal text-muted-foreground">/mo</span>
          </Metric>
        </dl>
        <div className="flex shrink-0 justify-end sm:min-w-[320px]">
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

  /** A compact, clickable keyword card for the Simple view's effort lanes.
   *  Clicking opens the solution sheet for that keyword. */
  const renderCard = (i: ActionItem) => (
    <button key={`${i.type}:${i.keyword}`} type="button" onClick={() => setSolutionItem(i)}
      className="group flex h-full flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5 text-left transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50">
      <div className="flex items-center justify-between gap-2">
        <TypeBadge type={i.type} />
        {isTracked(i) ? <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Check className="size-3" /> Tracked</span> : null}
      </div>
      <p className="ds-item line-clamp-2" title={i.keyword}>{i.keyword}</p>
      <div className="mt-auto flex items-end justify-between gap-2 pt-1">
        <dl className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><span>Vol</span><span className="font-medium tabular-nums text-foreground">{num(i.volume)}</span></div>
          <Kd kd={i.difficulty} />
          {i.type === "improve" && <PosPill pos={i.position} />}
        </dl>
        <span className="text-sm font-semibold tabular-nums text-primary">+{num(i.gain)}<span className="text-[11px] font-normal text-muted-foreground">/mo</span></span>
      </div>
      <span className="flex items-center gap-1 text-xs font-medium text-primary">
        View solution <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
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
          {/* Simple / Detailed toggle + export */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 rounded-lg border border-border p-0.5 text-xs">
              {([["simple", "Simple", LayoutList], ["detailed", "Detailed", Table2]] as const).map(([m, label, Icon]) => (
                <button key={m} type="button"
                  onClick={() => { setMode(m); if (m === "simple") { setView("top"); setQ("") } }}
                  className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-medium transition-colors",
                    mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <Icon className="size-3.5" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {mode === "detailed" && view !== "top" && <SearchInput value={q} onValueChange={setQ} placeholder="Filter keywords…" className="w-52" />}
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export
              </Button>
            </div>
          </div>

          {/* Detailed-only: which list to show */}
          {mode === "detailed" && (
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
          )}

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
          ) : mode === "simple" ? (
            <div className="space-y-5">
              {/* Hero — the single highest-impact move, in plain language. */}
              {(() => {
                const hero = data.top[0]
                const href = contentOptimizationHref(hero.keyword, hero.type === "improve" ? hero.url : null)
                return (
                  <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
                      <Target className="size-4" aria-hidden="true" /> Your #1 move this week
                    </div>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-[240px] flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <TypeBadge type={hero.type} />
                          <span className="text-lg font-semibold">{hero.keyword}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{hero.reason}</p>
                        <dl className="flex flex-wrap gap-6 pt-1">
                          <Metric label="Volume" width="w-auto">{num(hero.volume)}</Metric>
                          <Metric label="Difficulty" width="w-auto"><Kd kd={hero.difficulty} /></Metric>
                          {hero.type === "improve" && <Metric label="Your pos." width="w-auto"><PosPill pos={hero.position} /></Metric>}
                          <Metric label="Potential" width="w-auto" highlight>
                            +{num(hero.gain)}<span className="text-[11px] font-normal text-muted-foreground">/mo</span>
                          </Metric>
                        </dl>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <Link href={href} className={buttonVariants({ size: "sm" })}>
                          <Wand2 className="size-4" /> {hero.type === "improve" ? "Optimize this page" : "Write content"}
                        </Link>
                        <Actions item={hero} tracked={isTracked(hero)} onTrack={track} busy={tracking === hero.keyword}
                          open={false} onDetails={() => setSolutionItem(hero)} />
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Effort lanes — quick wins first, bigger bets last. */}
              {EFFORT_ORDER.map((eff) => {
                const meta = EFFORT_META[eff]
                const laneItems = data.top.slice(1).filter((i) => effortOf(i) === eff)
                if (laneItems.length === 0) return null
                return (
                  <div key={eff} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("inline-flex size-7 items-center justify-center rounded-lg", meta.className)}>
                        <meta.icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold leading-tight">
                          {meta.label} <span className="font-normal text-muted-foreground">· {laneItems.length}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground">{meta.desc}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {laneItems.map((i) => renderCard(i))}
                    </div>
                  </div>
                )
              })}

              <p className="text-xs text-muted-foreground">
                Showing your top {data.top.length} priorities.{" "}
                <button type="button" onClick={() => pick("improve")} className="font-medium text-primary hover:underline">
                  See all {num(data.counts.improve + data.counts.gaps + data.counts.targets)} in Detailed view
                </button>.
              </p>
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

      {/* Click a card → the keyword's full solution in a side sheet. */}
      <KeywordSolutionSheet
        item={solutionItem} wid={wid} did={did}
        tracked={solutionItem ? isTracked(solutionItem) : false}
        busy={!!solutionItem && tracking === solutionItem.keyword}
        onTrack={track}
        onClose={() => setSolutionItem(null)}
      />
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

