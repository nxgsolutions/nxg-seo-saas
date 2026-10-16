/** Workspaces API surface. Mirrors the FastAPI /api/workspaces routes. */
import { apiClient } from "./client"

export interface Workspace {
  id: string
  name: string
  slug: string
  role: string
  member_count: number
  created_at: string
  /** DataForSEO Sandbox workspace: free dummy data, isolated from live data. */
  is_sandbox: boolean
  /** Workspace-wide defaults used by keyword/SERP tools and dates. */
  default_country: string
  default_language: string
  timezone: string
}

export interface WorkspaceSettings {
  name?: string
  default_country?: string
  default_language?: string
  timezone?: string
}

export interface WorkspaceMember {
  user_id: string
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
}

export interface Domain {
  id: string
  workspace_id: string
  name: string
  domain: string
  /** Per-domain market + niche. Empty country/language fall back to the
   * workspace default, then to India/English. */
  country: string | null
  language: string | null
  /** Comma-separated on-topic terms (auto-derived, user-editable). */
  topic_terms: string | null
  /** Comma-separated competitor/own brand terms to exclude. */
  brand_terms: string | null
  /** Local business: keep "near me" keywords. */
  is_local: boolean
  /** Industry category id (null = uncategorized). Names resolve via the
   * categories API. Drives category-scoped competitor suggestions. */
  category_id: string | null
  created_at: string
}

export interface DomainSettings {
  name?: string
  country?: string
  language?: string
  topic_terms?: string
  brand_terms?: string
  is_local?: boolean
  /** Omit to leave unchanged; null clears the category. */
  category_id?: string | null
}

export const workspacesApi = {
  list: () => apiClient.get<Workspace[]>("/api/workspaces"),

  create: (name: string, opts: { isSandbox?: boolean } = {}) =>
    apiClient.post<Workspace>("/api/workspaces", { name, is_sandbox: opts.isSandbox ?? false }),

  rename: (workspaceId: string, name: string) =>
    apiClient.patch<Workspace>(`/api/workspaces/${workspaceId}`, { name }),

  /** Partial update: rename and/or change the workspace defaults. */
  update: (workspaceId: string, settings: WorkspaceSettings) =>
    apiClient.patch<Workspace>(`/api/workspaces/${workspaceId}`, settings),

  members: (workspaceId: string) =>
    apiClient.get<WorkspaceMember[]>(`/api/workspaces/${workspaceId}/members`),

  addMember: (workspaceId: string, email: string, role: string) =>
    apiClient.post<WorkspaceMember>(`/api/workspaces/${workspaceId}/members`, {
      email,
      role,
    }),

  removeMember: (workspaceId: string, userId: string) =>
    apiClient.del<null>(`/api/workspaces/${workspaceId}/members/${userId}`),

  setMemberRole: (workspaceId: string, userId: string, role: string) =>
    apiClient.patch<WorkspaceMember>(
      `/api/workspaces/${workspaceId}/members/${userId}`,
      { role }
    ),

  domains: (workspaceId: string) =>
    apiClient.get<Domain[]>(`/api/workspaces/${workspaceId}/domains`),

  addDomain: (workspaceId: string, url: string, opts: { name?: string; categoryId?: string | null } = {}) =>
    apiClient.post<Domain>(`/api/workspaces/${workspaceId}/domains`, {
      url,
      name: opts.name,
      category_id: opts.categoryId ?? null,
    }),

  /** Partial update of a domain's market + niche. */
  updateDomain: (workspaceId: string, domainId: string, settings: DomainSettings) =>
    apiClient.patch<Domain>(`/api/workspaces/${workspaceId}/domains/${domainId}`, settings),

  /** Suggest niche topic terms by crawling the site (does not save). */
  deriveDomainTopics: (workspaceId: string, domainId: string) =>
    apiClient.post<{ terms: string[] }>(
      `/api/workspaces/${workspaceId}/domains/${domainId}/derive-topics`, {}),

  /** Owner/admin only. Permanently removes the domain and all of its data. */
  deleteDomain: (workspaceId: string, domainId: string) =>
    apiClient.del<null>(`/api/workspaces/${workspaceId}/domains/${domainId}`),
}
