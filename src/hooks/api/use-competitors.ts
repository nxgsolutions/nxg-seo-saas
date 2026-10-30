"use client"

/**
 * Tracked Competitors (TanStack Query, per website). The list shares its cache
 * entry with the Keyword Breakdown's competitor tags. Any change to the list
 * refreshes every query of that website (strategy, ranked-keyword picks,
 * action plan) since they all depend on who your competitors are.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { competitorsApi, type DiscoveryJob } from "@/lib/api/competitors"
import { queryKeys } from "@/lib/query/keys"

const domainScope = (wid: string, did: string) => ["ws", wid, "domain", did] as const

export function useCompetitorList(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: queryKeys.competitors(wid ?? "", did ?? ""),
    queryFn: () => competitorsApi.list(wid!, did!),
    enabled: Boolean(wid && did),
  })
}

/** Business profile extracted from the site (first pass of AI discovery). */
export function useBusinessProfile(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: [...queryKeys.competitors(wid ?? "", did ?? ""), "business-profile"],
    queryFn: () => competitorsApi.businessProfile(wid!, did!),
    enabled: Boolean(wid && did),
  })
}

/** Re-run ONLY the business extraction for this website (competitors untouched). */
export function useRefreshBusinessProfile(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => competitorsApi.refreshBusinessProfile(wid!, did!),
    onSuccess: (data) => {
      qc.setQueryData(
        [...queryKeys.competitors(wid ?? "", did ?? ""), "business-profile"],
        data,
      )
    },
  })
}

/** Domains ranking for your keywords that aren't on the list yet (from your SERP data). */
export function useCompetitorSuggestions(wid: string | null, did: string | null) {
  const { activeCountry, activeLanguage } = useDashboard()
  return useQuery({
    queryKey: [...queryKeys.competitors(wid ?? "", did ?? ""), "suggestions", activeCountry, activeLanguage],
    queryFn: () => competitorsApi.suggestions(wid!, did!, { country: activeCountry, language: activeLanguage }),
    enabled: Boolean(wid && did),
  })
}

/** Average SERP position per competitor over time. */
export function useCompetitorHistory(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: [...queryKeys.competitors(wid ?? "", did ?? ""), "history"],
    queryFn: () => competitorsApi.history(wid!, did!),
    enabled: Boolean(wid && did),
  })
}

/** Shared by every competitor-list change: refresh all of this website's cached data. */
function useInvalidateDomain(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: domainScope(wid ?? "", did ?? "") })
}

export function useAddCompetitor(wid: string | null, did: string | null) {
  const invalidate = useInvalidateDomain(wid, did)
  return useMutation({
    mutationFn: (domain: string) => competitorsApi.add(wid!, did!, domain),
    onSuccess: () => invalidate(),
  })
}

export function useRemoveCompetitor(wid: string | null, did: string | null) {
  const invalidate = useInvalidateDomain(wid, did)
  return useMutation({
    mutationFn: (competitorId: string) => competitorsApi.remove(wid!, did!, competitorId),
    onSuccess: () => invalidate(),
  })
}

/**
 * AI competitor discovery as an async job with live step progress.
 *
 * `start()` kicks off the background run and returns immediately; this hook then
 * polls the job every ~1.5s and exposes the current step. When the job finishes
 * it invalidates the domain's cached data so the new competitor list + business
 * profile appear. Replaces the auto-found list (manual entries are kept).
 */
export function useDiscoverCompetitors(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  const invalidate = useInvalidateDomain(wid, did)
  const [jobId, setJobId] = React.useState<string | null>(null)

  const start = useMutation({
    mutationFn: (v: { targetDomain?: string; extraServices: string[] }) =>
      competitorsApi.discover(wid!, did!, v),
    onSuccess: (job) => setJobId(job.job_id),
  })

  const statusQuery = useQuery({
    queryKey: [...queryKeys.competitors(wid ?? "", did ?? ""), "discover-job", jobId],
    queryFn: () => competitorsApi.discoverStatus(wid!, did!, jobId!),
    enabled: Boolean(wid && did && jobId),
    refetchInterval: (q) =>
      (q.state.data as DiscoveryJob | undefined)?.status === "running" ? 1500 : false,
  })

  // When the run finishes, refresh the domain's data (list + profile) once.
  const job: DiscoveryJob | null = statusQuery.data ?? start.data ?? null
  const doneRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (job?.status === "done" && doneRef.current !== job.job_id) {
      doneRef.current = job.job_id
      invalidate()
    }
  }, [job?.status, job?.job_id, invalidate])

  const isRunning = start.isPending || job?.status === "running"
  const startError = start.isError ? "Couldn't start the search. Please try again." : null

  return {
    start: (v: { targetDomain?: string; extraServices: string[] }) => {
      doneRef.current = null
      start.mutate(v)
    },
    job,
    isRunning: Boolean(isRunning),
    isDone: job?.status === "done",
    error: startError ?? (job?.status === "error" ? job.error : null),
  }
}

/** Rebuild competitor rank snapshots from your stored SERPs (no paid API). */
export function useRefreshCompetitorRanks(wid: string | null, did: string | null) {
  const invalidate = useInvalidateDomain(wid, did)
  return useMutation({
    mutationFn: () => competitorsApi.refresh(wid!, did!),
    onSuccess: () => invalidate(),
  })
}
