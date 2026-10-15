"use client"

/**
 * Keyword Breakdown panel data (TanStack Query). All reads are free: stored
 * SERP + metrics, the Google Ads monthly trend, and your competitor list.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { competitorsApi } from "@/lib/api/competitors"
import { keywordPlannerApi, type PlannerRow } from "@/lib/api/keyword-planner"
import { serpApi } from "@/lib/api/serp"
import { queryKeys } from "@/lib/query/keys"

/** Stored SERP + keyword metrics (DB only). */
export function useKeywordBreakdown(wid: string | null, keyword: string, country: string, language: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.keywordBreakdown(wid ?? "", keyword, country, language),
    queryFn: () => serpApi.breakdown(wid!, keyword, country, language),
    enabled: enabled && Boolean(wid),
  })
}

/** Monthly volume trend + Ads metrics for one keyword (free Google Ads Keyword Planner). */
export function usePlannerHistory(keyword: string, country: string, language: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.keywordPlannerHistory(keyword, country, language),
    queryFn: () => keywordPlannerApi.history(keyword, country, language),
    enabled,
    staleTime: 30 * 60_000,
    select: (d): { row?: PlannerRow; note?: string } => ({
      row: d.rows.find((r) => r.keyword.toLowerCase() === keyword.toLowerCase()) ?? (d.rows.length === 1 ? d.rows[0] : undefined),
      note: d.configured ? undefined : "Connect Google Ads Keyword Planner to see the monthly trend.",
    }),
  })
}

/** Hosts in your competitor list (for "competitor" tags / "Add to my competitors"). */
export function useCompetitorHosts(wid: string | null, did: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.competitors(wid ?? "", did ?? ""),
    queryFn: () => competitorsApi.list(wid!, did!),
    enabled: enabled && Boolean(wid && did),
    select: (d) => new Set(d.rows.map((c) => c.competitor)),
  })
}

export function useAddCompetitor(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (host: string) => competitorsApi.add(wid!, did!, host),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.competitors(wid ?? "", did ?? "") }),
  })
}
