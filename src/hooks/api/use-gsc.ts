"use client"

/**
 * Google Search Console (TanStack Query). The connection status is per
 * workspace and shared by every page that shows GSC data; performance reads
 * are free but hit Google, so they're cached for 5 minutes.
 */

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { gscApi } from "@/lib/api/gsc"
import type { ListParams } from "@/lib/api/pagination"

const gscKey = (wid: string) => ["ws", wid, "gsc"] as const
const GSC_STALE = 5 * 60_000

/** The default site-performance request (Overview tab, dashboard snapshot,
 * reports) — identical params so they all share ONE cached GSC call. */
export const GSC_FIRST_PAGE = { page: 1, pageSize: 25, sort: "clicks", order: "desc" } as const

/** Cache-sharing loaders for one-off actions (e.g. building a report). */
export const gscQueries = {
  status: (wid: string) => ({ queryKey: [...gscKey(wid), "status"], queryFn: () => gscApi.status(wid) }),
  firstPage: (wid: string, did: string, days: number) => ({
    queryKey: [...gscKey(wid), "keywords", did, days, GSC_FIRST_PAGE],
    queryFn: () => gscApi.keywords(wid, did, days, GSC_FIRST_PAGE),
    staleTime: GSC_STALE,
  }),
}

export function useGscStatus(wid: string | null) {
  return useQuery({
    ...gscQueries.status(wid ?? ""),
    enabled: Boolean(wid),
  })
}

/** Site performance: totals + trend + ONE page of keywords. */
export function useGscKeywords(wid: string | null, did: string | null, days: number, list: ListParams, enabled = true) {
  return useQuery({
    queryKey: [...gscKey(wid ?? ""), "keywords", did, days, list],
    queryFn: () => gscApi.keywords(wid!, did!, days, list),
    enabled: enabled && Boolean(wid && did),
    placeholderData: keepPreviousData,
    staleTime: GSC_STALE,
  })
}

/** One page's performance (Page Audit panel). */
export function useGscPage(wid: string | null, did: string | null, url: string, days: number, enabled = true) {
  return useQuery({
    queryKey: [...gscKey(wid ?? ""), "page", did, url, days],
    queryFn: () => gscApi.page(wid!, did!, url, days),
    enabled: enabled && Boolean(wid && did && url),
    staleTime: GSC_STALE,
  })
}

/** Start the Google OAuth flow (redirects the browser). */
export function useConnectGsc(wid: string | null) {
  return useMutation({
    mutationFn: (returnPath: string) => gscApi.connect(wid!, returnPath),
    onSuccess: ({ auth_url }) => { window.location.href = auth_url },
  })
}

export function useDisconnectGsc(wid: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => gscApi.disconnect(wid!),
    onSuccess: () => qc.invalidateQueries({ queryKey: gscKey(wid ?? "") }),
  })
}
