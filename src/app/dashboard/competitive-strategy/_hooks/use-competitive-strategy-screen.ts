"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { errorMessage } from "@/lib/api/client"
import { opportunityApi, type CompetitorAnalytics, type StrategyScope } from "@/lib/api/opportunity"
import { queryKeys } from "@/lib/query/keys"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

/**
 * Competitive Strategy page data (TanStack Query, cached per website):
 * - strategy: the SERP footprint for the chosen scope (previous scope stays on
 *   screen while the next loads);
 * - analytics: stored whole-site competitor analytics (DB only). Fetching new
 *   analytics is a paid DataForSEO call, so it only happens on a click
 *   (refreshAnalytics) — never automatically.
 */
export function useCompetitiveStrategyScreen(initialCompetitor: string | null = null) {
  // The workspace + website picked in the top bar (context only — no extra API calls).
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const activeDomainId = activeDomain?.id ?? null
  const wid = workspaceId ?? ""
  const domainId = activeDomainId ?? ""
  const ready = Boolean(workspaceId && activeDomainId)
  const qc = useQueryClient()

  // Whose footprint: your competitor list (auto) or every domain in your SERPs.
  const [scope, setScope] = React.useState<StrategyScope>("auto")
  // Domain open in the "Where competitors actually rank" card.
  const [rankedTarget, setRankedTarget] = React.useState<string | null>(initialCompetitor)

  const strategy = useQuery({
    queryKey: queryKeys.strategy(wid, domainId, scope),
    queryFn: () => opportunityApi.strategy(wid, domainId, scope),
    enabled: ready,
    placeholderData: keepPreviousData,
  })
  const data = strategy.data ?? null

  const analyticsQuery = useQuery({
    queryKey: queryKeys.competitorAnalytics(wid, domainId),
    queryFn: () => opportunityApi.competitorAnalytics(wid, domainId),
    enabled: ready && Boolean(data && data.competitors.length > 0),
  })

  // Paid (DataForSEO Labs): fetch whole-site analytics for missing / all competitors.
  const refresh = useMutation({
    mutationFn: (force: boolean) => opportunityApi.refreshCompetitorAnalytics(wid, domainId, { force }),
    onSuccess: (res: CompetitorAnalytics) => qc.setQueryData(queryKeys.competitorAnalytics(wid, domainId), res),
  })
  const refreshAnalytics = React.useCallback((force: boolean) => {
    if (ready) refresh.mutate(force)
  }, [ready, refresh])

  const analyticsError = refresh.isError
    ? errorMessage(refresh.error, "Refresh failed. Please try again.")
    : refresh.data?.refresh?.failed.length
      ? `Could not fetch: ${refresh.data.refresh.failed.join(", ")}`
      : analyticsQuery.isError ? errorMessage(analyticsQuery.error, "Could not load competitor analytics.") : null

  const coverage = data && data.total_keywords
    ? Math.round((data.our_ranked / data.total_keywords) * 100) : 0

  return {
    workspaceId, domainId, data, loading: strategy.isFetching, coverage,
    analytics: analyticsQuery.data ?? null, analyticsLoading: analyticsQuery.isFetching,
    refreshing: refresh.isPending, analyticsError, refreshAnalytics,
    rankedTarget, setRankedTarget, scope, setScope,
  }
}
