/** Workspace-scoped overall page SEO score API (mirrors /api/workspaces/{id}/page-scores). */
import { apiClient } from "./client"
import type { PageChange } from "./pages"
import type { AuditMetrics, CheckStatus } from "./tools"

export interface ScoreCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
  tip: string
}

export interface ScoreCategory {
  id: string
  label: string
  weight: number
  score: number | null // null when nothing in the category could be measured
  checks: ScoreCheck[]
}

/** Real Search Console numbers shown beside the score — never part of it. */
export interface PerformanceContext {
  clicks: number
  impressions: number
  ctr: number
  position: number
  days: number
  queries: { query: string; clicks: number; impressions: number; ctr: number; position: number }[]
}

export interface PageScoreDetail {
  url: string
  final_url: string
  status_code: number
  load_time_ms: number
  page_size_bytes: number
  keyword: string
  overall: number
  /** Blocking problems that capped the score (noindex, non-200, no title/H1,
   * severely thin). Empty when none. */
  blockers?: string[]
  categories: ScoreCategory[]
  metrics: AuditMetrics
  performance_context?: PerformanceContext | null
  /** Page history: the tracked page, and what changed since its previous check. */
  page_id?: string | null
  changes?: PageChange[]
  captured_at?: string | null
}

export const pageScoreApi = {
  run: (
    workspaceId: string,
    body: { url: string; keyword?: string | null; device?: "desktop" | "mobile" },
  ) =>
    apiClient.post<PageScoreDetail>(`/api/workspaces/${workspaceId}/page-scores`, {
      url: body.url,
      keyword: body.keyword || null,
      device: body.device ?? "desktop",
    }),
}
