/**
 * Opportunity Research — domain-scoped dynamic data (KPIs, trend, keyword
 * opportunities, page↔keyword mapping). Backed by
 * /workspaces/{wid}/domains/{did}/opportunity/* on the FastAPI backend.
 */
import { listParams, type ListParams, type PageInfo, type Paged } from "./pagination"
import { apiClient } from "./client"

export interface OppKpi {
  label: string
  value: string
  delta: number
  up: boolean
}

export interface RankBucket {
  label: string
  count: number
}

export interface OpportunityOverview {
  domain: string
  kpis: OppKpi[]
  rank_distribution: RankBucket[]
}

export interface OppTrendPointApi {
  label: string
  captured_on: string
  organic_traffic: number
  ranking_keywords: number
  serp_opportunities: number
}

export interface OpportunityTrend {
  domain: string
  points: OppTrendPointApi[]
}

export interface OppCompetitor {
  domain: string
  position: number
}

export interface OppKeywordRow {
  id: string
  keyword: string
  search_volume: number
  yoy_change: number
  keyword_difficulty: number
  current_position: number | null
  intent: string
  opportunity_score: number
  ranking_url: string | null
  page_url: string | null
  serp_features: string[]
  competitors: OppCompetitor[]
}

export interface OpportunityKeywords {
  domain: string
  total: number
  page: number
  page_size: number
  rows: OppKeywordRow[]
}

export interface OppPageKeyword {
  keyword: string
  search_volume: number
  current_position: number | null
  intent: string
  opportunity_score: number
  serp_features: string[]
}

export interface OppPageRow {
  id: string
  url: string
  title: string | null
  keyword_count: number
  total_volume: number
  avg_position: number | null
  keywords: OppPageKeyword[]
}

export interface OpportunityPages {
  domain: string
  total: number
  rows: OppPageRow[]
}

export interface KeywordQuery {
  q?: string
  intent?: string
  minVolume?: number
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  pageSize?: number
}

export interface OppVolumePoint {
  month: string
  volume: number
}

export interface OppVolumeMover {
  keyword: string
  prev: number
  curr: number
  delta: number
}

export interface OpportunityChange {
  domain: string
  series: OppVolumePoint[]
  prev_label: string
  curr_label: string
  prev_volume: number
  curr_volume: number
  delta: number
  delta_pct: number
  gainers: OppVolumeMover[]
  losers: OppVolumeMover[]
}

export interface CompetitorFootprint {
  domain: string
  keywords_shared: number
  /** null = not seen in our SERPs yet (curated competitor with no overlap) */
  avg_position: number | null
  best_position: number | null
  /** in your own competitor list (Competitor Analysis page) */
  curated: boolean
  /** Tracked keywords we BOTH rank for (SERP snapshot or GSC position). */
  common_keywords: number
  /** Tracked keywords they rank for and we don't. */
  gap_keywords: number
}

export type StrategyScope = "auto" | "curated" | "serp"

export interface OpportunityStrategy {
  domain: string
  total_keywords: number
  our_ranked: number
  /** "curated" = your competitor list; "serp" = top domains in your SERPs */
  scope: "curated" | "serp"
  curated_count: number
  competitors: CompetitorFootprint[]
}

export interface CompetitorKeywordRow {
  keyword: string
  their_position: number
  our_position: number | null
  search_volume: number | null
  is_gap: boolean
  their_url: string | null
  our_url: string | null
  our_position_source: "serp" | "gsc" | null
  /** volume × CTR at their position */
  est_visits: number | null
  cpc: number | null
  /** Google Ads competition index 0-100 */
  paid_difficulty: number | null
  seo_difficulty: number | null
  intent: string | null
}

export type CompetitorKeywordKind = "all" | "common" | "gap"

export interface CompetitorKeywords {
  domain: string
  competitor: string
  total: number
  gaps: number
  common: number
  kind: CompetitorKeywordKind
  rows: CompetitorKeywordRow[]
  /** Paging of `rows` (one page). */
  pagination?: PageInfo | null
}

export interface CompetitorAnalyticsRow {
  domain: string
  is_you: boolean
  organic_traffic: number
  ranking_keywords: number
  top3_keywords: number
  top10_keywords: number
  top20_keywords: number
  new_keywords: number
  lost_keywords: number
  traffic_value: number
  traffic_share: number
  domain_rank: number | null
  backlinks: number | null
  referring_domains: number | null
  keywords_shared: number | null
  common_keywords: number | null
  gap_keywords: number | null
  fetched_at: string | null
}

export interface CompetitorAnalyticsRefresh {
  fetched: number
  cached: number
  failed: string[]
  error: string | null
}

export type AnalyticsCountry = "in" | "us" | "gb" | "ca" | "au"

/** Whole-site competitor metrics from DataForSEO Labs, served from Postgres. */
export interface CompetitorAnalytics {
  domain: string
  is_sample: boolean
  environment: "live" | "sandbox"
  configured: boolean
  country: AnalyticsCountry
  source: string
  note: string
  fetched_at: string | null
  missing: string[]
  rows: CompetitorAnalyticsRow[]
  refresh: CompetitorAnalyticsRefresh | null
}

function base(wid: string, did: string) {
  return `/api/workspaces/${wid}/domains/${did}/opportunity`
}

export const opportunityApi = {
  overview: (wid: string, did: string) =>
    apiClient.get<OpportunityOverview>(`${base(wid, did)}/overview`),

  trend: (wid: string, did: string) =>
    apiClient.get<OpportunityTrend>(`${base(wid, did)}/trend`),

  keywords: (wid: string, did: string, opts: KeywordQuery = {}) => {
    const q = new URLSearchParams({
      q: opts.q ?? "",
      intent: opts.intent ?? "all",
      min_volume: String(opts.minVolume ?? 0),
      sort: opts.sort ?? "score",
      direction: opts.direction ?? "desc",
      page: String(opts.page ?? 1),
      page_size: String(opts.pageSize ?? 8),
    })
    return apiClient.get<OpportunityKeywords>(`${base(wid, did)}/keywords?${q}`)
  },

  pages: (wid: string, did: string) =>
    apiClient.get<OpportunityPages>(`${base(wid, did)}/pages`),

  change: (wid: string, did: string) =>
    apiClient.get<OpportunityChange>(`${base(wid, did)}/change`),

  strategy: (wid: string, did: string, scope: StrategyScope = "auto") =>
    apiClient.get<OpportunityStrategy>(`${base(wid, did)}/strategy?scope=${scope}`),

  /** ONE page of a competitor's keywords (server-side sort / paging; totals cover all).
   * sort: search_volume | their_position | our_position | est_visits | cpc | seo_difficulty | keyword */
  competitorKeywords: (wid: string, did: string, competitor: string,
    kind: CompetitorKeywordKind = "all", list: ListParams = {}) =>
    apiClient.get<CompetitorKeywords>(`${base(wid, did)}/strategy/keywords`, {
      params: listParams(list, { competitor, kind }),
    }),

  // country omitted => the backend uses the domain's own market (see domain_settings).
  competitorAnalytics: (wid: string, did: string, country?: AnalyticsCountry) =>
    apiClient.get<CompetitorAnalytics>(
      `${base(wid, did)}/strategy/analytics${country ? `?country=${country}` : ""}`),

  /** Fetches stale/missing metrics from DataForSEO (paid) and stores them. */
  refreshCompetitorAnalytics: (
    wid: string, did: string, opts: { country?: AnalyticsCountry; force?: boolean } = {},
  ) =>
    apiClient.post<CompetitorAnalytics>(
      `${base(wid, did)}/strategy/analytics/refresh?force=${opts.force ?? false}`
      + `${opts.country ? `&country=${opts.country}` : ""}`,
      {},
    ),

  /** Cheap warm-up: fills Authority / Backlinks / Referring-domains for your
   * domain + competitors (so the Keyword Breakdown columns populate). Pass the
   * same `country` the breakdown uses, so rows store at the location it reads. */
  warmBacklinks: (
    wid: string, did: string, opts: { country?: string; force?: boolean } = {},
  ) =>
    apiClient.post<CompetitorAnalyticsRefresh>(
      `${base(wid, did)}/strategy/backlinks/warm?force=${opts.force ?? false}`
      + `${opts.country ? `&country=${opts.country}` : ""}`,
      {},
    ),
}

// ── Ranked keywords (DataForSEO Labs): where a domain ACTUALLY ranks ────────

export interface RankedKeywordRow {
  keyword: string
  position: number | null
  prev_position: number | null
  /** + = moved up since the previous Labs update */
  change: number | null
  is_new: boolean
  url: string | null
  title: string | null
  /** est. monthly traffic from this keyword */
  etv: number | null
  search_volume: number | null
  cpc: number | null
  paid_difficulty: number | null
  keyword_difficulty: number | null
  intent: string | null
  serp_features: string[]
  our_position: number | null
  our_url: string | null
  our_position_source: "ranked" | "gsc" | null
  is_gap: boolean
  /** already in your tracked keyword list */
  tracked: boolean
}

export interface RankedKeywords {
  domain: string
  target: string
  is_you: boolean
  environment: "live" | "sandbox"
  configured: boolean
  can_fetch: boolean
  live_allowlist: string[]
  /** false = paid live API switched off (kill switch) — stored data only */
  live_enabled: boolean
  default_limit: number
  max_limit: number
  estimated_cost: number
  fetched_at: string | null
  /** ALL keywords the domain ranks for (Labs); only top-N are stored */
  total_count: number | null
  items_count: number
  cost: number | null
  has_our_run: boolean
  /** Scope of the run shown: top-N by traffic, relevant (filtered), or all. */
  scope: RankedScope | null
  /** Newest stored run per scope — switch between them for free. */
  stored_scopes: { scope: RankedScope; fetched_at: string; items_count: number; total_count: number | null; cost: number | null }[]
  pages_fetched: number | null
  stop_reason: "complete" | "cap_reached" | "no_new_keywords" | null
  relevant_rule: { regex: string; max_position: number; min_volume: number } | null
  max_keywords: number | null
  max_cost: number | null
  /** Competitor pages (ranking URLs) grouped from the stored keywords. */
  pages: RankedPage[]
  summary: { top3: number; top10: number; etv: number; common: number; gap: number; tracked: number }
  rows: RankedKeywordRow[]
  refresh: { fetched: boolean; cost: number | null } | null
  /** Paging of `rows` (one page). */
  pagination: PageInfo | null
}

export type RankedScope = "top" | "relevant" | "all"

/** Server-side filters of the ranked keyword list. */
export interface RankedFilters {
  bucket?: "all" | "top3" | "top10" | "top20" | "rest"
  show?: "all" | "gap" | "common"
  url?: string | null
}

export interface RankedPage {
  url: string
  title: string | null
  keywords: number
  best_position: number | null
  etv: number
  top_keyword: string | null
}

/** Size + cost of a scope before buying (one 1-keyword request). */
export interface RankedKeywordsEstimate {
  target: string
  scope: RankedScope
  environment: "live" | "sandbox"
  matching_count: number
  to_fetch: number
  requests: number
  estimated_cost: number
  /** what ALL matches would cost (uncapped) */
  full_cost: number
  capped: boolean
  max_keywords: number
  max_cost: number
  check_cost: number
}

export interface RankedKeywordsOptions {
  environment: "live" | "sandbox"
  your_domain: string
  live_allowlist: string[]
  live_enabled: boolean
  stored: { target: string; fetched_at: string; items_count: number; total_count: number | null; cost: number | null }[]
  suggestions: string[]
}

export const rankedKeywordsApi = {
  options: (wid: string, did: string) =>
    apiClient.get<RankedKeywordsOptions>(`${base(wid, did)}/strategy/ranked-keywords/options`),

  /** Stored data only — never calls DataForSEO. `scope` picks that scope's
   * newest run. Returns ONE page of rows (server-side filter / sort / paging);
   * summary + top pages cover every stored row.
   * sort: etv | position | search_volume | keyword_difficulty | keyword */
  get: (wid: string, did: string, domain: string, scope?: RankedScope | null,
    list: ListParams = {}, filters: RankedFilters = {}) =>
    apiClient.get<RankedKeywords>(`${base(wid, did)}/strategy/ranked-keywords`, {
      params: listParams(list, {
        competitor: domain, scope: scope ?? undefined,
        bucket: filters.bucket, show: filters.show, url: filters.url ?? undefined,
      }),
    }),

  /** Count + cost of a scope before buying (~$0.01 live, free in sandbox). */
  estimate: (wid: string, did: string, domain: string, scope: RankedScope) =>
    apiClient.post<RankedKeywordsEstimate>(
      `${base(wid, did)}/strategy/ranked-keywords/estimate?competitor=${encodeURIComponent(domain)}&scope=${scope}`,
      {},
    ),

  /** Paid fetch (live) — reuses a fresh stored run of the scope unless force. */
  refresh: (wid: string, did: string, domain: string,
    opts: { force?: boolean; limit?: number; scope?: RankedScope; maxKeywords?: number } = {}) =>
    apiClient.post<RankedKeywords>(
      `${base(wid, did)}/strategy/ranked-keywords/refresh?competitor=${encodeURIComponent(domain)}`
      + `&force=${opts.force ?? false}&scope=${opts.scope ?? "top"}`
      + `${opts.limit ? `&limit=${opts.limit}` : ""}${opts.maxKeywords ? `&max_keywords=${opts.maxKeywords}` : ""}`,
      {},
    ),
}

// ── Action plan (Opportunity Research): what to do next, from stored data ────

export type ActionType = "improve" | "gap" | "target"

export interface ActionItem {
  type: ActionType
  keyword: string
  volume: number | null
  difficulty: number | null
  /** your position (improve) */
  position: number | null
  /** your ranking page (improve) */
  url: string | null
  /** best-ranking competitor (gap) */
  competitor: string | null
  competitor_position: number | null
  competitor_url: string | null
  competitors_count: number | null
  /** estimated extra visits / month at the target position */
  gain: number
  action: string | null
  reason: string | null
  source: string | null
  tracked: boolean
}

export interface ActionPlan {
  domain: string
  environment: "live" | "sandbox"
  generated_at: string
  target_position: number
  counts: { improve: number; gaps: number; targets: number }
  /** top actions' potential, excluding very hard keywords (difficulty >= hard_kd) */
  total_gain: number
  hard_kd: number
  sources: {
    search_console_keywords: number
    our_ranked_keywords: number
    competitors: string[]
    competitors_with_rankings: string[]
  }
  top: ActionItem[]
  improve: ActionItem[]
  gaps: ActionItem[]
  targets: ActionItem[]
}

export const actionPlanApi = {
  /** DB only — never calls a paid API. */
  get: (wid: string, did: string) =>
    apiClient.get<ActionPlan>(`${base(wid, did)}/action-plan`),

  /** ONE page of a full list (improve | gap | target). Default order = the
   * plan's priority; sort: gain | volume | difficulty | position | keyword. */
  items: (wid: string, did: string, type: ActionType, list: ListParams = {}) =>
    apiClient.get<Paged<ActionItem>>(`${base(wid, did)}/action-plan/items`, {
      params: listParams({ ...list, order: list.order ?? "desc" }, { type }),
    }),

  /** Add a keyword to the domain's tracked keywords (idempotent). */
  track: (wid: string, did: string, keyword: string) =>
    apiClient.post<{ keyword: string; tracked: boolean; created: boolean }>(
      `${base(wid, did)}/keywords/track?keyword=${encodeURIComponent(keyword)}`, {}),
}

// ── Page insight: your page + competitor pages + content suggestions ─────────

export interface PageSnapshot {
  url: string
  ok: boolean
  error: string | null
  title: string | null
  meta_description: string | null
  h1: string[]
  headings: string[]
  word_count: number | null
}

export interface PageInsight {
  keyword: string
  your_page: PageSnapshot | null
  /** false = no page of yours matches → create one */
  page_found: boolean
  checks: { label: string; ok: boolean; value: string }[]
  competitor_pages: PageSnapshot[]
  target_word_count: number | null
  questions: string[]
  suggestions: { priority: "high" | "medium" | "low"; area: string; text: string }[]
}

export const pageInsightApi = {
  /** Fetches your page + competitor pages live (free, no paid API). */
  get: (wid: string, did: string, keyword: string, opts: { url?: string | null; competitorUrl?: string | null } = {}) => {
    const q = new URLSearchParams({ keyword })
    if (opts.url) q.set("url", opts.url)
    if (opts.competitorUrl) q.set("competitor_url", opts.competitorUrl)
    // Fetches pages live — allow longer than the default 15s read timeout.
    return apiClient.get<PageInsight>(`${base(wid, did)}/action-plan/insight?${q}`, { timeout: 60_000 })
  },
}
