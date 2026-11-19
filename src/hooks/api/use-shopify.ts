"use client"

/** Shopify connection (TanStack Query), scoped to the active workspace domain. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { DiscoveryRun } from "@/lib/api/page-discovery"
import { shopifyApi, type ShopifyPublishInput } from "@/lib/api/shopify"
import { queryKeys } from "@/lib/query/keys"

export const shopifyKey = (wid: string, did: string) => ["ws", wid, "shopify", did] as const

export function useShopifyStatus(wid: string | null, did: string | null) {
  return useQuery({
    queryKey: shopifyKey(wid ?? "", did ?? ""),
    queryFn: () => shopifyApi.status(wid!, did!),
    enabled: Boolean(wid && did),
  })
}

/** Start the Shopify OAuth flow (redirects the browser to the store admin). */
export function useConnectShopify(wid: string | null, did: string | null) {
  return useMutation({
    mutationFn: ({ shop, returnPath }: { shop: string; returnPath: string }) =>
      shopifyApi.connect(wid!, did!, shop, returnPath),
    onSuccess: ({ install_url }) => {
      window.location.href = install_url
    },
  })
}

export function useDisconnectShopify(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => shopifyApi.disconnect(wid!, did!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ws", wid ?? "", "shopify"] }),
  })
}

/** Start a Shopify import; seeds the Page Discovery status cache to 'running'
 * so the existing progress banner and polling start immediately. */
export function useShopifySync(wid: string | null, did: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => shopifyApi.sync(wid!, did!),
    onSuccess: (run: DiscoveryRun) => {
      qc.setQueryData([...queryKeys.pageDiscovery(wid ?? "", did ?? ""), "status"], run)
      void qc.invalidateQueries({ queryKey: shopifyKey(wid ?? "", did ?? "") })
    },
  })
}

const editorKey = (wid: string, did: string, pageId: string) => [...shopifyKey(wid, did), "editor", pageId] as const

/** Live Shopify values for one imported page (editor). Never auto-refetches,
 * so the draft being edited isn't silently replaced. */
export function useShopifyEditor(wid: string | null, did: string | null, pageId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: editorKey(wid ?? "", did ?? "", pageId ?? ""),
    queryFn: () => shopifyApi.editor(wid!, did!, pageId!),
    enabled: enabled && Boolean(wid && did && pageId),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  })
}

export function useShopifyHistory(wid: string | null, did: string | null, pageId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [...editorKey(wid ?? "", did ?? "", pageId ?? ""), "history"],
    queryFn: () => shopifyApi.history(wid!, did!, pageId!),
    enabled: enabled && Boolean(wid && did && pageId),
  })
}

function invalidateAfterPublish(qc: ReturnType<typeof useQueryClient>, wid: string, did: string, pageId: string) {
  void qc.invalidateQueries({ queryKey: [...editorKey(wid, did, pageId), "history"] })
  void qc.invalidateQueries({ queryKey: [...queryKeys.pageDiscovery(wid, did), "list"] })
}

export function usePublishShopify(wid: string | null, did: string | null, pageId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ShopifyPublishInput) => shopifyApi.publish(wid!, did!, pageId!, body),
    onSettled: () => invalidateAfterPublish(qc, wid ?? "", did ?? "", pageId ?? ""),
  })
}

export function useRevertShopify(wid: string | null, did: string | null, pageId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (logId: string) => shopifyApi.revert(wid!, did!, pageId!, logId),
    onSettled: () => invalidateAfterPublish(qc, wid ?? "", did ?? "", pageId ?? ""),
  })
}
