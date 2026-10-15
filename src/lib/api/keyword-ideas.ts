/**
 * Free Keyword Ideas API — Google Autocomplete-backed, no paid provider.
 * Mirrors POST /api/tools/keyword-ideas.
 */
import { apiClient } from "./client"

export interface KeywordIdeaRow {
  keyword: string
  intent: string
  difficulty: number
  word_count: number
  volume: number | null
  cpc: number | null
  pd: number | null
}

export interface KeywordIdeaCategory {
  name: string
  count: number
  keywords: KeywordIdeaRow[]
}

export interface KeywordIdeasResponse {
  seed: string
  country: string
  language: string
  volume_source: string
  total: number
  categories: KeywordIdeaCategory[]
}

export const keywordIdeasApi = {
  ideas: (seed: string, country = "us", language = "en") =>
    apiClient.post<KeywordIdeasResponse>("/api/tools/keyword-ideas", {
      seed,
      country,
      language,
    }),
}
