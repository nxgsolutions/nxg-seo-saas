/** Keyword data provider API (DataForSEO): ideas + competitor keywords. */
import { apiClient } from "./client"

export interface KeywordIdea {
  keyword: string
  search_volume: number
  cpc: number
  competition: number
  difficulty: number
}

export interface KeywordIdeasResult {
  is_sample: boolean
  cached: boolean
  seed: string
  keywords: KeywordIdea[]
}

export interface CompetitorKeyword {
  keyword: string
  position: number
  search_volume: number
  url: string
}

export interface CompetitorResult {
  is_sample: boolean
  cached: boolean
  domain: string
  keywords: CompetitorKeyword[]
}

export interface CompetitorMetric {
  domain: string
  keywords: number
  traffic: number
  avg_position: number
  common_keywords: number
}

export interface CompetitorAnalysis {
  is_sample: boolean
  cached: boolean
  domain: string
  target: CompetitorMetric
  competitors: CompetitorMetric[]
}

export interface CompetitorHistoryItem {
  domain: string
  location: string
  fetched_at: string
}

export interface KeywordInsightHistoryItem {
  keyword: string
  domain: string
  location: string
  fetched_at: string
}

export interface SerpResult {
  position: number
  domain: string
  url: string
  title: string
  is_you: boolean
}

export interface KeywordSerp {
  is_sample: boolean
  cached: boolean
  keyword: string
  location: string
  domain: string
  your_position: number | null
  results: SerpResult[]
}

export interface TrendPoint {
  year: number | null
  month: number | null
  volume: number
}

export interface KeywordOverview {
  search_volume: number
  cpc: number
  competition: number
  difficulty: number
  intent: string
  trend: TrendPoint[]
}

export interface RankPoint {
  date: string
  position: number | null
}

export interface KeywordInsight {
  is_sample: boolean
  keyword: string
  domain: string
  location: string
  overview: KeywordOverview
  your_position: number | null
  results: SerpResult[]
  related: KeywordIdea[]
  rank_history: RankPoint[]
}

export const keywordsApi = {
  ideas: (seed: string) =>
    apiClient.post<KeywordIdeasResult>("/api/tools/keyword-ideas", { seed }),

  competitor: (domain: string) =>
    apiClient.post<CompetitorResult>("/api/tools/competitor-keywords", { domain }),

  competitorAnalysis: (domain: string, location = "United States") =>
    apiClient.post<CompetitorAnalysis>("/api/tools/competitor-analysis", { domain, location }),

  competitorHistory: () =>
    apiClient.get<CompetitorHistoryItem[]>("/api/tools/competitor-analysis/history"),

  insightHistory: () =>
    apiClient.get<KeywordInsightHistoryItem[]>("/api/tools/keyword-insights/history"),

  serp: (keyword: string, domain: string, location = "United States") =>
    apiClient.post<KeywordSerp>("/api/tools/keyword-serp", { keyword, domain, location }),

  insights: (keyword: string, domain: string, location = "United States") =>
    apiClient.post<KeywordInsight>("/api/tools/keyword-insights", { keyword, domain, location }),
}
