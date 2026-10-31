/** Workspace-scoped page-audit history API. */
import { apiClient } from "./client"
import type { ScoreCategory } from "./page-score"
import type { PageChange } from "./pages"
import type { AuditCheck, AuditMetrics } from "./tools"

export interface AuditSummary {
  id: string
  url: string
  /** Technical-checklist score (kept for back-compat). */
  score: number
  /** Genuine overall SEO score — the headline number shown in lists. */
  overall?: number | null
  status_code: number
  load_time_ms: number
  created_at: string
}

export interface AuditDetail {
  id: string
  url: string
  score: number
  status_code: number
  load_time_ms: number
  page_size_bytes: number
  checks: AuditCheck[]
  metrics: AuditMetrics
  /** Genuine overall SEO score + category breakdown + blocking problems, so this
   * one record powers the score, the breakdown and the fixes. */
  overall?: number | null
  categories?: ScoreCategory[]
  blockers?: string[]
  created_at: string
  /** Page history: the tracked page, and what changed since its previous check. */
  page_id?: string | null
  changes?: PageChange[]
}

export const auditsApi = {
  run: (workspaceId: string, url: string, device: "desktop" | "mobile" = "desktop") =>
    apiClient.post<AuditDetail>(
      `/api/workspaces/${workspaceId}/page-audits`,
      { url, device }
    ),

  list: (workspaceId: string) =>
    apiClient.get<AuditSummary[]>(`/api/workspaces/${workspaceId}/page-audits`),

  get: (workspaceId: string, auditId: string) =>
    apiClient.get<AuditDetail>(
      `/api/workspaces/${workspaceId}/page-audits/${auditId}`
    ),
}
