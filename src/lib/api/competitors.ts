/**
 * Competitors — dedicated tracking API (domain-scoped).
 *
 * Backed by /workspaces/{wid}/domains/{did}/competitors/* on the FastAPI
 * backend. Competitors and their SERP standing are derived from serp_snapshots;
 * `refresh` persists a dated real snapshot so `history` can render a
 * rank-change trend that fills in as the user refreshes over time.
 */
import { apiClient } from "./client"

export interface TrackedCompetitorRow {
  competitor: string
  keywords_shared: number
  avg_position: number
  best_position: number
  keywords: string[]
}

export interface TrackedCompetitorsResponse {
  domain: string
  country: string
  language: string
  count: number
  rows: TrackedCompetitorRow[]
}

export interface CompetitorHistoryPoint {
  captured_on: string
  avg_position: number
  best_position: number
  keywords_shared: number
}

export interface CompetitorHistorySeries {
  competitor: string
  points: CompetitorHistoryPoint[]
}

export interface CompetitorHistoryResponse {
  domain: string
  country: string
  language: string
  dates: string[]
  competitors: CompetitorHistorySeries[]
}

export interface CompetitorRefreshResponse {
  domain: string
  captured_on: string
  competitors_tracked: number
  message: string
}

export interface CuratedCompetitor {
  id: string
  competitor: string
  label: string | null
  source: "auto" | "manual" | "ai"
  reason: string | null
  confidence: string | null
  avg_position: number | null
  best_position: number | null
  keywords_shared: number | null
  last_captured_on: string | null
}

export interface CompetitorDiscoverResponse {
  domain: string
  target: string
  market: string
  count: number
  competitors: CuratedCompetitor[]
}

export interface CuratedCompetitorsResponse {
  domain: string
  count: number
  rows: CuratedCompetitor[]
}

export interface CompetitorSuggestion {
  competitor: string
  keywords_shared: number
  avg_position: number
  best_position: number
}

export interface CompetitorSuggestionsResponse {
  domain: string
  count: number
  rows: CompetitorSuggestion[]
}

function base(wid: string, did: string) {
  return `/api/workspaces/${wid}/domains/${did}/competitors`
}

export const competitorsApi = {
  /** User-editable curated list (with latest rank). */
  list: (wid: string, did: string) =>
    apiClient.get<CuratedCompetitorsResponse>(`${base(wid, did)}/list`),

  add: (wid: string, did: string, domain: string, label?: string) =>
    apiClient.post<CuratedCompetitor>(`${base(wid, did)}/list`, { domain, label }),

  remove: (wid: string, did: string, competitorId: string) =>
    apiClient.del<void>(`${base(wid, did)}/list/${competitorId}`),

  /** LLM: find top competitors for a domain and store them (source='ai').
   *  extraServices steer the match toward features not yet on the site. */
  discover: (
    wid: string,
    did: string,
    opts: { targetDomain?: string; limit?: number; extraServices?: string[] } = {}
  ) =>
    apiClient.post<CompetitorDiscoverResponse>(`${base(wid, did)}/discover`, {
      target_domain: opts.targetDomain || null,
      limit: opts.limit ?? 10,
      extra_services: opts.extraServices && opts.extraServices.length ? opts.extraServices : null,
    }),

  suggestions: (
    wid: string,
    did: string,
    opts: { country?: string; language?: string } = {}
  ) => {
    const q = new URLSearchParams({
      country: opts.country ?? "in",
      language: opts.language ?? "en",
    })
    return apiClient.get<CompetitorSuggestionsResponse>(`${base(wid, did)}/suggestions?${q}`)
  },

  tracked: (
    wid: string,
    did: string,
    opts: { country?: string; language?: string } = {}
  ) => {
    const q = new URLSearchParams({
      country: opts.country ?? "in",
      language: opts.language ?? "en",
    })
    return apiClient.get<TrackedCompetitorsResponse>(`${base(wid, did)}/tracked?${q}`)
  },

  history: (wid: string, did: string) =>
    apiClient.get<CompetitorHistoryResponse>(`${base(wid, did)}/history`),

  refresh: (
    wid: string,
    did: string,
    opts: { country?: string; language?: string } = {}
  ) => {
    const q = new URLSearchParams({
      country: opts.country ?? "in",
      language: opts.language ?? "en",
    })
    return apiClient.post<CompetitorRefreshResponse>(
      `${base(wid, did)}/refresh?${q}`,
      {}
    )
  },
}
