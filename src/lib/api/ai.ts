/** AI Search (GEO/AEO) analysis API. */
import { apiClient } from "./client"

export interface AiTargetQuery {
  query: string
  opportunity: string // high | medium | low
}

export interface AiRecommendation {
  title: string
  detail: string
  priority: string // high | medium | low
}

export interface AiSearchResult {
  /** Always false (kept for API compatibility). */
  is_sample: boolean
  /** The AI model that wrote the analysis. */
  model?: string | null
  query: string
  domain: string | null
  visibility_score: number
  summary: string
  target_queries: AiTargetQuery[]
  recommendations: AiRecommendation[]
  content_gaps: string[]
  competitor_notes: string[]
}

export const aiApi = {
  search: (query: string, domain?: string) =>
    apiClient.post<AiSearchResult>("/api/tools/ai-search", {
      query,
      domain: domain || null,
    }),
}
