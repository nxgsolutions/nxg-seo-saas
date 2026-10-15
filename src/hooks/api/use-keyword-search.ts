"use client"

/**
 * Keyword Analysis data (TanStack Query).
 * - useRecentKeywordSearches: the workspace's saved keyword searches.
 * - useKeywordSearch: one saved search (immutable once stored → cached).
 * - useKeywordResults: ONE page of a search's results (server-side filter/sort/
 *   pagination); the previous page stays on screen while the next loads.
 * - useKeywordPoints: slim points for the opportunity map.
 * - useRunKeywordSearch: run a new search; the result is put straight into the
 *   cache and the recent list is refreshed.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { keywordSearchApi, type ResearchDetail } from "@/lib/api/keyword-search"
import type { ListParams } from "@/lib/api/pagination"
import { queryKeys } from "@/lib/query/keys"

export function useRecentKeywordSearches(wid: string | null) {
  return useQuery({
    queryKey: queryKeys.keywordSearch.recent(wid ?? ""),
    queryFn: () => keywordSearchApi.searches(wid!, "keyword"),
    enabled: Boolean(wid),
  })
}

export function useKeywordSearch(wid: string | null, id: string | null) {
  return useQuery({
    queryKey: queryKeys.keywordSearch.detail(wid ?? "", id ?? ""),
    queryFn: () => keywordSearchApi.search(wid!, id!),
    enabled: Boolean(wid && id),
    // A stored search never changes; keep it for the whole session.
    staleTime: Infinity,
  })
}

export interface KeywordResultsParams extends ListParams {
  category: string
  intent: string
}

export function useKeywordResults(wid: string | null, id: string | null, params: KeywordResultsParams) {
  const { category, intent, ...list } = params
  return useQuery({
    queryKey: [...queryKeys.keywordSearch.detail(wid ?? "", id ?? ""), "results", params],
    queryFn: () => keywordSearchApi.results(wid!, id!, list, { category, intent }),
    enabled: Boolean(wid && id),
    placeholderData: keepPreviousData,
    staleTime: Infinity, // a saved search never changes
  })
}

export function useKeywordPoints(wid: string | null, id: string | null) {
  return useQuery({
    queryKey: [...queryKeys.keywordSearch.detail(wid ?? "", id ?? ""), "points"],
    queryFn: () => keywordSearchApi.points(wid!, id!),
    enabled: Boolean(wid && id),
    staleTime: Infinity,
  })
}

export function useRunKeywordSearch(wid: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { seed: string; country: string; language: string }) =>
      keywordSearchApi.run(wid!, v.seed, v.country, v.language),
    onSuccess: (detail: ResearchDetail) => {
      if (!wid) return
      qc.setQueryData(queryKeys.keywordSearch.detail(wid, detail.id), detail)
      void qc.invalidateQueries({ queryKey: queryKeys.keywordSearch.recent(wid) })
    },
  })
}
