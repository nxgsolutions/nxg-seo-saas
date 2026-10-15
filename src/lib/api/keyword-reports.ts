/**
 * Keyword reports — read-only analyses (GSC + Ads). Domain-scoped.
 */
import { apiClient } from "./client"
import { listParams, type ListParams, type PageInfo } from "./pagination"

export interface StrikingDistanceRow {
  keyword: string
  position: number
  impressions: number
  clicks: number
  ctr: number
  volume: number | null
  intent: string
  opportunity: number
}

export interface StrikingDistancePoint {
  keyword: string
  position: number
  impressions: number
  volume: number | null
  opportunity: number
}

export interface StrikingDistanceResponse {
  connected: boolean
  message: string | null
  site_url: string
  days: number
  count: number
  /** ONE page (see pagination). */
  rows: StrikingDistanceRow[]
  pagination: PageInfo | null
  /** Every matching keyword, slim — for the chart. */
  points: StrikingDistancePoint[]
}

export interface CompetitorGapRow {
  keyword: string
  volume: number | null
  intent: string
  difficulty: number
  your_position: number | null
}

export interface CompetitorGapResponse {
  configured: boolean
  message: string | null
  competitor: string
  gsc_connected: boolean
  count: number
  rows: CompetitorGapRow[]
}

export interface CompetitorDomainRow {
  competitor: string
  keywords_shared: number
  avg_position: number
  best_position: number
  keywords: string[]
}

export interface CompetitorDomainsResponse {
  domain: string
  country: string
  count: number
  rows: CompetitorDomainRow[]
}

export const keywordReportsApi = {
  competitorDomains: (
    wid: string,
    did: string,
    opts: { country?: string; language?: string; minShared?: number } = {}
  ) => {
    const q = new URLSearchParams({
      country: opts.country ?? "in",
      language: opts.language ?? "en",
      min_shared: String(opts.minShared ?? 1),
    })
    return apiClient.get<CompetitorDomainsResponse>(
      `/api/workspaces/${wid}/domains/${did}/competitors?${q}`
    )
  },

  /** ONE page of quick wins (GSC #4-20) + slim `points` for the chart.
   * sort: opportunity | position | impressions | clicks | volume | keyword */
  strikingDistance: (
    wid: string,
    did: string,
    opts: { days?: number; country?: string; language?: string; minImpressions?: number; minVolume?: number } = {},
    list: ListParams = {},
  ) =>
    apiClient.get<StrikingDistanceResponse>(`/api/workspaces/${wid}/domains/${did}/striking-distance`, {
      params: listParams(list, {
        days: opts.days ?? 90, country: opts.country ?? "in", language: opts.language ?? "en",
        min_impressions: opts.minImpressions ?? 1, min_volume: opts.minVolume ?? 0,
      }),
    }),

  competitorGap: (
    wid: string,
    did: string,
    competitor: string,
    opts: { country?: string; language?: string; minVolume?: number; gapsOnly?: boolean } = {}
  ) => {
    const q = new URLSearchParams({
      competitor,
      country: opts.country ?? "in",
      language: opts.language ?? "en",
      min_volume: String(opts.minVolume ?? 10),
      gaps_only: String(opts.gapsOnly ?? true),
    })
    return apiClient.get<CompetitorGapResponse>(
      `/api/workspaces/${wid}/domains/${did}/competitor-gap?${q}`
    )
  },
}
