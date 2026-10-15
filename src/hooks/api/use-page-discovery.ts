"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  pageDiscoveryApi,
  type DiscoveryRun,
  type PageFilters,
  type ScoreContentInput,
} from "@/lib/api/page-discovery"
import type { ListParams } from "@/lib/api/pagination"
import { queryKeys } from "@/lib/query/keys"

/** Latest scan status. Polls every 2s while a scan is running. */
export function usePageDiscoveryStatus(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: [...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "status"],
    queryFn: () => pageDiscoveryApi.status(wid!, did!),
    enabled: Boolean(wid && did),
    refetchInterval: (query) => (query.state.data?.status === "running" ? 2000 : false),
  })
}

/** KPI totals + type breakdown. Refetches while a scan is running so it fills in live. */
export function usePageDiscoverySummary(wid: string | null, did: string | null, running: boolean) {
  return useQuery({
    queryKey: [...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "summary"],
    queryFn: () => pageDiscoveryApi.summary(wid!, did!),
    enabled: Boolean(wid && did),
    refetchInterval: running ? 2500 : false,
  })
}

/** One page of discovered pages. */
export function useDiscoveredPages(
  wid: string | null, did: string | null, filters: PageFilters, list: ListParams, running: boolean,
) {
  return useQuery({
    queryKey: [...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "list", filters, list],
    queryFn: () => pageDiscoveryApi.list(wid!, did!, list, filters),
    enabled: Boolean(wid && did),
    placeholderData: keepPreviousData,
    refetchInterval: running ? 2500 : false,
  })
}

/** Start a scan; seeds the status cache to 'running' so polling begins immediately. */
export function useDiscoverPages(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (allowCrawl: boolean = false) => pageDiscoveryApi.discover(wid!, did!, allowCrawl),
    onSuccess: (run: DiscoveryRun) => {
      qc.setQueryData([...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "status"], run)
    },
  })
}

/** Stop a running scan; writes the returned run into the status cache so polling stops. */
export function useCancelDiscovery(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => pageDiscoveryApi.cancel(wid!, did!),
    onSuccess: (run: DiscoveryRun | null) => {
      if (run) qc.setQueryData([...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "status"], run)
    },
  })
}

/** A page's editable content (cached server-side). Never auto-refetches, so a
 * draft the user is editing is seeded once and never silently overwritten. */
export function usePageContent(wid: string | null, did: string | null, pageId: string | null) {
  return useQuery({
    queryKey: [...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "content", pageId],
    queryFn: () => pageDiscoveryApi.content(wid!, did!, pageId!, false),
    enabled: Boolean(wid && did && pageId),
    staleTime: Infinity,
    gcTime: 0,
  })
}

/** Re-fetch a page's live content (refresh=true) and replace the cached copy. */
export function useRefetchPageContent(wid: string | null, did: string | null, pageId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => pageDiscoveryApi.content(wid!, did!, pageId!, true),
    onSuccess: (data) =>
      qc.setQueryData([...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "content", pageId], data),
  })
}

/** Live, deterministic SEO score for the edited draft (no AI). Keyed on a
 * debounced snapshot so it recomputes only when the user pauses, and keeps the
 * previous result on screen while recomputing (no blank/flicker between edits). */
export function useContentScore(
  wid: string | null,
  did: string | null,
  pageId: string | null,
  scoreKey: string,
  body: ScoreContentInput,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "score", pageId, scoreKey],
    queryFn: () => pageDiscoveryApi.scoreContent(wid!, did!, pageId!, body),
    enabled: Boolean(wid && did && pageId) && enabled,
    placeholderData: keepPreviousData,
    staleTime: Infinity,
    gcTime: 0,
  })
}
