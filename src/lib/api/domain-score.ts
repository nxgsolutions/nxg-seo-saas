/** Domain-scoped whole-site SEO score API (mirrors /api/.../domains/{id}/site-score). */
import { apiClient } from "./client"

export interface DomainScoreJob {
  id: string
  status: "running" | "done" | "error"
  step: number
  step_label: string | null
  pages_total: number | null
  pages_scored: number
  pages_failed: number
  error: string | null
  result_id: string | null
  started_at: string
  finished_at: string | null
}

export interface SiteCheck {
  id: string
  label: string
  status: "pass" | "warn" | "fail"
  detail: string
}

export interface ScoredPage {
  url: string
  page_id: string | null
  score: number
  page_type: string
}

export interface DomainScore {
  id: string
  overall: number
  page_quality: number
  site_technical: number
  category_averages: Record<string, number>
  site_checks: SiteCheck[]
  pages: ScoredPage[]
  pages_total: number
  pages_scored: number
  pages_indexable: number
  weak_share: number
  created_at: string
}

export interface DomainScoreTrendPoint {
  overall: number
  page_quality: number
  site_technical: number
  created_at: string
}

export interface DomainScoreView {
  latest: DomainScore | null
  history: DomainScoreTrendPoint[]
  running: DomainScoreJob | null
  /** Whether a fresh whole-site score may run now, and when the next one is due. */
  can_refetch: boolean
  next_refetch_at: string | null
}

const base = (wid: string, did: string) => `/api/workspaces/${wid}/domains/${did}/site-score`

export const domainScoreApi = {
  start: (wid: string, did: string, force = false) =>
    apiClient.post<DomainScoreJob>(`${base(wid, did)}${force ? "?force=true" : ""}`, {}),
  status: (wid: string, did: string) => apiClient.get<DomainScoreJob | null>(`${base(wid, did)}/status`),
  get: (wid: string, did: string) => apiClient.get<DomainScoreView>(base(wid, did)),
}
