"use client"

/**
 * Content Optimization (TanStack Query, per workspace): server-paged session
 * history, saved sessions (never change → cached forever), the keyword picker
 * for a page, and the run mutation.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { contentOptApi, type ContentOptRunInput, type ContentOptSession } from "@/lib/api/content-opt"
import { queryKeys } from "@/lib/query/keys"

export const SESSIONS_PAGE_SIZE = 8

export function useContentSessions(wid: string | null, page: number, q: string) {
  return useQuery({
    queryKey: queryKeys.contentOpt.sessions(wid ?? "", page, q),
    queryFn: () => contentOptApi.sessions(wid!, { page, pageSize: SESSIONS_PAGE_SIZE, q }),
    enabled: Boolean(wid),
    placeholderData: keepPreviousData,
  })
}

/** One saved session (a finished run never changes). */
export function useContentSession(wid: string | null, id: string | null) {
  return useQuery({
    queryKey: queryKeys.contentOpt.session(wid ?? "", id ?? ""),
    queryFn: () => contentOptApi.session(wid!, id!),
    enabled: Boolean(wid && id),
    staleTime: Infinity,
  })
}

/** Keywords to optimize a page for (ranks-for / tracked / website keywords). */
export function useKeywordOptions(wid: string | null, did: string | null, url: string) {
  return useQuery({
    queryKey: queryKeys.contentOpt.keywordOptions(wid ?? "", did ?? "", url),
    queryFn: () => contentOptApi.keywordOptions(wid!, { domain_id: did!, url: url || undefined }),
    enabled: Boolean(wid && did),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })
}

/** Run: the new session is cached and the history list refetched. */
export function useRunContentOptimization(wid: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ContentOptRunInput) => contentOptApi.run(wid!, input),
    onSuccess: (s: ContentOptSession) => {
      if (!wid) return
      qc.setQueryData(queryKeys.contentOpt.session(wid, s.id), s)
      void qc.invalidateQueries({ queryKey: [...queryKeys.contentOpt.all(wid), "sessions"] })
      void qc.invalidateQueries({ queryKey: queryKeys.pages.all(wid) }) // a new page-history snapshot
    },
  })
}
