"use client"

/**
 * Action Plan data (TanStack Query) — all DB-only.
 * - useActionPlan: Top 10, counts, sources.
 * - useActionItems: ONE page of a full list (improve | gap | target).
 * - useTrackKeyword: add to tracked keywords → refreshes the plan + lists.
 * - usePageInsight: your page vs competitor pages for one action (slow, cached).
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { actionPlanApi, pageInsightApi, type ActionItem, type ActionType } from "@/lib/api/opportunity"
import type { ListParams } from "@/lib/api/pagination"
import { queryKeys } from "@/lib/query/keys"

export function useActionPlan(wid: string, did: string) {
  return useQuery({
    queryKey: queryKeys.actionPlan(wid, did),
    queryFn: () => actionPlanApi.get(wid, did),
  })
}

export function useActionItems(wid: string, did: string, type: ActionType | null, list: ListParams) {
  return useQuery({
    queryKey: [...queryKeys.actionPlan(wid, did), "items", type, list],
    queryFn: () => actionPlanApi.items(wid, did, type!, list),
    enabled: type !== null,
    placeholderData: keepPreviousData,
  })
}

export function useTrackKeyword(wid: string, did: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (keyword: string) => actionPlanApi.track(wid, did, keyword),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.actionPlan(wid, did) }),
  })
}

export function usePageInsight(wid: string, did: string, item: ActionItem) {
  return useQuery({
    queryKey: queryKeys.pageInsight(wid, did, item.keyword, item.url ?? null, item.competitor_url ?? null),
    queryFn: () => pageInsightApi.get(wid, did, item.keyword, { url: item.url, competitorUrl: item.competitor_url }),
    staleTime: 10 * 60_000,
  })
}
