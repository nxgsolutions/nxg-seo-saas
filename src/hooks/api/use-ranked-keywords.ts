"use client"

/**
 * Competitive Strategy → "Where competitors actually rank" (TanStack Query).
 * Reads are DB-only (free). `useRankedRefresh` is the one paid action; after
 * it (or adding a competitor) the affected caches are refreshed.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { competitorsApi } from "@/lib/api/competitors"
import { rankedKeywordsApi, type RankedFilters, type RankedScope } from "@/lib/api/opportunity"
import type { ListParams } from "@/lib/api/pagination"
import { queryKeys } from "@/lib/query/keys"

export function useRankedOptions(wid: string, did: string) {
  return useQuery({
    queryKey: queryKeys.rankedKeywords.options(wid, did),
    queryFn: () => rankedKeywordsApi.options(wid, did),
  })
}

/** One page of a domain's ranked keywords (previous page kept on screen while the next loads). */
export function useRankedKeywords(wid: string, did: string, target: string | null, scope: RankedScope | null,
  list: ListParams, filters: RankedFilters) {
  return useQuery({
    queryKey: [...queryKeys.rankedKeywords.detail(wid, did, target ?? "", scope), list, filters],
    queryFn: () => rankedKeywordsApi.get(wid, did, target!, scope, list, filters),
    enabled: Boolean(target),
    placeholderData: keepPreviousData,
  })
}

/** All cached pages/scopes of every domain + the options list (after new data is stored). */
function useInvalidateRanked(wid: string, did: string) {
  const qc = useQueryClient()
  return () => Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.rankedKeywords.options(wid, did) }),
    qc.invalidateQueries({ queryKey: ["ws", wid, "domain", did, "ranked-keywords"] }),
    qc.invalidateQueries({ queryKey: queryKeys.competitors(wid, did) }),
  ])
}

/** Paid: fetch / refresh a domain's ranked keywords (DataForSEO Labs), then reload from the DB. */
export function useRankedRefresh(wid: string, did: string) {
  const invalidate = useInvalidateRanked(wid, did)
  return useMutation({
    mutationFn: (v: { domain: string; force: boolean; scope: RankedScope; maxKeywords?: number }) =>
      rankedKeywordsApi.refresh(wid, did, v.domain, { force: v.force, scope: v.scope, maxKeywords: v.maxKeywords }),
    onSuccess: () => invalidate(),
  })
}

/** Size + cost of a scope before buying (one tiny request). */
export function useRankedEstimate(wid: string, did: string) {
  return useMutation({
    mutationFn: (v: { domain: string; scope: RankedScope }) => rankedKeywordsApi.estimate(wid, did, v.domain, v.scope),
  })
}

/** Add a domain to the competitor list (unlocks fetching it). */
export function useAddRankedCompetitor(wid: string, did: string) {
  const invalidate = useInvalidateRanked(wid, did)
  return useMutation({
    mutationFn: (domain: string) => competitorsApi.add(wid, did, domain),
    onSuccess: () => invalidate(),
  })
}
