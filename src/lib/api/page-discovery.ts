/** Page Discovery API — scan a domain for pages (sitemap-first, crawl fallback). */
import { apiClient } from "./client"
import { listParams, type ListParams, type Paged } from "./pagination"

export interface DiscoveryRun {
  id: string | null
  source: "sitemap" | "crawl" | "none" | "no_sitemap"
  sitemap_url: string | null
  status: "running" | "completed" | "partial" | "failed" | "cancelled"
  pages_found: number
  pages_enriched: number
  truncated: boolean
  started_at: string | null
  finished_at: string | null
}

export interface PageDiscoverySummary {
  total: number
  indexable: number
  noindex: number
  unknown_index: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  by_source: Record<string, number>
  by_freshness: Record<string, number>
  delta_pct: number | null
}

export interface DiscoveredPage {
  id: string
  url: string
  title: string
  page_type: string
  http_status: number | null
  indexable: boolean | null
  discovery_source: string | null
  sitemap_lastmod: string | null
  latest_audit_score: number | null
  word_count: number | null
  has_content: boolean
}

export interface PageFilters {
  type?: string
  status?: string
  indexable?: string
}

/** Editable content for one page (fetched on demand, cached server-side). */
export interface PageContent {
  title: string
  meta: string
  body_html: string
  word_count: number | null
  http_status: number | null
  url: string
  cached: boolean
  fetched_at: string | null
  error: string | null
}

export type CheckStatus = "pass" | "warn" | "fail"

export interface ContentCheck {
  id: string
  group: string
  label: string
  status: CheckStatus
  weight: number
  value: string
  tip: string
}

export interface ScoreContentResult {
  score: number
  checks: ContentCheck[]
  word_count: number
  reading_ease: number | null
  internal_links: number
  external_links: number
  images: number
  headings: number
}

export interface ScoreContentInput {
  title: string
  meta: string
  body_html: string
  keyword: string
}

const base = (wid: string, did: string) => `/api/workspaces/${wid}/domains/${did}/page-discovery`

export const pageDiscoveryApi = {
  discover: (wid: string, did: string, allowCrawl = false) =>
    apiClient.post<DiscoveryRun>(`${base(wid, did)}/discover?allow_crawl=${allowCrawl}`, {}),
  cancel: (wid: string, did: string) =>
    apiClient.post<DiscoveryRun | null>(`${base(wid, did)}/cancel`, {}),
  status: (wid: string, did: string) => apiClient.get<DiscoveryRun | null>(`${base(wid, did)}/status`),
  summary: (wid: string, did: string) => apiClient.get<PageDiscoverySummary>(`${base(wid, did)}/summary`),
  list: (wid: string, did: string, p: ListParams, filters: PageFilters = {}) =>
    apiClient.get<Paged<DiscoveredPage>>(base(wid, did), {
      params: listParams(p, { type: filters.type, status: filters.status, indexable: filters.indexable }),
    }),
  content: (wid: string, did: string, pageId: string, refresh = false) =>
    apiClient.get<PageContent>(`${base(wid, did)}/pages/${pageId}/content`, { params: { refresh } }),
  scoreContent: (wid: string, did: string, pageId: string, body: ScoreContentInput) =>
    apiClient.post<ScoreContentResult>(`${base(wid, did)}/pages/${pageId}/score`, body),
}
