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

export interface BusinessProfile {
  business_description: string | null
  /** Short commerce-model label, e.g. "D2C e-commerce / online retail". */
  industry: string | null
  /** Short product niche / market sector, e.g. "Handcrafted brass décor". */
  sector: string | null
  /** "products" | "services" | "both" — what the site primarily offers. */
  business_type: string | null
  /** Core products that define the business. */
  primary_products: string[]
  /** Supporting / peripheral products. */
  secondary_products: string[]
  /** Combined primary+secondary (back-compat). */
  products: string[]
  /** Services / offerings / features (empty for a pure product catalog). */
  services: string[]
  /** Short distinctive angle, e.g. "Handcrafted religious & Vastu brass". */
  specialties: string | null
  /** Price tier, e.g. "premium, ~₹1,500-15,000". */
  price_positioning: string | null
  target_audience: string | null
  market: string | null
}

export interface BusinessProfileResponse {
  domain: string
  target: string | null
  profile: BusinessProfile | null
  extracted_at: string | null
}

export interface CompetitorDiscoverResponse {
  domain: string
  target: string
  market: string
  count: number
  profile: BusinessProfile | null
  competitors: CuratedCompetitor[]
}

/** Live status of an async discovery run (polled for step-by-step progress). */
export interface DiscoveryJob {
  job_id: string
  status: "running" | "done" | "error"
  step: number
  step_label: string | null
  total_steps: number
  count: number | null
  error: string | null
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

// AI discovery scrapes the site and makes two LLM calls, so it can run well past
// the default 120s write timeout. Give it a generous budget so the client waits
// (showing "processing") instead of erroring on a request the server completes.
const AI_DISCOVERY_TIMEOUT_MS = 300_000

export const competitorsApi = {
  /** User-editable curated list (with latest rank). */
  list: (wid: string, did: string) =>
    apiClient.get<CuratedCompetitorsResponse>(`${base(wid, did)}/list`),

  add: (wid: string, did: string, domain: string, label?: string) =>
    apiClient.post<CuratedCompetitor>(`${base(wid, did)}/list`, { domain, label }),

  remove: (wid: string, did: string, competitorId: string) =>
    apiClient.del<void>(`${base(wid, did)}/list/${competitorId}`),

  /** Start async competitor discovery (3-agent pipeline). Returns a job to poll
   *  with `discoverStatus`. extraServices steer the match toward features not yet
   *  on the site. */
  discover: (
    wid: string,
    did: string,
    opts: { targetDomain?: string; limit?: number; extraServices?: string[] } = {}
  ) =>
    apiClient.post<DiscoveryJob>(`${base(wid, did)}/discover`, {
      target_domain: opts.targetDomain || null,
      limit: opts.limit ?? 10,
      extra_services: opts.extraServices && opts.extraServices.length ? opts.extraServices : null,
    }),

  /** Poll a discovery job for live step progress. */
  discoverStatus: (wid: string, did: string, jobId: string) =>
    apiClient.get<DiscoveryJob>(`${base(wid, did)}/discover/${jobId}`),

  /** The business profile extracted from the site (first pass of discovery). */
  businessProfile: (wid: string, did: string) =>
    apiClient.get<BusinessProfileResponse>(`${base(wid, did)}/business-profile`),

  /** Re-run ONLY the business extraction (re-scrape + re-extract), leaving the
   *  competitor list untouched. */
  refreshBusinessProfile: (wid: string, did: string) =>
    apiClient.post<BusinessProfileResponse>(
      `${base(wid, did)}/business-profile/refresh`, {},
      { timeout: AI_DISCOVERY_TIMEOUT_MS },
    ),

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
