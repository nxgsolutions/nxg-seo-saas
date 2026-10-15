/**
 * My Keywords API — a website's saved keyword list (private per website).
 * Metrics (volume, CPC, difficulty, intent) and the tracked Google rank are
 * joined on the server when the list is read, so they're always current.
 */
import { apiClient } from "./client"
import { listParams, type ListParams, type Paged } from "./pagination"

export interface SavedKeyword {
  id: string
  keyword: string
  country: string
  language: string
  source: string | null
  created_at: string
  search_volume: number | null
  cpc: number | null
  difficulty: number | null
  competition: number | null
  intent: string | null
  metrics_date: string | null
  /** Tracked in Rank Tracking. */
  rank_tracked: boolean
  position: number | null
  previous_position: number | null
  rank_date: string | null
}

export type MyKeywordsSort = "added" | "keyword" | "volume" | "cpc" | "difficulty" | "rank"

const base = (wid: string, did: string) => `/api/workspaces/${wid}/domains/${did}/my-keywords`

export const myKeywordsApi = {
  list: (wid: string, did: string, p: ListParams) =>
    apiClient.get<Paged<SavedKeyword>>(base(wid, did), { params: listParams(p) }),

  /** Normalized saved keywords (to mark rows as saved). */
  keys: (wid: string, did: string) => apiClient.get<string[]>(`${base(wid, did)}/keys`),

  save: (wid: string, did: string, keyword: string, opts: { country?: string; language?: string; source?: string } = {}) =>
    apiClient.post<{ id: string; keyword: string; created: boolean }>(base(wid, did), { keyword, ...opts }),

  remove: (wid: string, did: string, id: string) => apiClient.del<void>(`${base(wid, did)}/${id}`),
}

export const normalizeKeyword = (k: string) => k.toLowerCase().split(/\s+/).filter(Boolean).join(" ")
