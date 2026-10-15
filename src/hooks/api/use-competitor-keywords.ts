"use client"

/** Competitive Strategy → a competitor's common / gap keywords (one page at a time). */

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { opportunityApi, type CompetitorKeywordKind } from "@/lib/api/opportunity"
import type { ListParams } from "@/lib/api/pagination"
import { queryKeys } from "@/lib/query/keys"

export function useCompetitorKeywords(wid: string, did: string, competitor: string,
  kind: CompetitorKeywordKind, list: ListParams) {
  return useQuery({
    queryKey: [...queryKeys.competitorKeywords(wid, did, competitor, kind), list],
    queryFn: () => opportunityApi.competitorKeywords(wid, did, competitor, kind, list),
    placeholderData: keepPreviousData,
  })
}
