/** Shopify integration API (one store per workspace domain). */
import { apiClient } from "./client"
import type { DiscoveryRun } from "./page-discovery"

export interface ShopifyStatus {
  configured: boolean
  connected: boolean
  status: "active" | "revoked" | null
  shop: string | null
  shop_name: string | null
  primary_host: string | null
  shop_hosts: string[]
  scopes: string | null
  installed_at: string | null
  last_sync_at: string | null
  last_sync_error: string | null
  webhooks_enabled: boolean
}

export interface ShopifyConnectResponse {
  install_url: string
}

export interface ShopifyImage {
  id: string
  alt: string
  url: string | null
}

/** Live values of one product/page (empty SEO fields = storefront falls back to the title). */
export interface ShopifyEditorFields {
  external_type: "product" | "page"
  external_id: string
  title: string
  body_html: string
  seo_title: string
  seo_description: string
  handle: string
  url: string
  published: boolean
  updated_at: string | null
  images: ShopifyImage[]
  admin_url: string | null
}

/** Only edited fields are sent; omitted ones are left unchanged in Shopify. */
export interface ShopifyPublishInput {
  title?: string
  body_html?: string
  seo_title?: string
  seo_description?: string
  handle?: string
  image_alts?: Record<string, string>
  expected_updated_at?: string | null
  force?: boolean
}

export interface ShopifyPublishResult {
  status: "published" | "unchanged"
  changed: string[]
  redirect_created: boolean
  warnings: string[]
  item: ShopifyEditorFields
  log_id: string | null
}

export interface ShopifyPushLogEntry {
  id: string
  action: "publish" | "revert"
  status: "ok" | "conflict" | "error"
  error: string | null
  redirect_created: boolean
  changed: string[]
  before: Record<string, unknown>
  after: Record<string, unknown>
  created_at: string
  user_email: string | null
}

/** Body of a 409 from publish: Shopify changed after the editor loaded. */
export interface ShopifyConflictBody {
  detail: string
  code: "shopify_conflict"
  current: ShopifyEditorFields
}

const base = (wid: string, did: string) => `/api/workspaces/${wid}/domains/${did}/shopify`

export const shopifyApi = {
  status: (wid: string, did: string) => apiClient.get<ShopifyStatus>(base(wid, did)),
  connect: (wid: string, did: string, shop: string, returnPath: string) =>
    apiClient.post<ShopifyConnectResponse>(`${base(wid, did)}/connect`, { shop, return_path: returnPath }),
  disconnect: (wid: string, did: string) => apiClient.del<null>(base(wid, did)),
  /** Import every product and page into Page Discovery (background). */
  sync: (wid: string, did: string) => apiClient.post<DiscoveryRun>(`${base(wid, did)}/sync`, {}),
  editor: (wid: string, did: string, pageId: string) => apiClient.get<ShopifyEditorFields>(editorBase(wid, did, pageId)),
  publish: (wid: string, did: string, pageId: string, body: ShopifyPublishInput) =>
    apiClient.put<ShopifyPublishResult>(editorBase(wid, did, pageId), body, { timeout: 60_000 }),
  history: (wid: string, did: string, pageId: string) =>
    apiClient.get<ShopifyPushLogEntry[]>(`${editorBase(wid, did, pageId)}/history`),
  revert: (wid: string, did: string, pageId: string, logId: string) =>
    apiClient.post<ShopifyPublishResult>(`${editorBase(wid, did, pageId)}/revert/${logId}`, {}, { timeout: 60_000 }),
}

const editorBase = (wid: string, did: string, pageId: string) =>
  `/api/workspaces/${wid}/domains/${did}/page-discovery/pages/${pageId}/shopify`

/** Shopify admin URL for an imported product/page (from its GID). */
export function shopifyAdminUrl(shop: string | null, externalType: string | null, gid: string | null): string | null {
  if (!shop || !gid) return null
  const id = gid.split("/").pop()
  if (!id) return null
  return `https://${shop}/admin/${externalType === "page" ? "pages" : "products"}/${id}`
}
