/**
 * Keyword Analysis API — first-party keyword research (no paid provider).
 * Mirrors the FastAPI /api/workspaces/{wid}/domains/{sid}/keyword-analysis routes.
 */
import { apiClient } from "./client"

export interface KeywordMetric {
  intent: string | null
  // Google Ads Keyword Planner (real market data)
  search_volume: number | null
  cpc: number | null
  competition: number | null
  // Google Search Console (owned-domain performance)
  gsc_impressions: number | null
  gsc_clicks: number | null
  gsc_position: number | null
  // Computed / Trends
  trend_index: number | null
  trend_change_pct: number | null
  difficulty: number | null
  opportunity_score: number | null
  relevance_score: number | null
  confidence_score: number | null
  captured_on: string | null
}

export interface ResearchResult {
  rank: number
  keyword_id: string
  keyword: string
  country_code: string
  language_code: string
  sources: string[]
  metric: KeywordMetric | null
}

export interface CategoryCount {
  name: string
  count: number
}

export interface ResearchSummary {
  id: string
  seed_keyword: string
  country_code: string
  language_code: string
  status: string
  created_at: string
  /** "keyword" (Search by keywords) | "domain" (Search by domain). */
  kind: "keyword" | "domain"
  /** Domain searches: the host searched (your site or a competitor's). */
  target: string | null
  result_count: number
}

export interface ResearchDetail extends ResearchSummary {
  seed_metric: KeywordMetric | null
  /** Whether the search-volume/CPC data source is set up for this server. */
  ads_available: boolean
  questions: string[]
  categories: CategoryCount[]
  results: ResearchResult[]
}

const base = (wid: string, sid: string) =>
  `/api/workspaces/${wid}/domains/${sid}/keyword-analysis`

export const keywordAnalysisApi = {
  run: (wid: string, sid: string, seed: string, country = "us", language = "en") =>
    apiClient.post<ResearchDetail>(`${base(wid, sid)}/research`, {
      seed,
      country,
      language,
    }),

  researches: (wid: string, sid: string) =>
    apiClient.get<ResearchSummary[]>(`${base(wid, sid)}/researches`),

  research: (wid: string, sid: string, id: string) =>
    apiClient.get<ResearchDetail>(`${base(wid, sid)}/researches/${id}`),
}
