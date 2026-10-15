"use client"

/**
 * Page history (TanStack Query, per workspace): tracked pages (server-paged),
 * a page's timeline, its search performance, and reading a page's live tags.
 * Anything that fetches a page (audit, content run, inspect) refreshes these.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { pagesApi } from "@/lib/api/pages"
import { queryKeys } from "@/lib/query/keys"

export function useSitePages(wid: string | null, domainId: string | null, page: number, q: string,
  sort = "checked", pageSize = 20) {
  return useQuery({
    queryKey: [...queryKeys.pages.list(wid ?? "", domainId ?? "all", page, q, sort), pageSize],
    queryFn: () => pagesApi.list(wid!, { page, pageSize, q, sort, order: sort === "url" ? "asc" : "desc" }, domainId),
    enabled: Boolean(wid),
    placeholderData: keepPreviousData,
  })
}

export function usePageTimeline(wid: string | null, pageId: string | null) {
  return useQuery({
    queryKey: queryKeys.pages.timeline(wid ?? "", pageId ?? ""),
    queryFn: () => pagesApi.timeline(wid!, pageId!),
    enabled: Boolean(wid && pageId),
  })
}

/** Daily Search Console data (synced + stored on the server) and before/after per change. */
export function usePagePerformance(wid: string | null, pageId: string | null, days = 180) {
  return useQuery({
    queryKey: queryKeys.pages.performance(wid ?? "", pageId ?? "", days),
    queryFn: () => pagesApi.performance(wid!, pageId!, days),
    enabled: Boolean(wid && pageId),
    staleTime: 30 * 60_000, // Search Console updates daily
  })
}

/** Read a page's live title / meta / social tags (also stores a snapshot). */
export function useInspectPage(wid: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (url: string) => pagesApi.inspect(wid!, url),
    onSuccess: () => { if (wid) void qc.invalidateQueries({ queryKey: queryKeys.pages.all(wid) }) },
  })
}

/** Call after any tool fetched a page (audit / content run) so page history refreshes. */
export function useInvalidatePages(wid: string | null) {
  const qc = useQueryClient()
  return () => { if (wid) void qc.invalidateQueries({ queryKey: queryKeys.pages.all(wid) }) }
}
