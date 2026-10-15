"use client"

/** Rank Tracking (TanStack Query, per website): tracked keywords + their position history. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { rankingsApi } from "@/lib/api/rankings"
import { queryKeys } from "@/lib/query/keys"

export function useTrackedKeywords(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: queryKeys.rankings(wid ?? "", did ?? ""),
    queryFn: () => rankingsApi.keywords(wid!, did!),
    enabled: Boolean(wid && did),
  })
}

export function useRankEntries(wid: string | null, did: string | null, keywordId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.rankings(wid ?? "", did ?? ""), "entries", keywordId],
    queryFn: () => rankingsApi.entries(wid!, did!, keywordId!),
    enabled: Boolean(wid && did && keywordId),
  })
}

/** Every rank-tracking change refreshes the keyword list and its histories. */
function useRankingsMutation<V, R>(wid: string | null, did: string | null, fn: (v: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.rankings(wid ?? "", did ?? "") }),
  })
}

export const useAddTrackedKeyword = (wid: string | null, did: string | null) =>
  useRankingsMutation(wid, did, (term: string) => rankingsApi.addKeyword(wid!, did!, term))

export const useRemoveTrackedKeyword = (wid: string | null, did: string | null) =>
  useRankingsMutation(wid, did, (keywordId: string) => rankingsApi.removeKeyword(wid!, did!, keywordId))

export const useRecordPosition = (wid: string | null, did: string | null) =>
  useRankingsMutation(wid, did, (v: { keywordId: string; position: number | null; date: string }) =>
    rankingsApi.recordPosition(wid!, did!, v.keywordId, v.position, v.date))

/** Pull real positions from Google Search Console (free). */
export const useSyncGscPositions = (wid: string | null, did: string | null) =>
  useRankingsMutation(wid, did, () => rankingsApi.syncGsc(wid!, did!))

/** Start tracking the domain's top Search Console queries (free, one click). */
export const useImportGscKeywords = (wid: string | null, did: string | null) =>
  useRankingsMutation(wid, did, () => rankingsApi.importGsc(wid!, did!))

/** Pull positions from the domain's latest SERP snapshot (already-stored data, free). */
export const useSyncSerpPositions = (wid: string | null, did: string | null) =>
  useRankingsMutation(wid, did, () => rankingsApi.syncSerp(wid!, did!))
