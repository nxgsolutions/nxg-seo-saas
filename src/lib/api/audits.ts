/** Workspace-scoped page-audit history API. */
import { apiClient } from "./client"
import type { PageChange } from "./pages"
import type { AuditCheck, AuditMetrics } from "./tools"

export interface AuditSummary {
  id: string
  url: string
  score: number
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
