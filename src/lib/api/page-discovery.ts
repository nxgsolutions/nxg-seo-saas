/** Page Discovery API — scan a domain for pages (sitemap-first, crawl fallback). */
import { apiClient } from "./client"
import { listParams, type ListParams, type Paged } from "./pagination"

export interface DiscoveryRun {
  id: string | null
  source: "sitemap" | "crawl" | "none" | "no_sitemap" | "shopify"
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
  /** SEO score of the saved edited content (null = never edited/scored). */
  content_score: number | null
  /** True when this page has saved editor edits. */
  edited: boolean
  /** Set when the page was imported from a connected store (Shopify). */
  external_source: "shopify" | null
  external_type: "product" | "page" | null
  external_id: string | null
  external_handle: string | null
  seo_title: string | null
  seo_description: string | null
  published: boolean | null
}

export interface PageFilters {
  type?: string
  status?: string
  indexable?: string
  /** all | shopify | sitemap | crawl */
  source?: string
  /** all | product | page (Shopify items) */
  externalType?: string
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
  /** True when this content is a saved user edit, not the fetched version. */
  edited?: boolean
  /** SEO score of the saved content (returned on save; null otherwise). */
  score?: number | null
  fetched_at: string | null
  error: string | null
  /** "shopify" when the page is linked to the connected store. */
  external_source?: "shopify" | null
  external_type?: "product" | "page" | null
}

/** The fields a user can save/update for a page's content. */
export interface SavePageContentInput {
  title: string
  meta: string
  body_html: string
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
      params: listParams(p, {
        type: filters.type, status: filters.status, indexable: filters.indexable,
        source: filters.source, external_type: filters.externalType,
      }),
    }),
  // First open fetches the live page server-side (SSRF-guarded, with retries) and
  // caches it, which can take ~25s on a cold page — well past the default 15s GET
  // timeout. Give it the long "audit/AI" budget so the first open doesn't abort
  // (and trip the dev proxy) before the backend finishes and caches the result;
  // every later open is served instantly from that cache.
  content: (wid: string, did: string, pageId: string, refresh = false) =>
    apiClient.get<PageContent>(`${base(wid, did)}/pages/${pageId}/content`, {
      params: { refresh },
      timeout: 120_000,
    }),
  scoreContent: (wid: string, did: string, pageId: string, body: ScoreContentInput) =>
    apiClient.post<ScoreContentResult>(`${base(wid, did)}/pages/${pageId}/score`, body),
  // Persist the user's edits. Stored separately from the fetched cache, so a later
  // Re-fetch never clobbers them. Long timeout to match the content endpoint.
  save: (wid: string, did: string, pageId: string, body: SavePageContentInput) =>
    apiClient.patch<PageContent>(`${base(wid, did)}/pages/${pageId}/content`, body, {
      timeout: 120_000,
    }),
}
