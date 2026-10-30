"use client"

import { CompetitorRankChart } from "@/components/charts/lazy"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  useCompetitorHistory,
  useRefreshCompetitorRanks,
} from "@/hooks/api/use-competitors"
import { errorMessage } from "@/lib/api/client"
import { Loader2, RefreshCw, TrendingUp } from "lucide-react"
import * as React from "react"

export function CompetitorRankTrendPanel({ domainId }: { domainId: string }) {
  const { activeWorkspace } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const did = domainId || null
  const history = useCompetitorHistory(workspaceId, did)
  const refreshMutation = useRefreshCompetitorRanks(workspaceId, did)
  const data = history.data ?? null
  const loading = history.isPending && Boolean(did)
  const refreshing = refreshMutation.isPending
  const note = refreshMutation.data?.message ?? null
  const error = refreshMutation.isError
    ? errorMessage(refreshMutation.error, "Could not refresh competitors.")
    : history.isError
      ? errorMessage(history.error, "Could not load rank history.")
      : null

  function refresh() {
    if (workspaceId && did) refreshMutation.mutate()
  }

  const hasSeries = !!data && data.competitors.length > 0

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="size-4 text-primary" /> Rank changes over
            time
          </CardTitle>
          <CardDescription>
            Average Google position per competitor across your keywords (lower
            is better).
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={refreshing || !domainId}
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}{" "}
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : loading ? (
          <div className="space-y-2" role="status" aria-busy="true">
            <span className="sr-only">Loading rank history…</span>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : hasSeries ? (
          <>
            <CompetitorRankChart data={data!} />
            {note ? (
              <p className="mt-2 text-xs text-muted-foreground">{note}</p>
            ) : null}
          </>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No rank history yet. Click{" "}
            <span className="font-medium">Refresh</span> to capture the first
            snapshot — ranks come from the Google results saved for your
            keywords.
            {note ? <p className="mt-2 text-xs">{note}</p> : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
