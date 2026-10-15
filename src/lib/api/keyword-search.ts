/**
 * Workspace-scoped keyword search (keyword input only, persisted).
 * Mirrors /api/workspaces/{wid}/keyword-search. Reuses the research shapes.
 */
import { apiClient } from "./client"
import type { ResearchDetail, ResearchResult, ResearchSummary } from "./keyword-analysis"
import type { KeywordPlannerResponse } from "./keyword-planner"
import { listParams, type ListParams, type Paged } from "./pagination"

export type { ResearchDetail, ResearchSummary, ResearchResult, CategoryCount } from "./keyword-analysis"

const base = (wid: string) => `/api/workspaces/${wid}/keyword-search`

export const keywordSearchApi = {
  /** Run a search. Returns metadata + category counts only; page the
   * results with `results()` (nothing heavy comes back at once). */
  run: (wid: string, seed: string, country = "us", language = "en") =>
    apiClient.post<ResearchDetail>(`${base(wid)}/research`, { seed, country, language },
      { params: { include_results: false } }),

  /** Recent searches; kind "all" mixes keyword + domain searches (newest first). */
  searches: (wid: string, kind: "keyword" | "domain" | "all" = "keyword") =>
    apiClient.get<ResearchSummary[]>(`${base(wid)}/researches?kind=${kind}`),

  /** A saved search's metadata + category counts (results via `results()`). */
  search: (wid: string, id: string) =>
    apiClient.get<ResearchDetail>(`${base(wid)}/researches/${id}`, { params: { include_results: false } }),

  /** One page of a search's results — filtered and sorted on the server.
   * sort: search_volume | cpc | competition | difficulty | keyword */
  results: (wid: string, id: string, list: ListParams, filters: { category?: string; intent?: string } = {}) =>
    apiClient.get<Paged<ResearchResult>>(`${base(wid)}/researches/${id}/results`, {
      params: listParams(list, { category: filters.category, intent: filters.intent }),
    }),

  /** Slim volume/difficulty points of every plottable keyword (opportunity map). */
  points: (wid: string, id: string) =>
    apiClient.get<{ points: OpportunityPointDto[]; skipped: number }>(`${base(wid)}/researches/${id}/points`),

  // Search by website (Google Ads, free). Returns the stored search for the same
  // domain + locale unless refresh=true, which fetches and stores a new run.
  website: (wid: string, input: string, country = "us", language = "en", refresh = false) =>
    apiClient.post<KeywordPlannerResponse>(
      `${base(wid)}/website?refresh=${refresh}`, { input, country, language },
    ),

  domainSearches: (wid: string) => apiClient.get<ResearchSummary[]>(`${base(wid)}/domain-searches`),

  /** Reopen a stored domain search — DB only, no Google call. */
  domainSearch: (wid: string, id: string) =>
    apiClient.get<KeywordPlannerResponse>(`${base(wid)}/domain-searches/${id}`),
}

export interface OpportunityPointDto {
  id: string
  keyword: string
  volume: number
  difficulty: number
  cpc: number | null
}
