"use client"

import { CompetitorRankTimeline } from "@/components/rankings/competitor-rank-timeline"
import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { NoDomain } from "@/components/dashboard/current-domain"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FormattedDate } from "@/components/ui/formatted-date"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAddTrackedKeyword, useImportGscKeywords, useRemoveTrackedKeyword, useUpdateTracking,
  useSyncGscPositions, useSyncSerpPositions, useTrackedKeywords, useTrackNow,
} from "@/hooks/api/use-rankings"
import { ApiError, errorMessage } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import {
  Award, Calendar, Download, KeyRound, ListChecks, Loader2, MoreHorizontal, Pause, Play, Plus, RefreshCw,
  Search, Target, Trash2, TrendingUp,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import * as React from "react"
import { toast } from "sonner"
import { PositionDelta } from "./position-delta"

/** Brief "what this page does" shown in the title help popover. */
const rankTrackingHelp = (
  <>
    <p><span className="font-medium text-foreground">Keyword Rankings</span> follows a keyword&apos;s Google position over time for this website — and how your competitors move with it.</p>
    <p className="mt-2">Add keywords, then each is checked automatically on the cadence you pick per row (every 1 week, 2 weeks or 1 month). Pause or resume any keyword, and select a row to see its trend against the competitors ranking for it.</p>
  </>
)

type TrackStatus = { tracking_status: string; tracking_enabled: boolean }

/** The per-keyword tracking frequencies offered in the table (days). */
const FREQ_OPTIONS = [
  { days: 7, label: "Every 1 week" },
  { days: 14, label: "Every 2 weeks" },
  { days: 30, label: "Every 1 month" },
] as const

function freqLabel(days: number): string {
  const opt = FREQ_OPTIONS.find((o) => o.days === days)
  if (opt) return opt.label
  if (days === 15) return "~2 weeks"  // legacy cadence, shown until the user re-picks
  return `Every ${days} days`
}

/**
 * Live tracking indicator. Active keywords show a gently pulsing green dot;
 * while a fetch is actually running (status "processing") the dot gets a
 * blinking "ping" halo. Paused is a static grey dot, errors a static red one.
 */
function StatusCell({ k }: { k: TrackStatus }) {
  const paused = !k.tracking_enabled
  const processing = !paused && k.tracking_status === "processing"
  const error = !paused && k.tracking_status === "error"
  const dot = paused ? "bg-muted-foreground" : error ? "bg-destructive" : "bg-emerald-500"
  const label = paused ? "Paused" : error ? "Needs attention" : processing ? "Checking…" : "Active"
  const tone = paused ? "text-muted-foreground" : error ? "text-destructive" : "text-foreground/80"
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs font-medium", tone)}>
      <span className="relative inline-flex size-2 items-center justify-center">
        {processing ? (
          <span className="absolute inline-flex size-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
        ) : null}
        <span className={cn(
          "relative inline-flex size-2 rounded-full",
          dot,
          !paused && !error && "motion-safe:animate-pulse",
        )} />
      </span>
      {label}
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

/** Sentinel for the "All keywords (average)" view in the keyword selector. */
const ALL_KW = "__all_keywords__"

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

  // The picked keyword (falls back to the first one), or the "All keywords"
  // average view. chosenId = a keyword id, ALL_KW, or null (initial → first).
  const [chosenId, setSelectedId] = React.useState<string | null>(null)
  const isAll = chosenId === ALL_KW
  const selectedId = isAll ? null : (chosenId && keywords.some((k) => k.id === chosenId) ? chosenId : keywords[0]?.id ?? null)
  const selected = selectedId ? keywords.find((k) => k.id === selectedId) ?? null : null

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
  const updateMutation = useUpdateTracking(wid, siteId)
  const adding = addMutation.isPending
  const importing = importMutation.isPending
  // Which row is mid-update (frequency change or pause/resume) → row-level spinner.
  const busyId = updateMutation.isPending ? updateMutation.variables?.keywordId ?? null : null

  // Keyword queued for removal (confirmed in the dialog before it's deleted).
  const [removeTarget, setRemoveTarget] = React.useState<{ id: string; term: string } | null>(null)

  // Change a keyword's refresh cadence (persisted; the scheduler re-anchors next run).
  function changeFreq(kwId: string, days: number) {
    updateMutation.mutate(
      { keywordId: kwId, tracking_frequency_days: days },
      {
        onSuccess: () => toast.success(`Checking ${freqLabel(days).toLowerCase()}.`),
        onError: (err) => toast.error(errorMessage(err, "Could not change the schedule.")),
      }
    )
  }

  // Pause or resume automated tracking for one keyword (history is kept either way).
  function togglePause(k: { id: string; term: string; tracking_enabled: boolean }) {
    const resume = !k.tracking_enabled
    updateMutation.mutate(
      { keywordId: k.id, tracking_enabled: resume },
      {
        onSuccess: () => toast.success(resume ? `Resumed tracking “${k.term}”.` : `Paused tracking “${k.term}”.`),
        onError: (err) => toast.error(errorMessage(err, "Could not update tracking.")),
      }
    )
  }

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
      onSuccess: trackNowSuccess,
      onError: (err) => toast.error(errorMessage(err, "Could not update rankings right now. Please try again.")),
    })
  }

  // Plain-language result toast for an on-demand update.
  function trackNowSuccess(r: { skipped: string | null; our_position: number | null; competitors: number }) {
    if (r.skipped) { toast.info("This keyword is already being updated."); return }
    const pos = r.our_position == null ? "Your site isn't in the top results yet" : `You're at position #${r.our_position}`
    const comp = `${r.competitors} competitor${r.competitors === 1 ? "" : "s"} found`
    toast.success("Rankings updated", { description: `${pos}. ${comp}.` })
  }

  function onTrackNowClick() {
    if (!selectedId) return
    if (isSandbox) runTrackNow()
    else setConfirmTrack(true)
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

  if (!activeDomain) {
    return (
      <div className="space-y-6">
        <PageHeader title={<> Keyword Rankings </>} description={<> Keywords you track and their Google positions over time. </>}
          help={rankTrackingHelp} />
        <NoDomain what="keyword rankings" />
      </div>
    )
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeader title={<> Keyword Rankings </>} description={<> Your keywords and their Google position over time for {activeDomain.domain}, next to the competitors ranking for them. </>}
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
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Keyword</th>
                    <th className="w-32 px-3 py-2 font-medium">Status</th>
                    <th className="w-20 px-3 py-2 text-right font-medium">Position</th>
                    <th className="w-20 px-3 py-2 text-right font-medium">Previous</th>
                    <th className="w-20 px-3 py-2 text-right font-medium">Change</th>
                    <th className="w-40 px-3 py-2 font-medium">Frequency</th>
                    <th className="w-28 px-3 py-2 font-medium">Last tracked</th>
                    <th className="w-28 px-3 py-2 font-medium">Next scheduled</th>
                    <th className="w-10 px-3 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {keywords.map((k) => {
                    const busy = busyId === k.id
                    const freqValue = String(k.tracking_frequency_days)
                    const overdue = k.next_fetch_at ? new Date(k.next_fetch_at).getTime() <= Date.now() : false
                    return (
                    <tr key={k.id} onClick={() => setSelectedId(k.id)}
                      className={cn("cursor-pointer transition-colors hover:bg-muted/40", k.id === selectedId && "bg-primary/5")}>
                      <td className="px-3 py-2.5">
                        <p className="font-medium">{k.term}</p>
                        {k.intent && k.intent !== "unknown" ? <p className="text-xs capitalize text-muted-foreground">{k.intent}</p> : null}
                      </td>
                      <td className="px-3 py-2.5"><StatusCell k={k} /></td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {k.latest_position == null ? <span className="font-normal text-muted-foreground">—</span> : `#${k.latest_position}`}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted-foreground">
                        {k.previous_position == null ? "—" : `#${k.previous_position}`}
                      </td>
                      <td className="px-3 py-2.5 text-right"><span className="inline-flex justify-end"><PositionDelta latest={k.latest_position} previous={k.previous_position} /></span></td>
                      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <Select value={freqValue} onValueChange={(v) => { if (v) changeFreq(k.id, Number(v)) }} disabled={busy}>
                          <SelectTrigger className="h-8 w-full"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {FREQ_OPTIONS.map((o) => (
                              <SelectItem key={o.days} value={String(o.days)}>{o.label}</SelectItem>
                            ))}
                            {k.tracking_frequency_days === 15 ? (
                              <SelectItem value="15">~2 weeks (legacy)</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2.5">
                        {k.last_fetched_at ? <FormattedDate value={k.last_fetched_at} /> : <span className="text-xs text-muted-foreground">Not yet</span>}
                      </td>
                      <td className="px-3 py-2.5">
                        {!k.tracking_enabled ? (
                          <span className="text-xs text-muted-foreground">Paused</span>
                        ) : overdue ? (
                          <span className="inline-flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">Due now</span>
                        ) : k.next_fetch_at ? (
                          <FormattedDate value={k.next_fetch_at} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger render={
                            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${k.term}`}
                              className="text-muted-foreground" disabled={busy} />
                          }>
                            {busy ? <Loader2 className="size-4 animate-spin" /> : <MoreHorizontal className="size-4" />}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => togglePause(k)}>
                              {k.tracking_enabled ? <><Pause className="size-4" /> Pause tracking</> : <><Play className="size-4" /> Resume tracking</>}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setRemoveTarget({ id: k.id, term: k.term })}
                              className="text-destructive data-[highlighted]:text-destructive [&_svg]:text-destructive">
                              <Trash2 className="size-4" /> Remove keyword
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                    )
                  })}
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
                <CardTitle className="text-base">{isAll ? "All keywords" : selected ? selected.term : "Position trend"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {isAll
                    ? "Average rank for you vs. your most common competitors across all tracked keywords."
                    : "Your rank vs. the competitors ranking for this keyword."}
                </p>
              </div>
              {selected ? (
                <Button size="sm" onClick={onTrackNowClick} disabled={!selectedId || trackNowMutation.isPending}>
                  {trackNowMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  Track now
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filterable chart. The keyword combobox (in the filter bar) picks a
                single keyword's SERP competitors or the All-keywords average. */}
            <CompetitorRankTimeline
              workspaceId={wid}
              domainId={siteId}
              variant="full"
              keywordOptions={keywords.map((k) => ({ id: k.id, term: k.term }))}
              selectedKeywordId={selectedId}
              onKeywordChange={(id) => setSelectedId(id ?? ALL_KW)}
              top={10}
              bare
            />
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
          description="This checks your current Google ranking for this keyword now and updates the graph. It uses one paid lookup."
          confirmLabel="Update now"
          onConfirm={() => trackNowMutation.mutateAsync(selectedId!).then(trackNowSuccess)}
        />
      ) : null}

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(o) => { if (!o) setRemoveTarget(null) }}
        tone="destructive"
        title={removeTarget ? `Remove “${removeTarget.term}”?` : "Remove keyword?"}
        description="This stops tracking the keyword and removes it from this list. Its ranking history is kept and restored if you add it again."
        confirmLabel="Remove"
        onConfirm={() => {
          const id = removeTarget?.id
          if (!id) return
          return removeMutation.mutateAsync(id).then(() => {
            if (selectedId === id) setSelectedId(null)
            setRemoveTarget(null)
            toast.success("Keyword removed.")
          })
        }}
      />
    </div>
  )
}
