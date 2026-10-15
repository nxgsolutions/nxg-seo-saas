"use client"

/**
 * Action Plan tabs besides the plan itself (TanStack Query, cached per website):
 * Quick Wins (Search Console #4–20, one page at a time) and Tracked Keywords
 * (overview, trend, keyword list, pages).
 */

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { keywordReportsApi } from "@/lib/api/keyword-reports"
import { opportunityApi, type KeywordQuery } from "@/lib/api/opportunity"
import type { ListParams } from "@/lib/api/pagination"
import { queryKeys } from "@/lib/query/keys"

const opp = queryKeys.opportunity

/** One page of quick wins + every keyword's chart point. GSC is free but slow-ish → cached 5 min. */
export function useQuickWins(wid: string, did: string, minVolume: number, list: ListParams) {
  const { activeCountry, activeLanguage } = useDashboard()
  return useQuery({
    queryKey: [...opp(wid, did), "quick-wins", activeCountry, activeLanguage, minVolume, list],
    queryFn: () => keywordReportsApi.strikingDistance(
      wid, did, { country: activeCountry, language: activeLanguage, minVolume }, list),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })
}

/** Tracked keyword list (server-side search / filter / sort / paging). */
export function useOpportunityKeywords(wid: string, did: string, params: KeywordQuery) {
  return useQuery({
    queryKey: [...opp(wid, did), "keywords", params],
    queryFn: () => opportunityApi.keywords(wid, did, params),
    placeholderData: keepPreviousData,
  })
}

/** Overview tiles + volume change + metric trend, loaded together. */
export function useOpportunityOverview(wid: string, did: string) {
  return useQuery({
    queryKey: [...opp(wid, did), "overview"],
    queryFn: async () => {
      const [overview, change, trend] = await Promise.all([
        opportunityApi.overview(wid, did), opportunityApi.change(wid, did), opportunityApi.trend(wid, did),
      ])
      return { overview, series: change.series, points: trend.points }
    },
  })
}

export function useOpportunityPages(wid: string, did: string) {
  return useQuery({
    queryKey: [...opp(wid, did), "pages"],
    queryFn: () => opportunityApi.pages(wid, did),
  })
}
