/**
 * Backlinks — stored DataForSEO Backlinks data (domain-scoped).
 *
 * GETs read saved data only. The refresh calls are the only ones that reach
 * DataForSEO: free in a sandbox workspace, paid in a live one (saved runs are
 * reused unless `force`).
 */
import { apiClient } from "./client"
import { listParams, type ListParams, type Paged, type PageInfo } from "./pagination"

export interface BacklinkSummary {
  rank: number | null
  backlinks: number | null
  referring_domains: number | null
  dofollow_referring_domains: number | null
  referring_main_domains: number | null
  referring_ips: number | null
  broken_backlinks: number | null
  spam_score: number | null
  first_seen: string | null
  link_types: Record<string, number>
  link_attributes: Record<string, number>
  /** 0-1 share of the stored linking domains with spam score >= 30 */
  spammy_share: number | null
}

export interface ReferringDomainRow {
  domain: string
  rank: number | null
  backlinks: number | null
  nofollow_backlinks: number | null
  spam_score: number | null
  first_seen: string | null
  lost_date: string | null
}

export interface BacklinkRow {
  url_from: string
  domain_from: string | null
  url_to: string | null
  anchor: string | null
  item_type: string | null
  dofollow: boolean | null
  is_new: boolean
  is_lost: boolean
  is_broken: boolean
  domain_from_rank: number | null
  page_from_title: string | null
  spam_score: number | null
  first_seen: string | null
  last_seen: string | null
}

export interface AnchorRow {
  anchor: string
  backlinks: number | null
  referring_domains: number | null
  referring_domains_nofollow: number | null
  spam_score: number | null
  first_seen: string | null
}

interface FetchMeta {
  environment: "live" | "sandbox"
  live_enabled: boolean
  can_fetch: boolean
  estimated_cost: number
  fetched_at: string | null
  cost: number | null
  requests: number | null
  /** true when this response came from a new fetch */
  fetched_now: boolean
}

export interface BacklinkProfile extends FetchMeta {
  target: string
  is_you: boolean
  summary: BacklinkSummary | null
  referring_domains: ReferringDomainRow[]
  backlinks: BacklinkRow[]
  anchors: AnchorRow[]
}

export interface GapDomainRow {
  domain: string
  rank: number | null
  competitors_linking: number
  links: Record<string, number | null>
  spam_score: number | null
}

export interface LinkGap extends FetchMeta {
  your_domain: string
  competitors: string[]
  run_competitors: string[]
  competitors_changed: boolean
  total_count: number | null
  domains: GapDomainRow[]
}

export interface BacklinkOptions {
  your_domain: string
  environment: "live" | "sandbox"
  live_enabled: boolean
  domains: { domain: string; is_you: boolean; fetched_at: string | null }[]
}

export interface BreakdownItem { label: string; count: number }

export interface BacklinkDetails {
  target: string
  breakdowns: {
    follow: BreakdownItem[]
    link_types: BreakdownItem[]
    tlds: BreakdownItem[]
    countries: BreakdownItem[]
    platforms: BreakdownItem[]
    referring_pages: number | null
    crawled_pages: number | null
  } | null
  /** Counts over the SAVED backlinks (one per linking domain). */
  link_status: { saved: number; dofollow: number; nofollow: number; new: number; lost: number; broken: number } | null
  history: { fetched_at: string; rank: number | null; backlinks: number | null; referring_domains: number | null; spam_score: number | null; cost: number | null }[]
  /** vs the previous fetch (null with only one fetch). */
  changes: {
    previous_fetched_at: string
    backlinks: number | null
    referring_domains: number | null
    rank: number | null
    gained_domains: string[]
    lost_domains: string[]
  } | null
}

export type BacklinkList = "domains" | "links" | "anchors" | "pages" | "reclaim"

export interface LinkedPageRow {
  url: string
  links: number
  domains: number
  dofollow: number
  best_authority: number | null
  anchors: string[]
}

/** A dead page on your site that still has backlinks pointing at it. */
export interface ReclaimPageRow extends LinkedPageRow {
  /** Fix-first score: dofollow (or total) links × strongest linking domain. */
  priority: number
  first_seen: string | null
  last_seen: string | null
}

export type DomainListRow = ReferringDomainRow & { dofollow_backlinks: number | null }

export interface BacklinkRowsMap {
  domains: DomainListRow
  links: BacklinkRow
  anchors: AnchorRow
  pages: LinkedPageRow
  reclaim: ReclaimPageRow
}

// ── Analytics (Overview dashboard) ──────────────────────────────────────────
export interface TrendPoint { fetched_at: string; rank: number | null; backlinks: number | null; referring_domains: number | null; spam_score: number | null }
export interface NewLostSummary {
  since: string | null
  backlinks_delta: number | null; referring_domains_delta: number | null; rank_delta: number | null
  new_links: number; lost_links: number; broken_links: number
  gained_domains: string[]; lost_domains: string[]
}
export interface AnchorClass { label: string; count: number; share: number }
export interface AnchorMix { total: number; classes: AnchorClass[]; over_optimized: boolean }
export interface DiversitySignals {
  referring_domains: number | null; referring_ips: number | null
  dofollow_share: number | null; spammy_share: number | null; links_per_domain: number | null
  concentrated: boolean; shared_ips: boolean
  top_tlds: BreakdownItem[]; top_countries: BreakdownItem[]
}
export interface BacklinkAnalytics {
  target: string
  trend: TrendPoint[]
  new_lost: NewLostSummary | null
  anchors: AnchorMix | null
  diversity: DiversitySignals | null
}

// ── Entity drill-down (site / page) ─────────────────────────────────────────
export interface SiteDetailSummary {
  host: string; authority: number | null; spam_score: number | null
  links_to_you: number; dofollow_links: number
  first_seen: string | null; last_seen: string | null; complete: boolean
}
export interface PresencePoint { fetched_at: string; present: boolean; links: number }
export interface ReferringSiteDetail extends FetchMeta {
  target: string; host: string; found: boolean
  summary: SiteDetailSummary | null
  links: BacklinkRow[]; pagination: PageInfo; presence: PresencePoint[]; complete: boolean
}
export interface PageDetailSummary {
  url: string; status: "live" | "broken"; links: number; linking_sites: number; dofollow: number
  best_authority: number | null; first_seen: string | null; last_seen: string | null
  suggested_fix: string | null; complete: boolean
}
export interface LinkedPageDetail extends FetchMeta {
  target: string; url: string; found: boolean
  summary: PageDetailSummary | null
  links: BacklinkRow[]; pagination: PageInfo; complete: boolean
}

const base = (wid: string, did: string) => `/api/workspaces/${wid}/domains/${did}/backlinks`
const q = (target?: string | null) => (target ? `target=${encodeURIComponent(target)}` : "")

export const backlinksApi = {
  options: (wid: string, did: string) => apiClient.get<BacklinkOptions>(`${base(wid, did)}/options`),
  profile: (wid: string, did: string, target?: string | null) =>
    apiClient.get<BacklinkProfile>(`${base(wid, did)}/profile?${q(target)}`),
  refreshProfile: (wid: string, did: string, target: string | null, force: boolean) =>
    apiClient.post<BacklinkProfile>(`${base(wid, did)}/profile/refresh?${q(target)}&force=${force}`, {}),
  /** Breakdowns, fetch history, changes since the previous fetch (saved data only). */
  details: (wid: string, did: string, target?: string | null) =>
    apiClient.get<BacklinkDetails>(`${base(wid, did)}/profile/details`, { params: target ? { target } : {} }),

  /** One page of a saved list, server-side search / filter / sort. */
  rows: <L extends BacklinkList>(wid: string, did: string, list: L, target: string | null, p: ListParams, filter: string) =>
    apiClient.get<Paged<BacklinkRowsMap[L]>>(`${base(wid, did)}/profile/rows`,
      { params: listParams(p, { list, filter, target: target ?? undefined }) }),

  gap: (wid: string, did: string) => apiClient.get<LinkGap>(`${base(wid, did)}/gap`),
  refreshGap: (wid: string, did: string, force: boolean) =>
    apiClient.post<LinkGap>(`${base(wid, did)}/gap/refresh?force=${force}`, {}),

  /** Overview dashboard: trend, new/lost, anchor classification, quality (saved data). */
  analytics: (wid: string, did: string, target?: string | null) =>
    apiClient.get<BacklinkAnalytics>(`${base(wid, did)}/analytics`, { params: target ? { target } : {} }),

  /** One referring site's links to you (saved subset, or complete after Load all links). */
  siteDetail: (wid: string, did: string, host: string, target: string | null, p: ListParams) =>
    apiClient.get<ReferringSiteDetail>(`${base(wid, did)}/profile/site`,
      { params: listParams(p, { host, target: target ?? undefined }) }),
  refreshSite: (wid: string, did: string, host: string, target: string | null, force: boolean) =>
    apiClient.post<ReferringSiteDetail>(`${base(wid, did)}/profile/site/refresh?host=${encodeURIComponent(host)}&${q(target)}&force=${force}`, {}),

  /** Every site linking to one page (saved subset, or complete after Load all links). */
  pageDetail: (wid: string, did: string, url: string, target: string | null, p: ListParams) =>
    apiClient.get<LinkedPageDetail>(`${base(wid, did)}/profile/page`,
      { params: listParams(p, { url, target: target ?? undefined }) }),
  refreshPage: (wid: string, did: string, url: string, target: string | null, force: boolean) =>
    apiClient.post<LinkedPageDetail>(`${base(wid, did)}/profile/page/refresh?url=${encodeURIComponent(url)}&${q(target)}&force=${force}`, {}),

  /** CSV download URL for a stored list (opened directly; no JSON). */
  exportUrl: (wid: string, did: string, list: BacklinkList, target: string | null, filter: string) =>
    `${base(wid, did)}/export?list=${list}&filter=${filter}${target ? `&${q(target)}` : ""}`,
}
