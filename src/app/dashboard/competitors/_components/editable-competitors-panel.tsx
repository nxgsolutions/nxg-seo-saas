"use client"

import { useActiveWorkspace } from "@/hooks/dashboard"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useAddCompetitor,
  useAddCompetitorsBulk,
  useCompetitorList,
  useCompetitorSuggestions,
  useRemoveCompetitor,
  type useDiscoverCompetitors,
} from "@/hooks/api/use-competitors"
import { errorMessage } from "@/lib/api/client"
import type {
  CompetitorSuggestion,
  CuratedCompetitor,
  ProposedCompetitor,
} from "@/lib/api/competitors"
import { cn } from "@/lib/utils"
import { ChevronRight, ExternalLink, Loader2, Plus, Sparkles, Trash2, Users } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import * as React from "react"
import {
  CompetitorCombobox,
  type CompetitorOption,
} from "@/components/dashboard/competitor-combobox"
import { Favicon } from "./favicon"

// Stable empty lists (a new [] each render would re-run the memo below).
const NO_ROWS: CuratedCompetitor[] = []
const NO_SUGGESTIONS: CompetitorSuggestion[] = []

export function EditableCompetitorsPanel({
  domainId,
  discover,
}: {
  domainId: string
  /** Shared discovery instance — powers the "Find competitors again" header action. */
  discover?: ReturnType<typeof useDiscoverCompetitors>
}) {
  const activeWorkspace = useActiveWorkspace()
  const workspaceId = activeWorkspace?.id ?? null
  const did = domainId || null
  // List + suggestions (TanStack Query); add/remove refresh everything for this website.
  const list = useCompetitorList(workspaceId, did)
  const sugg = useCompetitorSuggestions(workspaceId, did)
  const addMutation = useAddCompetitor(workspaceId, did)
  const removeMutation = useRemoveCompetitor(workspaceId, did)
  const rows = list.data?.rows ?? NO_ROWS
  const suggestions = sugg.data?.rows ?? NO_SUGGESTIONS
  const loading = list.isPending && Boolean(did)
  const busy = addMutation.isPending || removeMutation.isPending
  // Add errors are surfaced by the promise toast in `add()`, so the inline alert
  // only covers failures to load the list.
  const error = list.isError
    ? errorMessage(list.error, "Could not load competitors.")
    : null

  // Add-combobox suggestions: SERP-discovered domains not already on your list.
  const addOptions = React.useMemo<CompetitorOption[]>(() => {
    const have = new Set(rows.map((r) => r.competitor))
    return suggestions
      .filter((s) => !have.has(s.competitor))
      .map((s) => ({ domain: s.competitor, tag: "suggested" as const }))
  }, [rows, suggestions])

  function add(domain: string) {
    const d = domain.trim()
    if (!workspaceId || !did || !d) return
    removeMutation.reset()
    // Adding now also verifies the competitor's business (a short scrape + match
    // check), so surface the whole flow as one promise toast: verifying → added
    // (with its match confidence) → or an error.
    toast.promise(addMutation.mutateAsync(d), {
      loading: `Checking ${d} — verifying the business…`,
      success: (row) =>
        row?.confidence
          ? `Added ${row.label || row.competitor} · ${row.confidence} match`
          : `Added ${row?.competitor ?? d} to your competitors`,
      error: (e) => errorMessage(e, "Couldn't add that competitor."),
    })
  }

  // Competitor waiting for delete confirmation (null = dialog closed).
  const [toRemove, setToRemove] = React.useState<CuratedCompetitor | null>(null)

  async function remove(id: string) {
    if (!workspaceId || !did) return
    addMutation.reset()
    await removeMutation.mutateAsync(id)
  }

  // "Find competitors again" runs in PREVIEW mode: it discovers candidates
  // without changing the list, then we ask the user to confirm merging the NEW
  // ones in. `toMerge` holds the new candidates awaiting that confirmation.
  const bulkAdd = useAddCompetitorsBulk(workspaceId, did)
  const [toMerge, setToMerge] = React.useState<ProposedCompetitor[] | null>(null)
  // Which of the proposed competitors the user has ticked to add (by domain).
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  // Each finished preview job is handled once (open the dialog / toast the result).
  const handledJobRef = React.useRef<string | null>(null)

  // React to a finished discovery run exactly once. Loading lives in the
  // discovery overlay and the server mutation's own `isPending`; here we only
  // turn the FINAL state (done / error) into a dialog or a toast.
  React.useEffect(() => {
    const job = discover?.job
    if (!job || job.status === "running") return
    if (handledJobRef.current === job.job_id) return
    handledJobRef.current = job.job_id

    if (job.status === "error") {
      toast.error(
        discover?.error ??
          "We couldn't find competitors right now. Please try again.",
      )
      return
    }
    // Only preview runs carry a `proposed` array to confirm/merge.
    if (job.proposed == null) return
    const fresh = job.proposed.filter((p) => !p.already_tracked)
    // Let the discovery success flourish play out before the confirm dialog.
    const t = window.setTimeout(() => {
      if (fresh.length === 0) {
        toast("No new competitors found — your list is already up to date.")
      } else {
        // Default to all ticked; the user unticks any that aren't a real fit.
        setSelected(new Set(fresh.map((p) => p.domain)))
        setToMerge(fresh)
      }
    }, 1900)
    return () => window.clearTimeout(t)
  }, [discover?.job, discover?.error])

  function toggleMerge(domain: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(domain)) next.delete(domain)
      else next.add(domain)
      return next
    })
  }

  function findAgain() {
    if (!domainId) return
    setToMerge(null)
    discover?.start({ extraServices: [], preview: true })
  }

  const discovering = discover?.isRunning ?? false

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="size-4 text-primary" /> Your competitors
          </CardTitle>
          <CardDescription>
            Click any competitor to see the keywords they rank for. Add the ones
            you know and remove any that don&apos;t fit.
          </CardDescription>
        </div>
        {discover ? (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={findAgain}
            disabled={discovering || !domainId}
            title="Find more competitors and choose which to add — your current list is kept"
          >
            {discovering ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Find competitors again
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {/* Add a competitor */}
        <CompetitorCombobox
          options={addOptions}
          onPick={(d) => {
            void add(d)
          }}
          clearOnPick
          placeholder="Add a competitor domain, e.g. yourcompetitor.com"
          actionLabel="Add"
          actionIcon={<Plus className="size-4" />}
          disabled={!domainId}
          busy={busy}
        />

        {/* Curated list */}
        {loading ? (
          <div
            className="divide-y divide-border rounded-lg border border-border"
            role="status"
            aria-busy="true"
          >
            <span className="sr-only">Loading competitors…</span>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3">
                <Skeleton className="h-3 w-4" />
                <Skeleton className="size-5 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
            No competitors yet. Add one above, or use &ldquo;Find competitors
            again&rdquo; to rebuild the list.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {rows.map((r, i) => (
              // The whole row is a link to this competitor's keyword details. A
              // stretched Link (absolute inset) sits under the content, so the
              // external-site icon and the remove button stay independently
              // clickable while a click anywhere else opens the details.
              <li
                key={r.id}
                className="group relative flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
              >
                <Link
                  href={`/dashboard/competitors/keywords?competitor=${encodeURIComponent(r.competitor)}`}
                  aria-label={`See keywords ${r.competitor} ranks for`}
                  className="absolute inset-0 z-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                />
                <span className="pointer-events-none relative z-10 w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <div className="pointer-events-none relative z-10 shrink-0">
                  <Favicon domain={r.competitor} />
                </div>
                <div className="pointer-events-none relative z-10 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
                      {r.label || r.competitor}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {r.competitor}
                    </span>
                    {/* Match confidence — shown for every competitor (discovered
                        or manually added), since manual adds are now verified
                        and scored the same way. */}
                    {r.confidence ? (
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {r.confidence} match
                      </Badge>
                    ) : null}
                  </div>
                  {r.reason ? (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {r.reason}
                    </p>
                  ) : null}
                </div>
                {r.avg_position != null ? (
                  <span className="pointer-events-none relative z-10 shrink-0 text-xs tabular-nums text-muted-foreground">
                    {`avg #${r.avg_position}`}
                    {r.keywords_shared != null
                      ? ` · ${r.keywords_shared} kw`
                      : ""}
                  </span>
                ) : null}
                <a
                  href={`https://${r.competitor}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`Open ${r.competitor} in a new tab`}
                  aria-label={`Open ${r.competitor} in a new tab`}
                  className="relative z-10 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ExternalLink className="size-4" />
                </a>
                <span className="pointer-events-none relative z-10 hidden shrink-0 items-center gap-0.5 text-sm font-medium text-primary sm:inline-flex">
                  See keywords
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative z-10 shrink-0 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setToRemove(r)}
                  disabled={busy}
                  aria-label={`Remove ${r.competitor}`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {/* Suggestions row hidden per request — kept here for easy restore:
        {suggestions.length > 0 ? (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Suggested — sites ranking for your keywords. Click to add:
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s.competitor}
                  type="button"
                  onClick={() => add(s.competitor)}
                  disabled={busy}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs",
                    "transition-colors hover:bg-muted/50 disabled:opacity-50",
                  )}
                >
                  <Plus className="size-3" />
                  {s.competitor}
                  <span className="text-muted-foreground">
                    · {s.keywords_shared} kw
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
        */}
      </CardContent>

      <ConfirmDialog
        open={toRemove !== null}
        onOpenChange={(o) => {
          if (!o) setToRemove(null)
        }}
        title={<>Remove {toRemove?.label || toRemove?.competitor}?</>}
        description={
          <>
            <span className="font-medium text-foreground">
              {toRemove?.competitor}
            </span>{" "}
            will be removed from your competitor list for this website.
          </>
        }
        details={
          <p className="text-muted-foreground">
            Its saved rank history is kept, and you can add it back at any time.
          </p>
        }
        confirmLabel={
          <>
            <Trash2 className="size-4" /> Remove competitor
          </>
        }
        errorText="Could not remove the competitor. Please try again."
        onConfirm={() => toRemove && remove(toRemove.id)}
      />

      {/* Confirm merging the newly found competitors into the current list.
          The user ticks the ones to keep and can open each homepage to check
          it's a genuine competitor before adding. */}
      <ConfirmDialog
        open={toMerge !== null}
        onOpenChange={(o) => {
          if (!o) setToMerge(null)
        }}
        className="sm:max-w-xl"
        tone="default"
        icon={<Sparkles className="size-5" />}
        title={
          <>
            {toMerge?.length ?? 0} new competitor
            {(toMerge?.length ?? 0) === 1 ? "" : "s"} found
          </>
        }
        description="Pick the ones to add to your list. Open a site to check it's a genuine competitor first — untick any that aren't a fit. Your current list is kept as is."
        details={
          <div className="space-y-2">
            {(toMerge?.length ?? 0) > 1 ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {selected.size} of {toMerge?.length} selected
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  onClick={() =>
                    setSelected(
                      selected.size === (toMerge?.length ?? 0)
                        ? new Set()
                        : new Set((toMerge ?? []).map((p) => p.domain)),
                    )
                  }
                >
                  {selected.size === (toMerge?.length ?? 0)
                    ? "Clear all"
                    : "Select all"}
                </button>
              </div>
            ) : null}
            <div className="relative">
            <ul className="scrollbar-hide max-h-80 space-y-1.5 overflow-auto">
              {toMerge?.map((p) => {
                const checked = selected.has(p.domain)
                return (
                  <li
                    key={p.domain}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors",
                      checked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border",
                    )}
                  >
                    {/* Tick to include. The whole label toggles it. */}
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMerge(p.domain)}
                        className="size-4 shrink-0 accent-primary"
                        aria-label={`Add ${p.domain}`}
                      />
                      <Favicon domain={p.domain} />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium text-foreground">
                          {p.name || p.domain}
                        </span>{" "}
                        <span className="text-xs text-muted-foreground">
                          {p.domain}
                        </span>
                      </span>
                    </label>
                    {p.confidence ? (
                      <Badge
                        variant="outline"
                        className="shrink-0 text-[10px] capitalize"
                      >
                        {p.confidence} match
                      </Badge>
                    ) : null}
                    {/* Quick visit: open the competitor's homepage in a new tab. */}
                    <a
                      href={`https://${p.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${p.domain} in a new tab`}
                      aria-label={`Open ${p.domain} in a new tab`}
                      className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ExternalLink className="size-4" />
                    </a>
                  </li>
                )
              })}
            </ul>
            {/* Scrollbar is hidden; a soft bottom fade hints there's more below. */}
            {(toMerge?.length ?? 0) > 6 ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-card to-transparent" />
            ) : null}
            </div>
          </div>
        }
        confirmLabel={
          <>
            <Plus className="size-4" /> Add {selected.size || ""} selected
          </>
        }
        confirmDisabled={selected.size === 0}
        errorText="Could not add the competitors. Please try again."
        onConfirm={async () => {
          const chosen = (toMerge ?? []).filter((p) => selected.has(p.domain))
          if (chosen.length === 0) return
          await bulkAdd.mutateAsync(
            chosen.map((p) => ({
              domain: p.domain,
              label: p.name,
              reason: p.reason,
              confidence: p.confidence,
              match_score: p.match_score,
            })),
          )
          toast.success(
            `Added ${chosen.length} competitor${chosen.length === 1 ? "" : "s"} to your list`,
          )
        }}
      />
    </Card>
  )
}
