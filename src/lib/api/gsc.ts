/** Google Search Console API (workspace connection + Search Analytics data). */
import { listParams, type ListParams, type PageInfo } from "./pagination"
import { apiClient } from "./client"

export interface GscSite {
  site_url: string
  permission_level: string | null
}

export interface GscStatus {
  configured: boolean
  connected: boolean
  google_email: string | null
  sites: GscSite[]
}

export interface GscConnectResponse {
  auth_url: string
}

export interface GscQueryRow {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscPagePerformance {
  site_url: string
  page_url: string
  start_date: string
  end_date: string
  days: number
  has_data: boolean
  clicks: number
  impressions: number
  ctr: number
  position: number
  queries: GscQueryRow[]
}

export interface GscKeywordRow {
  keyword: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscTrendPoint {
  date: string
  clicks: number
  impressions: number
  position: number
}

export interface GscDistribution {
  top3: number
  top10: number
  top20: number
  beyond: number
}

export interface GscKeywordPerformance {
  site_url: string
  start_date: string
  end_date: string
  days: number
  keyword_count: number
  total_clicks: number
  total_impressions: number
  avg_position: number
  distribution: GscDistribution
  /** ONE page (see pagination). */
  keywords: GscKeywordRow[]
  pagination?: PageInfo | null
  trend: GscTrendPoint[]
}

const ws = (wid: string) => `/api/workspaces/${wid}/gsc`
const site = (wid: string, siteId: string) =>
  `/api/workspaces/${wid}/domains/${siteId}/gsc`

export const gscApi = {
  status: (wid: string) => apiClient.get<GscStatus>(`${ws(wid)}/status`),

  connect: (wid: string, returnPath: string) =>
    apiClient.post<GscConnectResponse>(`${ws(wid)}/connect`, {
      return_path: returnPath,
    }),

  disconnect: (wid: string) => apiClient.del<null>(ws(wid)),

  page: (wid: string, siteId: string, url: string, days = 28) =>
    apiClient.get<GscPagePerformance>(
      `${site(wid, siteId)}/page?url=${encodeURIComponent(url)}&days=${days}`
    ),

  /** Totals, trend and distribution over every keyword; `keywords` is ONE page.
   * sort: clicks | impressions | ctr | position | keyword */
  keywords: (wid: string, siteId: string, days = 28, list: ListParams = {}) =>
    apiClient.get<GscKeywordPerformance>(`${site(wid, siteId)}/keywords`, {
      params: listParams({ sort: "clicks", ...list }, { days }),
    }),
}
