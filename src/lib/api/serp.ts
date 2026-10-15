/**
 * SERP Analyzer — its own feature, separate from keyword research.
 * `analyze` fetches a keyword's Google SERP via DataForSEO (default) and stores
 * a rich snapshot; `scrape` is the legacy DuckDuckGo HTML fallback.
 */
import { apiClient } from "./client"

export interface SerpRow {
  position: number
  url: string
  domain: string
  title: string | null
}

export interface SerpScrapeResponse {
  keyword: string
  country: string
  language: string
  count: number
  rows: SerpRow[]
}

export type SerpProvider = "dataforseo" | "scrape"

export interface SerpAnalyzeRow {
  position: number
  rank_group: number | null
  url: string
  domain: string
  title: string | null
  description: string | null
  breadcrumb: string | null
  /** SERP item type: organic, featured_snippet, ai_overview, … */
  type?: string
}

export interface SerpAnalyzeResponse {
  keyword: string
  country: string
  language: string
  engine: string
  source: SerpProvider
  se_results_count: number | null
  check_url: string | null
  captured_at: string | null
  count: number
  rows: SerpAnalyzeRow[]
}

/** Keyword Breakdown: stored SERP + stored per-domain metrics (DB only, free). */
export interface KeywordBreakdownRow extends SerpAnalyzeRow {
  host: string
  is_you: boolean
  /** Monthly visits this result gets for the keyword. */
  visits: number | null
  /** "dataforseo" = Labs estimate stored for that domain; "estimate" = volume × CTR(position). */
  visits_source: "dataforseo" | "estimate" | null
  /** DataForSEO domain rank, 0–100. */
  authority: number | null
  backlinks: number | null
  referring_domains: number | null
  site_traffic: number | null
  site_keywords: number | null
}

export interface KeywordBreakdown {
  keyword: string
  country: string
  language: string
  environment: string
  metrics: {
    search_volume: number | null
    cpc: number | null
    difficulty: number | null
    competition: number | null
    intent: string | null
    metric_date: string | null
  }
  captured_at: string | null
  source: string | null
  se_results_count: number | null
  check_url: string | null
  summary: {
    top10_with_metrics: number
    avg_authority: number | null
    avg_backlinks: number | null
    your_position: number | null
  }
  rows: KeywordBreakdownRow[]
}

export const serpApi = {
  /** DB only — never calls a paid API. */
  breakdown: (wid: string, keyword: string, country = "in", language = "en") =>
    apiClient.get<KeywordBreakdown>(
      `/api/workspaces/${wid}/serp/breakdown?${new URLSearchParams({ keyword, country, language })}`
    ),

  analyze: (
    wid: string,
    keyword: string,
    opts: {
      country?: string
      language?: string
      depth?: number
      persist?: boolean
      provider?: SerpProvider
      refresh?: boolean
    } = {}
  ) => {
    const q = new URLSearchParams({
      keyword,
      country: opts.country ?? "in",
      language: opts.language ?? "en",
      depth: String(opts.depth ?? 100),
      persist: String(opts.persist ?? true),
      provider: opts.provider ?? "dataforseo",
      // refresh=false (default) reads the stored snapshot — no paid API call.
      refresh: String(opts.refresh ?? false),
    })
    // POST (not GET) so the client's longer timeout applies — a live DataForSEO
    // SERP can take 15-30s, past the GET timeout.
    return apiClient.post<SerpAnalyzeResponse>(
      `/api/workspaces/${wid}/serp/analyze?${q}`,
      {}
    )
  },

  scrape: (
    wid: string,
    keyword: string,
    opts: { country?: string; language?: string; num?: number; persist?: boolean } = {}
  ) => {
    const q = new URLSearchParams({
      keyword,
      country: opts.country ?? "in",
      language: opts.language ?? "en",
      num: String(opts.num ?? 20),
      persist: String(opts.persist ?? true),
    })
    return apiClient.get<SerpScrapeResponse>(`/api/workspaces/${wid}/serp/scrape?${q}`)
  },
}
