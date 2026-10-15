/**
 * Google Ads Keyword Planner API — RAW volume/CPC/competition, no scoring.
 * Mirrors POST /api/tools/keyword-planner.
 */
import { apiClient } from "./client"

export type PlannerMode = "keyword" | "url" | "site"

export interface MonthlyVolume {
  year: number | null
  month: string | null
  searches: number
}

export interface PlannerRow {
  keyword: string
  avg_monthly_searches: number
  competition: string | null
  competition_index: number | null
  cpc_low: number | null
  cpc_high: number | null
  intent: string | null
  seo_difficulty: number | null
  monthly: MonthlyVolume[]
}

export interface KeywordPlannerResponse {
  configured: boolean
  message: string | null
  mode: PlannerMode
  input: string
  country: string
  language: string
  count: number
  rows: PlannerRow[]
  /** Stored domain searches: run id, host, served from DB (no Google call), fetch time. */
  id?: string | null
  target?: string | null
  cached?: boolean
  captured_at?: string | null
}

export const keywordPlannerApi = {
  history: (input: string, country = "us", language = "en") =>
    apiClient.post<KeywordPlannerResponse>("/api/tools/keyword-planner/history", { input, country, language }),
  run: (input: string, mode: PlannerMode, country = "us", language = "en") =>
    apiClient.post<KeywordPlannerResponse>("/api/tools/keyword-planner", {
      input,
      mode,
      country,
      language,
    }),
}
