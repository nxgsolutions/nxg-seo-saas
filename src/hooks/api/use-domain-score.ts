"use client"

/** Whole-site (domain) SEO score (TanStack Query, per domain): start a run, poll it, read it. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { domainScoreApi, type DomainScoreJob } from "@/lib/api/domain-score"
import { queryKeys } from "@/lib/query/keys"

/** Latest score + trend. Refetches while a run is in flight so the result fills in. */
export function useSiteScore(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: queryKeys.siteScore(wid ?? "", did ?? ""),
    queryFn: () => domainScoreApi.get(wid!, did!),
    enabled: Boolean(wid && did),
    refetchInterval: (query) => (query.state.data?.running ? 2500 : false),
  })
}

/** Job status for the live progress line. Polls every 2s only while running.
 *
 * It must NOT invalidate the view query here: invalidateQueries matches by
 * prefix, so invalidating the siteScore key would also invalidate this status
 * query (its child), and doing that inside refetchInterval creates an infinite
 * refetch loop. The view query (useSiteScore) self-resolves — it polls while a
 * run is in flight and the backend returns running:null + latest once done. */
export function useSiteScoreStatus(wid: string | null, did: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...queryKeys.siteScore(wid ?? "", did ?? ""), "status"],
    queryFn: () => domainScoreApi.status(wid!, did!),
    enabled: Boolean(wid && did) && enabled,
    refetchInterval: (query) => (query.state.data?.status === "running" ? 2000 : false),
  })
}

/** Start a run; seeds the status cache to 'running' so polling begins at once. */
export function useStartSiteScore(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => domainScoreApi.start(wid!, did!),
    onSuccess: (job: DomainScoreJob) => {
      qc.setQueryData([...queryKeys.siteScore(wid ?? "", did ?? ""), "status"], job)
      void qc.invalidateQueries({ queryKey: queryKeys.siteScore(wid ?? "", did ?? "") })
    },
  })
}
