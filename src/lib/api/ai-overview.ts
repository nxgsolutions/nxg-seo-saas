/** AI overviews: short summaries of a page / section, built from stored data
 * (local AI rewrite, no paid API). Cached server-side; `refresh` regenerates.
 * POST (not GET) so the longer client timeout applies — a first-time summary
 * takes ~10-20s on the local model. */
import { apiClient } from "./client"

export interface AiOverview {
  scope: string
  key: string
  summary: string
  /** The overview as 3-4 short bullet points (the summary split on newlines). */
  bullets: string[]
  /** "ai" = local model rewrite; "rules" = plain summary (AI unavailable). */
  source: "ai" | "rules"
  model: string | null
  generated_at: string
  cached: boolean
}

const q = (params: Record<string, string>) => new URLSearchParams(params).toString()

export const aiOverviewApi = {
  keywordSearch: (wid: string, researchId: string, refresh = false) =>
    apiClient.post<AiOverview>(`/api/workspaces/${wid}/ai-overview/keyword-search/${researchId}?${q({ refresh: String(refresh) })}`, {}),

  actionPlan: (wid: string, did: string, refresh = false) =>
    apiClient.post<AiOverview>(`/api/workspaces/${wid}/domains/${did}/ai-overview/action-plan?${q({ refresh: String(refresh) })}`, {}),
}
