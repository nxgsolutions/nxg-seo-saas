"use client"

/** Mutations behind the keyword "+" menu. Each refreshes the cached data it changes. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { myKeywordsApi } from "@/lib/api/my-keywords"
import { rankingsApi } from "@/lib/api/rankings"
import { queryKeys } from "@/lib/query/keys"

/** Saved keywords of the website (normalized) — to show "Saved" in menus. */
export function useSavedKeywordKeys(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: queryKeys.myKeywords.keys(wid ?? "", did ?? ""),
    queryFn: () => myKeywordsApi.keys(wid!, did!),
    enabled: Boolean(wid && did),
    staleTime: 60_000,
    select: (keys) => new Set(keys),
  })
}

/** Save to My Keywords (idempotent: `created` is false if it was already saved). */
export function useSaveKeyword(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { keyword: string; country?: string; language?: string; source?: string }) =>
      myKeywordsApi.save(wid!, did!, v.keyword, { country: v.country, language: v.language, source: v.source }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myKeywords.all(wid ?? "", did ?? "") }),
  })
}

/** Remove from My Keywords. */
export function useRemoveSavedKeyword(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => myKeywordsApi.remove(wid!, did!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myKeywords.all(wid ?? "", did ?? "") }),
  })
}

/** Start rank tracking for a keyword (409 = already tracked). Refreshes Rank Tracking + My Keywords. */
export function useAddToRankTracking(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (keyword: string) => rankingsApi.addKeyword(wid!, did!, keyword),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.rankings(wid ?? "", did ?? "") })
      void qc.invalidateQueries({ queryKey: queryKeys.myKeywords.all(wid ?? "", did ?? "") })
    },
  })
}
