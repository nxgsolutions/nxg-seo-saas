"use client"

/**
 * Backlinks (TanStack Query, per website). Reads are saved data only; the
 * Fetch / Refresh buttons are the paid DataForSEO calls (click-only).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { backlinksApi, type BacklinkList } from "@/lib/api/backlinks"

const scope = (wid: string, did: string) => ["ws", wid, "domain", did, "backlinks"] as const

export function useBacklinkOptions(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: [...scope(wid ?? "", did ?? ""), "options"],
    queryFn: () => backlinksApi.options(wid!, did!),
    enabled: Boolean(wid && did),
  })
}

/** Saved profile for `target` (null = your own site). */
export function useBacklinkProfile(wid: string | null, did: string | null, target: string | null) {
  return useQuery({
    queryKey: [...scope(wid ?? "", did ?? ""), "profile", target ?? ""],
    queryFn: () => backlinksApi.profile(wid!, did!, target),
    enabled: Boolean(wid && did),
  })
}

/** Breakdowns + fetch history + changes since the previous fetch (saved data). */
export function useBacklinkDetails(wid: string | null, did: string | null, target: string | null, enabled = true) {
  return useQuery({
    queryKey: [...scope(wid ?? "", did ?? ""), "details", target ?? ""],
    queryFn: () => backlinksApi.details(wid!, did!, target),
    enabled: Boolean(wid && did) && enabled,
  })
}

/** One server-side page of a saved list (keeps the previous page on screen while loading). */
export function useBacklinkRows<L extends BacklinkList>(wid: string | null, did: string | null, list: L, target: string | null,
  p: { page: number; pageSize: number; q: string; sort: string | null; desc: boolean }, filter: string, enabled = true) {
  return useQuery({
    queryKey: [...scope(wid ?? "", did ?? ""), "rows", target ?? "", list, filter, p.page, p.pageSize, p.q, p.sort, p.desc],
    queryFn: () => backlinksApi.rows(wid!, did!, list, target,
      { page: p.page, pageSize: p.pageSize, q: p.q, sort: p.sort, order: p.desc ? "desc" : "asc" }, filter),
    enabled: Boolean(wid && did) && enabled,
    // Keep the previous page on screen only within the SAME list + domain — another
    // list's rows have a different shape (and would render in the wrong table).
    placeholderData: (prev, prevQuery) => {
      const k = prevQuery?.queryKey
      return k && k[6] === (target ?? "") && k[7] === list ? prev : undefined
    },
  })
}

/** Paid: fetch / refresh a profile, then show it and refresh the domain picker. */
export function useRefreshBacklinkProfile(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { target: string | null; force: boolean }) => backlinksApi.refreshProfile(wid!, did!, v.target, v.force),
    onSuccess: (data, v) => {
      qc.setQueryData([...scope(wid ?? "", did ?? ""), "profile", v.target ?? ""], data)
      // New saved data → details and every list page for this domain are stale.
      void qc.invalidateQueries({ queryKey: [...scope(wid ?? "", did ?? ""), "details", v.target ?? ""] })
      void qc.invalidateQueries({ queryKey: [...scope(wid ?? "", did ?? ""), "rows", v.target ?? ""] })
      void qc.invalidateQueries({ queryKey: [...scope(wid ?? "", did ?? ""), "options"] })
    },
  })
}

export function useLinkGap(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: [...scope(wid ?? "", did ?? ""), "gap"],
    queryFn: () => backlinksApi.gap(wid!, did!),
    enabled: Boolean(wid && did),
  })
}

/** Paid: fetch / refresh the link gap. */
export function useRefreshLinkGap(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (force: boolean) => backlinksApi.refreshGap(wid!, did!, force),
    onSuccess: (data) => qc.setQueryData([...scope(wid ?? "", did ?? ""), "gap"], data),
  })
}

/** Overview dashboard analytics (saved data). */
export function useBacklinkAnalytics(wid: string | null, did: string | null, target: string | null, enabled = true) {
  return useQuery({
    queryKey: [...scope(wid ?? "", did ?? ""), "analytics", target ?? ""],
    queryFn: () => backlinksApi.analytics(wid!, did!, target),
    enabled: Boolean(wid && did) && enabled,
  })
}

type DetailParams = { page: number; pageSize: number; q: string; sort: string | null; desc: boolean }
const listP = (p: DetailParams) => ({ page: p.page, pageSize: p.pageSize, q: p.q, sort: p.sort, order: p.desc ? "desc" as const : "asc" as const })

/** One referring site's links to you (saved subset; complete after Load all links). */
export function useSiteDetail(wid: string | null, did: string | null, host: string | null, target: string | null, p: DetailParams) {
  return useQuery({
    queryKey: [...scope(wid ?? "", did ?? ""), "site", target ?? "", host ?? "", p.page, p.pageSize, p.q, p.sort, p.desc],
    queryFn: () => backlinksApi.siteDetail(wid!, did!, host!, target, listP(p)),
    enabled: Boolean(wid && did && host),
  })
}

/** Every site linking to one page (saved subset; complete after Load all links). */
export function usePageDetail(wid: string | null, did: string | null, url: string | null, target: string | null, p: DetailParams) {
  return useQuery({
    queryKey: [...scope(wid ?? "", did ?? ""), "page", target ?? "", url ?? "", p.page, p.pageSize, p.q, p.sort, p.desc],
    queryFn: () => backlinksApi.pageDetail(wid!, did!, url!, target, listP(p)),
    enabled: Boolean(wid && did && url),
  })
}

/** Paid: fetch every link from one referring site, then refresh its detail. */
export function useRefreshSiteDetail(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { host: string; target: string | null; force: boolean }) => backlinksApi.refreshSite(wid!, did!, v.host, v.target, v.force),
    onSuccess: (_d, v) => void qc.invalidateQueries({ queryKey: [...scope(wid ?? "", did ?? ""), "site", v.target ?? "", v.host] }),
  })
}

/** Paid: fetch every link pointing at one page, then refresh its detail. */
export function useRefreshPageDetail(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { url: string; target: string | null; force: boolean }) => backlinksApi.refreshPage(wid!, did!, v.url, v.target, v.force),
    onSuccess: (_d, v) => void qc.invalidateQueries({ queryKey: [...scope(wid ?? "", did ?? ""), "page", v.target ?? "", v.url] }),
  })
}
