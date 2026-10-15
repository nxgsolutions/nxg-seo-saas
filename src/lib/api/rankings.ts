/** Rank tracking API (domain-scoped tracked keywords + position entries). */
import { apiClient } from "./client"

export interface TrackedKeyword {
  id: string
  term: string
  latest_position: number | null
  previous_position: number | null
  best_position: number | null
  entry_count: number
  created_at: string
  // Signals from the shared keyword library (null when not known yet).
  search_volume: number | null
  difficulty: number | null
  intent: string | null
}

export interface RankEntry {
  id: string
  position: number | null
  recorded_at: string
}

const base = (wid: string, siteId: string) =>
  `/api/workspaces/${wid}/domains/${siteId}`

export const rankingsApi = {
  keywords: (wid: string, siteId: string) =>
    apiClient.get<TrackedKeyword[]>(`${base(wid, siteId)}/tracked-keywords`),

  addKeyword: (wid: string, siteId: string, term: string) =>
    apiClient.post<TrackedKeyword>(`${base(wid, siteId)}/tracked-keywords`, {
      term,
    }),

  removeKeyword: (wid: string, siteId: string, keywordId: string) =>
    apiClient.del<null>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}`
    ),

  entries: (wid: string, siteId: string, keywordId: string) =>
    apiClient.get<RankEntry[]>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}/entries`
    ),

  recordPosition: (
    wid: string,
    siteId: string,
    keywordId: string,
    position: number | null,
    recorded_at?: string
  ) =>
    apiClient.post<RankEntry>(
      `${base(wid, siteId)}/tracked-keywords/${keywordId}/entries`,
      { position, recorded_at: recorded_at ?? null }
    ),

  syncGsc: (wid: string, siteId: string) =>
    apiClient.post<{ synced: number; total: number; recorded_at: string }>(
      `${base(wid, siteId)}/tracked-keywords/sync-gsc`,
      {}
    ),

  // Create tracked keywords from the domain's top Search Console queries.
  importGsc: (wid: string, siteId: string) =>
    apiClient.post<{ imported: number; synced: number; total: number; recorded_at: string }>(
      `${base(wid, siteId)}/tracked-keywords/import-gsc`,
      {}
    ),

  syncSerp: (wid: string, siteId: string) =>
    apiClient.post<{ synced: number; total: number; recorded_at: string }>(
      `${base(wid, siteId)}/tracked-keywords/sync-serp`,
      {}
    ),
}
