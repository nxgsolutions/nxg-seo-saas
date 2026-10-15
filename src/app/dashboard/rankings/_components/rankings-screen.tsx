"use client"

import { RankTrendChart } from "@/components/charts/lazy"
import type { RankPoint } from "@/components/charts/rank-trend-chart"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { NoDomain } from "@/components/dashboard/current-domain"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAddTrackedKeyword, useImportGscKeywords, useRankEntries, useRemoveTrackedKeyword,
  useSyncGscPositions, useSyncSerpPositions, useTrackedKeywords,
} from "@/hooks/api/use-rankings"
import { ApiError, errorMessage } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import {
  Award, Download, KeyRound, LineChart, ListChecks, Loader2, Plus, RefreshCw, Target, Trash2, TrendingUp,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import * as React from "react"
import { toast } from "sonner"
import { fmtDate } from "../_lib/rankings-helpers"
import { PositionDelta } from "./position-delta"

/** Brief "what this page does" shown in the title help popover. */
const rankTrackingHelp = (
  <>
    <p><span className="font-medium text-foreground">Rank Tracking</span> follows a keyword&apos;s Google position over time for this website.</p>
    <p className="mt-2">Add the keywords you care about, then click <span className="font-medium text-foreground">Update positions</span> to fill them from your latest search data. Select a row to see its trend.</p>
  </>
)

/** Compact volume (1.2K, 34K, 1.1M). */
function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

/** Summary tiles above the tracker: how many keywords, how many ranking well. */
function RankSummary({ keywords }: { keywords: { latest_position: number | null; best_position: number | null }[] }) {
  const ranked = keywords.filter((k) => k.latest_position != null) as { latest_position: number }[]
  const inTop10 = ranked.filter((k) => k.latest_position <= 10).length
  const avg = ranked.length ? Math.round(ranked.reduce((sum, k) => sum + k.latest_position, 0) / ranked.length) : null
  const best = keywords.reduce<number | null>((min, k) => (k.best_position == null ? min : min == null ? k.best_position : Math.min(min, k.best_position)), null)
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard icon={ListChecks} label="Tracked keywords" value={`${keywords.length}`} hint="On this website" />
      <StatCard icon={Target} label="In top 10" value={`${inTop10}`} hint={ranked.length ? `of ${ranked.length} ranking` : "none ranking yet"} />
      <StatCard icon={TrendingUp} label="Avg position" value={avg == null ? "—" : `#${avg}`} hint="Of ranking keywords" />
      <StatCard icon={Award} label="Best position" value={best == null ? "—" : `#${best}`} hint="All-time best" />
    </div>
  )
}

export default function RankingsPage() {
  // The workspace + website picked in the top bar.
  const { activeWorkspace, activeDomain } = useDashboard()
  const wid = activeWorkspace?.id ?? null
  const siteId = activeDomain?.id ?? null

  // Data (TanStack Query): tracked keywords + the selected keyword's history.
  const keywordsQuery = useTrackedKeywords(wid, siteId)
  const keywords = keywordsQuery.data ?? []
  const kwLoading = keywordsQuery.isPending && Boolean(siteId)

  // The picked keyword; falls back to the first one (derived, no effect needed).
  const [chosenId, setSelectedId] = React.useState<string | null>(null)
  const selectedId = chosenId && keywords.some((k) => k.id === chosenId) ? chosenId : keywords[0]?.id ?? null
  const entriesQuery = useRankEntries(wid, siteId, selectedId)
  const entries = React.useMemo(() => entriesQuery.data ?? [], [entriesQuery.data])
  const entriesLoading = Boolean(selectedId) && entriesQuery.isPending
  const selected = keywords.find((k) => k.id === selectedId) ?? null

  const [newTerm, setNewTerm] = React.useState("")
  const [addError, setAddError] = React.useState<string | null>(null)
  // Chart window: last 4 / 12 weeks or all history.
  const [range, setRange] = React.useState<"4w" | "12w" | "all">("all")
  const [updating, setUpdating] = React.useState(false)

  const addMutation = useAddTrackedKeyword(wid, siteId)
  const removeMutation = useRemoveTrackedKeyword(wid, siteId)
  const gscMutation = useSyncGscPositions(wid, siteId)
  const serpMutation = useSyncSerpPositions(wid, siteId)
  const importMutation = useImportGscKeywords(wid, siteId)
  const adding = addMutation.isPending
  const importing = importMutation.isPending

  // Pull the domain's top Search Console queries in as tracked keywords, with
  // today's position already filled — the one-click path for an empty page.
  function importFromGsc() {
    if (!wid || !siteId) return
    importMutation.mutate(undefined, {
      onSuccess: (r) => {
        if (r.imported === 0 && r.total === 0) {
          toast.info("No keywords found in Search Console yet.", {
            description: "Once your site has search traffic, they'll appear here.",
          })
        } else if (r.imported === 0) {
          toast.info("Your Search Console keywords are already tracked.")
        } else {
          toast.success(`Added ${r.imported} keyword${r.imported === 1 ? "" : "s"} from Search Console.`, {
            description: r.synced ? `Positions filled for ${r.synced}.` : undefined,
          })
        }
      },
      onError: (err) => {
        const msg = err instanceof ApiError && err.status === 409
          ? "Connect Google Search Console first (Settings → Integrations)."
          : errorMessage(err, "Could not import from Search Console.")
        toast.error(msg)
      },
    })
  }

  // One action, two sources: record positions from the stored SERP snapshot AND
  // Search Console. Each is free; GSC is skipped quietly when not connected.
  async function updatePositions() {
    if (!wid || !siteId) return
    setUpdating(true)
    try {
      const [serpR, gscR] = await Promise.allSettled([
        serpMutation.mutateAsync(),
        gscMutation.mutateAsync(),
      ])
      const serp = serpR.status === "fulfilled" ? serpR.value : null
      const gsc = gscR.status === "fulfilled" ? gscR.value : null
      const total = serp?.total ?? gsc?.total ?? 0
      const hit = Math.max(serp?.synced ?? 0, gsc?.synced ?? 0)
      if (total === 0) {
        toast.info("No tracked keywords yet — add some, then update.")
      } else if (hit === 0) {
        toast.info("No positions found yet.", {
          description: "Pull rankings on Competitive Strategy, or connect your search data, then update again.",
        })
      } else {
        toast.success(`Updated ${hit} of ${total} position${total === 1 ? "" : "s"} from your search data.`)
      }
    } finally {
      setUpdating(false)
    }
  }

  function addKeyword(event: React.FormEvent) {
    event.preventDefault()
    setAddError(null)
    const term = newTerm.trim()
    if (!term || !wid || !siteId) { setAddError("Enter a keyword."); return }
    addMutation.mutate(term, {
      onSuccess: (kw) => { setSelectedId(kw.id); setNewTerm("") },
      onError: (err) => setAddError(err instanceof ApiError && err.status === 409
        ? "That keyword is already tracked." : errorMessage(err, "Could not add the keyword.")),
    })
  }

  function removeKeyword(kwId: string) {
    if (!wid || !siteId) return
    removeMutation.mutate(kwId, {
      onSuccess: () => { if (selectedId === kwId) setSelectedId(null) },
      onError: (err) => toast.error(errorMessage(err, "Could not remove the keyword.")),
    })
  }

  const rangeWeeks = range === "4w" ? 4 : range === "12w" ? 12 : null
  // Window relative to the latest entry (not the wall clock), so it stays pure.
  const points: RankPoint[] = React.useMemo(() => {
    let visible = entries
    if (rangeWeeks != null && entries.length > 0) {
      const latest = entries.reduce((max, e) => Math.max(max, new Date(e.recorded_at).getTime()), 0)
      const cutoff = latest - rangeWeeks * 7 * 24 * 60 * 60 * 1000
      visible = entries.filter((e) => new Date(e.recorded_at).getTime() >= cutoff)
    }
    return visible.map((e) => ({ label: fmtDate(e.recorded_at), position: e.position }))
  }, [entries, rangeWeeks])

  if (!activeDomain) {
    return (
      <div className="space-y-6">
        <PageHeader title={<> Rank Tracking </>} description={<> Keywords you track and their Google positions over time. </>}
          help={rankTrackingHelp} />
        <NoDomain what="rank tracking" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={<> Rank Tracking </>} description={<> Your keywords and their Google position over time for {activeDomain.domain}. </>}
          help={rankTrackingHelp} />
        <Button onClick={updatePositions} disabled={updating || !siteId} className="shrink-0">
          {updating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Update positions
        </Button>
      </div>

      {kwLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </div>
      ) : keywords.length > 0 ? (
        <RankSummary keywords={keywords} />
      ) : null}

      {/* Keywords table */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">
            Tracked keywords{keywords.length ? <span className="ml-1 font-normal text-muted-foreground">({keywords.length})</span> : null}
          </CardTitle>
          <form onSubmit={addKeyword} className="flex w-full max-w-sm items-start gap-2">
            <div className="flex-1">
              <Input value={newTerm} onValueChange={(v) => { setNewTerm(v); if (addError) setAddError(null) }}
                placeholder="Add a keyword to track…" aria-label="Add a keyword to track" disabled={adding} aria-invalid={!!addError} />
              <AnimatePresence initial={false}>
                {addError ? <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-1 text-xs text-destructive">{addError}</motion.p> : null}
              </AnimatePresence>
            </div>
            <Button type="submit" disabled={adding}>{adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />} Add</Button>
          </form>
        </CardHeader>
        <CardContent>
          {kwLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
            </div>
          ) : keywords.length === 0 ? (
            <div className="mx-auto max-w-md py-12 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><KeyRound className="size-6" /></div>
              <p className="mt-3 text-sm font-semibold">No keywords tracked yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pull the keywords your site already ranks for from Google Search Console — positions included — or add your own above.
              </p>
              <Button onClick={importFromGsc} disabled={importing || !siteId} className="mt-4">
                {importing ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Get keywords from Search Console
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Keyword</th>
                    <th className="w-20 px-3 py-2 text-right font-medium">Volume</th>
                    <th className="w-14 px-3 py-2 text-right font-medium">KD</th>
                    <th className="w-24 px-3 py-2 text-right font-medium">Position</th>
                    <th className="w-20 px-3 py-2 text-right font-medium">Change</th>
                    <th className="w-14 px-3 py-2 text-right font-medium">Best</th>
                    <th className="w-10 px-3 py-2"><span className="sr-only">Remove</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {keywords.map((k) => (
                    <tr key={k.id} onClick={() => setSelectedId(k.id)}
                      className={cn("cursor-pointer transition-colors hover:bg-muted/40", k.id === selectedId && "bg-primary/5")}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{k.term}</p>
                        {k.intent && k.intent !== "unknown" ? <p className="text-xs capitalize text-muted-foreground">{k.intent}</p> : null}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{k.search_volume == null ? "—" : compactNum(k.search_volume)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{k.difficulty == null ? "—" : Math.round(k.difficulty)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {k.latest_position == null ? <span className="font-normal text-muted-foreground">—</span> : `#${k.latest_position}`}
                      </td>
                      <td className="px-3 py-2.5 text-right"><span className="inline-flex justify-end"><PositionDelta latest={k.latest_position} previous={k.previous_position} /></span></td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{k.best_position == null ? "—" : `#${k.best_position}`}</td>
                      <td className="px-3 py-2.5 text-right">
                        <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); removeKeyword(k.id) }}
                          aria-label={`Remove ${k.term}`} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trend for the selected keyword */}
      {keywords.length > 0 ? (
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">{selected ? `“${selected.term}”` : "Position trend"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {selected
                  ? `Latest #${selected.latest_position ?? "—"} · Best #${selected.best_position ?? "—"} · ${selected.entry_count} entr${selected.entry_count === 1 ? "y" : "ies"}`
                  : "Select a keyword above to see its trend."}
              </p>
            </div>
            {selected && entries.length > 1 ? (
              <div className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
                {(["4w", "12w", "all"] as const).map((r) => (
                  <button key={r} type="button" onClick={() => setRange(r)}
                    className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      range === r ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                    {r === "all" ? "All" : r}
                  </button>
                ))}
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <LineChart className="size-6 text-muted-foreground/50" />
                Select a keyword to see its position trend.
              </div>
            ) : entriesLoading ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <RankTrendChart data={points} />
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
