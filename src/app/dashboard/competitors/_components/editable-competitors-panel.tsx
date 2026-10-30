"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
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
  useCompetitorList,
  useCompetitorSuggestions,
  useRemoveCompetitor,
} from "@/hooks/api/use-competitors"
import { errorMessage } from "@/lib/api/client"
import type {
  CompetitorSuggestion,
  CuratedCompetitor,
} from "@/lib/api/competitors"
// import { cn } from "@/lib/utils"  // only used by the hidden "Suggested" row below
import { Plus, Swords, Trash2, Users } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import {
  CompetitorCombobox,
  type CompetitorOption,
} from "@/components/dashboard/competitor-combobox"
import { Favicon } from "./favicon"

// Stable empty lists (a new [] each render would re-run the memo below).
const NO_ROWS: CuratedCompetitor[] = []
const NO_SUGGESTIONS: CompetitorSuggestion[] = []

export function EditableCompetitorsPanel({ domainId }: { domainId: string }) {
  const { activeWorkspace } = useDashboard()
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
  const error = addMutation.isError
    ? errorMessage(addMutation.error, "Could not add competitor.")
    : list.isError
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
    if (!workspaceId || !did || !domain.trim()) return
    removeMutation.reset()
    addMutation.mutate(domain.trim())
  }

  // Competitor waiting for delete confirmation (null = dialog closed).
  const [toRemove, setToRemove] = React.useState<CuratedCompetitor | null>(null)

  async function remove(id: string) {
    if (!workspaceId || !did) return
    addMutation.reset()
    await removeMutation.mutateAsync(id)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4 text-primary" /> Your competitors
        </CardTitle>
        <CardDescription>
          Your tracked competitor list — add ones you know, remove any that are
          wrong. Suggestions are sites that rank for your keywords.
        </CardDescription>
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
            No competitors yet. Add one above, or click a suggestion below.
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center gap-3 px-3 py-2.5">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  {i + 1}
                </span>
                <Favicon domain={r.competitor} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://${r.competitor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open ${r.competitor} in a new tab`}
                      className="truncate font-medium text-primary hover:underline"
                    >
                      {r.label || r.competitor}
                    </a>
                    <a
                      href={`https://${r.competitor}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {r.competitor}
                    </a>
                    {r.source === "manual" ? (
                      <Badge variant="outline" className="text-[10px]">
                        manual
                      </Badge>
                    ) : null}
                    {r.source === "ai" && r.confidence ? (
                      <Badge variant="outline" className="text-[10px]">
                        {r.confidence}
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
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {`avg #${r.avg_position}`}
                    {r.keywords_shared != null
                      ? ` · ${r.keywords_shared} kw`
                      : ""}
                  </span>
                ) : null}
                <Button
                  render={
                    <Link
                      href={`/dashboard/competitive-strategy?competitor=${encodeURIComponent(r.competitor)}`}
                    />
                  }
                  size="sm"
                  className="shrink-0 gap-1.5 bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
                  title={`See ${r.competitor}'s keywords`}
                >
                  <Swords className="size-4" /> See keywords
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-destructive transition-colors hover:bg-destructive/10 hover:text-destructive"
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
    </Card>
  )
}
