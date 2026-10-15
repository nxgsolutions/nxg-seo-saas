/**
 * Page history API (workspace-scoped, private).
 *
 * Every fetch of a website page (Page Audit, Content Optimization, Title & Meta)
 * is stored as a timestamped snapshot with what changed since the previous one.
 * Daily Search Console numbers per page are stored too, so each change can be
 * compared with clicks / position before and after it.
 */
import { apiClient } from "./client"
import { listParams, type ListParams, type Paged } from "./pagination"

export interface SitePage {
  id: string
  url: string
  url_key: string
  title: string
  domain_id: string | null
  latest_audit_score: number | null
  /** Change between the last two audits. */
  score_delta: number | null
  snapshot_count: number
  first_seen_at: string
  last_checked_at: string
  last_changed_at: string | null
}

export type ChangeKind = "meta" | "content" | "media" | "links" | "technical" | "checks"

export interface PageChange {
  kind: ChangeKind
  field: string
  label: string
  before: unknown
  after: unknown
}

export interface PageFactsSnapshot {
  title?: string
  meta?: string
  h1?: string[]
  headings?: { level: number; text: string }[]
  word_count?: number | null
  images?: number | null
  images_missing_alt?: number | null
  internal_links?: number | null
  external_links?: number | null
  reading_ease?: number | null
}

export interface PageSnapshot {
  id: string
  captured_at: string
  /** audit | content | inspect (Title & Meta) */
  source: "audit" | "content" | "inspect" | string
  source_id: string | null
  device: string | null
  audit_score: number | null
  content_score: number | null
  keyword: string | null
  facts: PageFactsSnapshot
  tech: Record<string, unknown> | null
  changes: PageChange[]
}

export interface PageTimeline {
  page: SitePage
  snapshots: PageSnapshot[]
}

export interface SearchDay {
  day: string
  clicks: number
  impressions: number
  ctr: number
  position: number | null
}

export interface WindowStats {
  days: number
  clicks: number
  impressions: number
  ctr: number
  position: number | null
}

export interface ChangeImpact {
  snapshot_id: string
  date: string
  before: WindowStats | null
  after: WindowStats | null
  after_days: number
  too_early: boolean
}

export interface PagePerformance {
  status: "ok" | "not_connected" | "no_property" | "no_website" | "error"
  series: SearchDay[]
  impacts: ChangeImpact[]
  window_days: number
}

export interface InspectResult {
  page_id: string | null
  url: string
  title: string
  meta: string
  h1: string[]
  canonical: string
  og_title: string
  og_description: string
  og_image: string
  og_site_name: string
  twitter_site: string
  word_count: number
  changes: PageChange[]
}

const base = (wid: string) => `/api/workspaces/${wid}/pages`

export const pagesApi = {
  /** domainId: a website id, "other" (pages on other sites), or null for all. */
  list: (wid: string, p: ListParams, domainId: string | null) =>
    apiClient.get<Paged<SitePage>>(base(wid), { params: listParams(p, { domain_id: domainId }) }),

  timeline: (wid: string, pageId: string) => apiClient.get<PageTimeline>(`${base(wid)}/${pageId}`),

  performance: (wid: string, pageId: string, days = 180) =>
    apiClient.get<PagePerformance>(`${base(wid)}/${pageId}/performance`, { params: { days }, timeout: 60_000 }),

  inspect: (wid: string, url: string) => apiClient.post<InspectResult>(`${base(wid)}/inspect`, { url }),
}
