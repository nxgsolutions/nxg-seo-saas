"use client"

/**
 * Competitive Strategy page data (TanStack Query, cached per website):
 *  - analytics: current whole-site competitor metrics (traffic share donut);
 *  - history: per-competitor estimated-traffic / ranking-keyword trend;
 *  - strategy: our SERP footprint — common vs gap keywords per competitor
 *    (Gap & Overlap view).
 *
 * The three queries are DB-only reads (no paid DataForSEO call). `refreshAnalytics`
 * is the one paid action: it fetches stale/missing whole-site metrics AND the
 * 12-month history from DataForSEO, stores them, then refetches both the
 * analytics and the trend so the graph fills in without a page reload.
 */
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import * as React from "react"

import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"
import { errorMessage } from "@/lib/api/client"
import { opportunityApi, type AnalyticsCountry } from "@/lib/api/opportunity"
import { queryKeys } from "@/lib/query/keys"

export function useCompetitiveStrategyData(country: AnalyticsCountry = "in") {
  const workspaceId = useActiveWorkspace()?.id ?? null
  const domainId = useActiveDomain()?.id ?? null
  const ready = Boolean(workspaceId && domainId)
  const wid = workspaceId ?? ""
  const did = domainId ?? ""
  const qc = useQueryClient()

  const analytics = useQuery({
    queryKey: [...queryKeys.competitorAnalytics(wid, did), country],
    queryFn: () => opportunityApi.competitorAnalytics(wid, did, country),
    enabled: ready,
    placeholderData: keepPreviousData,
  })

  const history = useQuery({
    queryKey: [...queryKeys.competitorAnalyticsHistory(wid, did), country],
    queryFn: () => opportunityApi.competitorAnalyticsHistory(wid, did, country),
    enabled: ready,
    placeholderData: keepPreviousData,
  })

  const strategy = useQuery({
    queryKey: queryKeys.strategy(wid, did, "auto"),
    queryFn: () => opportunityApi.strategy(wid, did, "auto"),
    enabled: ready,
  })

  // Paid (DataForSEO Labs): fetch whole-site metrics + 12-month history, then
  // refetch the analytics and trend so the charts fill in. `force` re-fetches
  // domains whose stored data is still fresh; `competitors` scopes the fetch to
  // a subset (e.g. only domains missing history) so stored data is reused.
  const refresh = useMutation({
    mutationFn: (args: { force: boolean; competitors?: string[] }) =>
      opportunityApi.refreshCompetitorAnalytics(wid, did, {
        country, force: args.force, competitors: args.competitors,
      }),
    onSuccess: () => {
      // Prefix-match invalidation covers the country-suffixed query keys.
      qc.invalidateQueries({ queryKey: queryKeys.competitorAnalytics(wid, did) })
      qc.invalidateQueries({ queryKey: queryKeys.competitorAnalyticsHistory(wid, did) })
    },
  })
  const refreshAnalytics = React.useCallback(
    (force: boolean, competitors?: string[]) => {
      if (ready) refresh.mutate({ force, competitors })
    },
    [ready, refresh],
  )
  // Awaitable variant — lets a confirm dialog show busy + close on success.
  const refreshAnalyticsAsync = React.useCallback(
    (force: boolean, competitors?: string[]) =>
      ready ? refresh.mutateAsync({ force, competitors }) : Promise.resolve(null),
    [ready, refresh],
  )

  return {
    ready,
    analytics: analytics.data ?? null,
    history: history.data ?? null,
    strategy: strategy.data ?? null,
    loading: analytics.isLoading || history.isLoading || strategy.isLoading,
    refreshAnalytics,
    refreshAnalyticsAsync,
    refreshing: refresh.isPending,
    error:
      refresh.isError
        ? errorMessage(refresh.error, "Could not fetch competitor metrics.")
        : analytics.isError
          ? errorMessage(analytics.error, "Could not load competitor analytics.")
          : history.isError
            ? errorMessage(history.error, "Could not load the competitor trend.")
            : strategy.isError
              ? errorMessage(strategy.error, "Could not load the keyword gap data.")
              : null,
  }
}
