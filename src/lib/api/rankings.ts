/** Rank tracking API (domain-scoped tracked keywords + position entries). */
import { apiClient } from "./client"

export interface TrackedKeyword {
  id: string
  term: string
  latest_position: number | null
  previous_position: number | null
  best_position: number | null
  entry_count: number
  created_at: string
  // Signals from the shared keyword library (null when not known yet).
  search_volume: number | null
  difficulty: number | null
  intent: string | null
  // Automated-tracking status.
  tracking_status: string
  tracking_enabled: boolean
  tracking_frequency_days: number
  last_fetched_at: string | null
  next_fetch_at: string | null
}

export interface RankEntry {
  id: string
  position: number | null
  recorded_at: string
}

export interface RankHistoryPoint {
  date: string
  position: number | null
  url: string | null
}

export interface RankSeries {
  host: string
  points: RankHistoryPoint[]
}

export interface RankHistoryMeta {
  current: number | null
  previous: number | null
  change: number | null
  best: number | null
  last_tracked: string | null
  last_fetched_at: string | null
  next_fetch_at: string | null
  tracking_frequency_days: number
  tracking_status: string
  tracking_enabled: boolean
}

export interface RankHistory {
  keyword: string
  you_host: string
  dates: string[]
  you: RankSeries
  competitors: RankSeries[]
  meta: RankHistoryMeta
}

export interface KeywordReportingPeriod {
  date: string
  page1: number
  page2: number
  page3: number
  page4plus: number
  total: number
  not_ranked: number
}

export interface KeywordReporting {
  freq: "daily" | "weekly" | "monthly"
  dates: string[]
  periods: KeywordReportingPeriod[]
}

export interface ReportingFacets {
  devices: string[]
  locations: { code: number; name: string }[]
}

export interface RankTimeline {
  label: string
  you_host: string
  freq: "daily" | "weekly" | "monthly"
  dates: string[]
  you: RankSeries
  competitors: RankSeries[]
  all_competitors: string[]
}

export interface TrackNowResult {
  term: string
  our_position: number | null
  recorded_at: string | null
  results: number
  competitors: number
  reused: boolean
  skipped: string | null
}

export interface RunDueResult {
  due: number
  fetched: number
  failed: number
  skipped_live: number
  aborted: string | null
}

const base = (wid: string, siteId: string) =>
  `/api/workspaces/${wid}/domains/${siteId}`

export const rankingsApi = {
  keywords: (wid: string, siteId: string) =>
    apiClient.get<TrackedKeyword[]>(`${base(wid, siteId)}/tracked-keywords`),

  addKeyword: (wid: string, siteId: string, term: string) =>
    apiClient.post<TrackedKeyword>(`${base(wid, siteId)}/tracked-keywords`, {
      term,
    }),

  removeKeyword: (wid: string, siteId: string, keywordId: string) =>
    apiClient.del<null>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}`
    ),

  entries: (wid: string, siteId: string, keywordId: string) =>
    apiClient.get<RankEntry[]>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}/entries`
    ),

  recordPosition: (
    wid: string,
    siteId: string,
    keywordId: string,
    position: number | null,
    recorded_at?: string
  ) =>
    apiClient.post<RankEntry>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}/entries`,
      { position, recorded_at: recorded_at ?? null }
    ),

  syncGsc: (wid: string, siteId: string) =>
    apiClient.post<{ synced: number; total: number; recorded_at: string }>(
      `${base(wid, siteId)}/tracked-keywords/sync-gsc`,
      {}
    ),

  // Create tracked keywords from the domain's top Search Console queries.
  importGsc: (wid: string, siteId: string) =>
    apiClient.post<{ imported: number; synced: number; total: number; recorded_at: string }>(
      `${base(wid, siteId)}/tracked-keywords/import-gsc`,
      {}
    ),

  syncSerp: (wid: string, siteId: string) =>
    apiClient.post<{ synced: number; total: number; recorded_at: string }>(
      `${base(wid, siteId)}/tracked-keywords/sync-serp`,
      {}
    ),

  // Our + competitor rank timeline for one keyword (DB-derived from snapshots).
  rankHistory: (
    wid: string,
    siteId: string,
    keywordId: string,
    params?: { start?: string; end?: string }
  ) => {
    const q = new URLSearchParams()
    if (params?.start) q.set("start", params.start)
    if (params?.end) q.set("end", params.end)
    const qs = q.toString()
    return apiClient.get<RankHistory>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}/rank-history${qs ? `?${qs}` : ""}`
    )
  },

  // Page 1/2/3 ranked-keyword counts over time (from stored SERP snapshots).
  keywordReporting: (
    wid: string,
    siteId: string,
    params?: { freq?: "daily" | "weekly" | "monthly"; start?: string; end?: string; device?: string; location_code?: number }
  ) => {
    const q = new URLSearchParams()
    if (params?.freq) q.set("freq", params.freq)
    if (params?.start) q.set("start", params.start)
    if (params?.end) q.set("end", params.end)
    if (params?.device) q.set("device", params.device)
    if (params?.location_code != null) q.set("location_code", String(params.location_code))
    const qs = q.toString()
    return apiClient.get<KeywordReporting>(
      `${base(wid, siteId)}/tracked-keywords/keyword-reporting${qs ? `?${qs}` : ""}`
    )
  },

  // Distinct device + location values present in stored SERPs (drives reporting filters).
  reportingFacets: (wid: string, siteId: string) =>
    apiClient.get<ReportingFacets>(
      `${base(wid, siteId)}/tracked-keywords/reporting-facets`
    ),

  // Aggregated competitor rank over time across tracked keywords (both pages).
  rankTimeline: (
    wid: string,
    siteId: string,
    params?: { freq?: "daily" | "weekly" | "monthly"; start?: string; end?: string; keywords?: string[]; competitors?: string[]; top?: number }
  ) => {
    const q = new URLSearchParams()
    if (params?.freq) q.set("freq", params.freq)
    if (params?.start) q.set("start", params.start)
    if (params?.end) q.set("end", params.end)
    if (params?.keywords?.length) q.set("keywords", params.keywords.join(","))
    if (params?.competitors?.length) q.set("competitors", params.competitors.join(","))
    if (params?.top) q.set("top", String(params.top))
    const qs = q.toString()
    return apiClient.get<RankTimeline>(
      `${base(wid, siteId)}/tracked-keywords/rank-timeline${qs ? `?${qs}` : ""}`
    )
  },

  // Fetch a fresh SERP for one keyword now (sandbox free; live paid — confirm first).
  trackNow: (wid: string, siteId: string, keywordId: string) =>
    apiClient.post<TrackNowResult>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}/track-now`,
      {}
    ),

  // Change tracking cadence (15|30) / on-off.
  updateTracking: (
    wid: string,
    siteId: string,
    keywordId: string,
    body: { tracking_frequency_days?: number; tracking_enabled?: boolean }
  ) =>
    apiClient.patch<TrackedKeyword>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}`,
      body
    ),

  // Process this domain's keywords that are due for a fetch (manual scheduler run).
  runDue: (wid: string, siteId: string) =>
    apiClient.post<RunDueResult>(
      `${base(wid, siteId)}/tracked-keywords/run-due`,
      {}
    ),
}
