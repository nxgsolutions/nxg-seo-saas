"use client"

/**
 * Competitive Strategy page data (TanStack Query, cached per website):
 *  - analytics: current whole-site competitor metrics (traffic share donut);
 *  - history: per-competitor estimated-traffic / ranking-keyword trend;
 *  - strategy: our SERP footprint — common vs gap keywords per competitor
 *    (Gap & Overlap view).
 *
 * Both are DB-only reads (no paid DataForSEO call). New analytics are fetched
 * from the Competitor Keywords page via its "Refresh" action; this page only
 * visualizes what is already stored.
 */
import { keepPreviousData, useQuery } from "@tanstack/react-query"

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

  return {
    ready,
    analytics: analytics.data ?? null,
    history: history.data ?? null,
    strategy: strategy.data ?? null,
    loading: analytics.isLoading || history.isLoading || strategy.isLoading,
    error:
      analytics.isError
        ? errorMessage(analytics.error, "Could not load competitor analytics.")
        : history.isError
          ? errorMessage(history.error, "Could not load the competitor trend.")
          : strategy.isError
            ? errorMessage(strategy.error, "Could not load the keyword gap data.")
            : null,
  }
}
