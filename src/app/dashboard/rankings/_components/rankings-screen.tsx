"use client"

import { CompetitorRankTimeline } from "@/components/rankings/competitor-rank-timeline"
import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { NoDomain } from "@/components/dashboard/current-domain"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAddTrackedKeyword, useImportGscKeywords, useRemoveTrackedKeyword,
  useSyncGscPositions, useSyncSerpPositions, useTrackedKeywords, useTrackNow, useUpdateTracking,
} from "@/hooks/api/use-rankings"
import { ApiError, errorMessage } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import {
  Award, Calendar, Download, KeyRound, LineChart, ListChecks, Loader2, Plus, RefreshCw,
  Search, Target, Trash2, TrendingUp,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import * as React from "react"
import { toast } from "sonner"
import { fmtDate } from "../_lib/rankings-helpers"
import { PositionDelta } from "./position-delta"

/** Brief "what this page does" shown in the title help popover. */
const rankTrackingHelp = (
  <>
    <p><span className="font-medium text-foreground">Rank Tracking</span> follows a keyword&apos;s Google position over time for this website — and how your competitors move with it.</p>
    <p className="mt-2">Add keywords, then each one is checked automatically on a 15- or 30-day cadence. Select a row to see its trend against the competitors ranking for it.</p>
  </>
)

/** Compact volume (1.2K, 34K, 1.1M). */
function compactNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${n}`
}

type TrackStatus = { tracking_status: string; tracking_enabled: boolean }

/** Small coloured dot + label for a keyword's automated-tracking state. */
function StatusDot({ k }: { k: TrackStatus }) {
  const map: Record<string, { c: string; t: string }> = {
    processing: { c: "bg-amber-500", t: "Checking…" },
    error: { c: "bg-destructive", t: "Needs attention" },
    idle: { c: "bg-emerald-500", t: "Tracking" },
  }
  const s = !k.tracking_enabled ? { c: "bg-muted-foreground", t: "Paused" } : map[k.tracking_status] ?? map.idle
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("inline-block size-2 rounded-full", s.c, k.tracking_status === "processing" && "animate-pulse")} />
      {s.t}
    </span>
  )
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

/** One compact labelled figure inside the trend card header. */
function MiniStat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border px-3 py-1.5">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{children}</p>
    </div>
  )
}

export default function RankingsPage() {
  // The workspace + website picked in the top bar.
  const activeWorkspace = useActiveWorkspace()
  const activeDomain = useActiveDomain()
  const wid = activeWorkspace?.id ?? null
  const siteId = activeDomain?.id ?? null
  const isSandbox = Boolean(activeWorkspace?.is_sandbox)

  // Data (TanStack Query): tracked keywords + the selected keyword's history.
  const keywordsQuery = useTrackedKeywords(wid, siteId)
  const keywords = keywordsQuery.data ?? []
  const kwLoading = keywordsQuery.isPending && Boolean(siteId)

  // The picked keyword; falls back to the first one (derived, no effect needed).
  const [chosenId, setSelectedId] = React.useState<string | null>(null)
  const selectedId = chosenId && keywords.some((k) => k.id === chosenId) ? chosenId : keywords[0]?.id ?? null
  const selected = keywords.find((k) => k.id === selectedId) ?? null

  const [newTerm, setNewTerm] = React.useState("")
  const [addError, setAddError] = React.useState<string | null>(null)
  const [updating, setUpdating] = React.useState(false)
  const [confirmTrack, setConfirmTrack] = React.useState(false)

  const addMutation = useAddTrackedKeyword(wid, siteId)
  const removeMutation = useRemoveTrackedKeyword(wid, siteId)
  const gscMutation = useSyncGscPositions(wid, siteId)
  const serpMutation = useSyncSerpPositions(wid, siteId)
  const importMutation = useImportGscKeywords(wid, siteId)
  const trackNowMutation = useTrackNow(wid, siteId)
  const freqMutation = useUpdateTracking(wid, siteId)
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
        toast.info("No stored positions yet.", {
          description: "Use “Track now” on a keyword to fetch its live rankings, or connect Search Console.",
        })
      } else {
        toast.success(`Updated ${hit} of ${total} position${total === 1 ? "" : "s"} from your search data.`)
      }
    } finally {
      setUpdating(false)
    }
  }

  function runTrackNow() {
    if (!selectedId) return
    trackNowMutation.mutate(selectedId, {
      onSuccess: (r) => {
        if (r.skipped) { toast.info("A check is already running for this keyword."); return }
        const pos = r.our_position == null ? "Not ranking in the top 100" : `You're at #${r.our_position}`
        toast.success("Rankings updated.", { description: `${pos} · ${r.competitors} competitor${r.competitors === 1 ? "" : "s"} found.` })
      },
      onError: (err) => toast.error(errorMessage(err, "Could not fetch rankings right now.")),
    })
  }

  function onTrackNowClick() {
    if (!selectedId) return
    if (isSandbox) runTrackNow()
    else setConfirmTrack(true)
  }

  function setFrequency(days: number) {
    if (!selectedId) return
    freqMutation.mutate({ keywordId: selectedId, tracking_frequency_days: days },
      { onError: (err) => toast.error(errorMessage(err, "Could not change the schedule.")) })
  }

  function addKeyword(event: React.FormEvent) {
    event.preventDefault()
    setAddError(null)
    const term = newTerm.trim()
    if (!term || !wid || !siteId) { setAddError("Enter a keyword."); return }
    addMutation.mutate(term, {
      onSuccess: (kw) => {
        setSelectedId(kw.id); setNewTerm("")
        if (isSandbox) toast.success(`Now tracking “${kw.term}”.`, { description: "Fetching its first rankings…" })
        else toast.success(`Now tracking “${kw.term}”.`, { description: "Use “Track now” to fetch its first rankings." })
      },
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

  if (!activeDomain) {
    return (
      <div className="space-y-6">
        <PageHeader title={<> Rank Tracking </>} description={<> Keywords you track and their Google positions over time. </>}
          help={rankTrackingHelp} />
        <NoDomain what="rank tracking" />
      </div>
    )
  }

  const nextCheck = selected?.next_fetch_at ?? null
  const lastTracked = selected?.last_fetched_at ?? null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={<> Rank Tracking </>} description={<> Your keywords and their Google position over time for {activeDomain.domain}, next to the competitors ranking for them. </>}
          help={rankTrackingHelp} />
        <Button onClick={updatePositions} variant="outline" disabled={updating || !siteId} className="shrink-0">
          {updating ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          Update from search data
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
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Keyword</th>
                    <th className="w-28 px-3 py-2 font-medium">Status</th>
                    <th className="w-20 px-3 py-2 text-right font-medium">Volume</th>
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
                      <td className="px-3 py-2.5"><StatusDot k={k} /></td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">{k.search_volume == null ? "—" : compactNum(k.search_volume)}</td>
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
          <CardHeader className="flex-col items-stretch gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-base">{selected ? `“${selected.term}”` : "Position trend"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selected ? "Your rank vs. the competitors ranking for this keyword." : "Select a keyword above to see its trend."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Tracking cadence */}
                {selected ? (
                  <div className="inline-flex shrink-0 rounded-lg border border-border p-0.5" title="How often this keyword is checked">
                    {[15, 30].map((d) => (
                      <button key={d} type="button" onClick={() => setFrequency(d)}
                        disabled={freqMutation.isPending}
                        className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                          selected.tracking_frequency_days === d ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground")}>
                        {d}d
                      </button>
                    ))}
                  </div>
                ) : null}
                <Button size="sm" onClick={onTrackNowClick} disabled={!selectedId || trackNowMutation.isPending}>
                  {trackNowMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  Track now
                </Button>
              </div>
            </div>

            {/* Per-keyword figures */}
            {selected ? (
              <div className="flex flex-wrap gap-2">
                <MiniStat label="Current">{selected.latest_position == null ? "—" : `#${selected.latest_position}`}</MiniStat>
                <MiniStat label="Previous">{selected.previous_position == null ? "—" : `#${selected.previous_position}`}</MiniStat>
                <MiniStat label="Change"><PositionDelta latest={selected.latest_position} previous={selected.previous_position} /></MiniStat>
                <MiniStat label="Best">{selected.best_position == null ? "—" : `#${selected.best_position}`}</MiniStat>
                <MiniStat label="Last tracked">{lastTracked ? fmtDate(lastTracked) : "—"}</MiniStat>
                <MiniStat label="Next check">{nextCheck ? fmtDate(nextCheck) : "—"}</MiniStat>
              </div>
            ) : null}
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="flex h-56 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <LineChart className="size-6 text-muted-foreground/50" />
                Select a keyword to see its position trend.
              </div>
            ) : (
              // Filterable chart: this keyword's SERP competitors (top 10) over
              // time, with a Filters popover (date range + competitors) and
              // Weekly / Monthly frequency.
              <CompetitorRankTimeline
                workspaceId={wid}
                domainId={siteId}
                variant="full"
                keywordId={selectedId}
                top={10}
                bare
              />
            )}
          </CardContent>
        </Card>
      ) : null}

      {selected ? (
        <ConfirmDialog
          open={confirmTrack}
          onOpenChange={setConfirmTrack}
          tone="default"
          icon={<Calendar className="size-5" />}
          title={`Check “${selected.term}” now?`}
          description="This fetches fresh Google rankings for this keyword right now (a small paid search lookup) and records your position plus the competitors ranking for it."
          confirmLabel="Fetch rankings"
          onConfirm={() => trackNowMutation.mutateAsync(selectedId!).then((r) => {
            const pos = r.our_position == null ? "Not ranking in the top 100" : `You're at #${r.our_position}`
            toast.success("Rankings updated.", { description: `${pos} · ${r.competitors} competitor${r.competitors === 1 ? "" : "s"} found.` })
          })}
        />
      ) : null}
    </div>
  )
}
