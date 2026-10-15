"use client"

/**
 * Tracked Competitors (TanStack Query, per website). The list shares its cache
 * entry with the Keyword Breakdown's competitor tags. Any change to the list
 * refreshes every query of that website (strategy, ranked-keyword picks,
 * action plan) since they all depend on who your competitors are.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { competitorsApi } from "@/lib/api/competitors"
import { queryKeys } from "@/lib/query/keys"

const domainScope = (wid: string, did: string) => ["ws", wid, "domain", did] as const

export function useCompetitorList(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: queryKeys.competitors(wid ?? "", did ?? ""),
    queryFn: () => competitorsApi.list(wid!, did!),
    enabled: Boolean(wid && did),
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

/** AI competitor discovery (replaces the auto-found list; manual ones are kept). */
export function useDiscoverCompetitors(wid: string | null, did: string | null) {
  const invalidate = useInvalidateDomain(wid, did)
  return useMutation({
    mutationFn: (v: { targetDomain?: string; extraServices: string[] }) => competitorsApi.discover(wid!, did!, v),
    onSuccess: () => invalidate(),
  })
}

/** Rebuild competitor rank snapshots from your stored SERPs (no paid API). */
export function useRefreshCompetitorRanks(wid: string | null, did: string | null) {
  const invalidate = useInvalidateDomain(wid, did)
  return useMutation({
    mutationFn: () => competitorsApi.refresh(wid!, did!),
    onSuccess: () => invalidate(),
  })
}
