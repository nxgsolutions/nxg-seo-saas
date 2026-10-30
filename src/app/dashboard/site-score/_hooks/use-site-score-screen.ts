"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useSiteScore, useSiteScoreStatus, useStartSiteScore } from "@/hooks/api/use-domain-score"
import { errorMessage } from "@/lib/api/client"
import * as React from "react"

/** Whole-site score state for the active website: start a run, track progress, read the result. */
export function useSiteScoreScreen() {
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const domainId = activeDomain?.id ?? null

  const viewQuery = useSiteScore(workspaceId, domainId)
  const view = viewQuery.data ?? null
  const latest = view?.latest ?? null

  const startMutation = useStartSiteScore(workspaceId, domainId)
  const statusQuery = useSiteScoreStatus(workspaceId, domainId, Boolean(workspaceId && domainId))
  const job = statusQuery.data ?? view?.running ?? null

  const running = Boolean(view?.running) || job?.status === "running" || startMutation.isPending
  const jobError = job?.status === "error" ? job.error : null

  const [error, setError] = React.useState<string | null>(null)

  function start() {
    setError(null)
    if (!workspaceId || !domainId) {
      setError("Pick a website first.")
      return
    }
    startMutation.mutate(undefined, { onError: (err) => setError(errorMessage(err)) })
  }

  // Distribution of the sampled page scores + the weakest pages first.
  const distribution = React.useMemo(() => {
    const pages = latest?.pages ?? []
    return {
      good: pages.filter((p) => p.score >= 80).length,
      needs: pages.filter((p) => p.score >= 50 && p.score < 80).length,
      poor: pages.filter((p) => p.score < 50).length,
    }
  }, [latest])
  const worstPages = React.useMemo(() => (latest?.pages ?? []).slice(0, 8), [latest])

  return {
    workspaceId, domainId, domainName: activeDomain?.domain ?? null,
    loading: viewQuery.isPending && Boolean(workspaceId && domainId),
    latest, history: view?.history ?? [], running, job, jobError,
    error, setError, start, starting: startMutation.isPending,
    distribution, worstPages,
  }
}
