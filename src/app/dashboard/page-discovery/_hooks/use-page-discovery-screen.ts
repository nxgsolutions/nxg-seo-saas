"use client"

import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"
import {
  useCancelDiscovery,
  useDiscoverPages,
  usePageDiscoveryStatus,
  usePageDiscoverySummary,
} from "@/hooks/api/use-page-discovery"
import { useShopifyStatus, useShopifySync } from "@/hooks/api/use-shopify"

/** Page Discovery screen state: ids (from the top bar), the latest scan status,
 * KPI summary, and the "Discover" action. Filters/pagination live in the table. */
export function usePageDiscoveryScreen() {
  const activeWorkspace = useActiveWorkspace()
  const activeDomain = useActiveDomain()
  const wid = activeWorkspace?.id ?? null
  const did = activeDomain?.id ?? null

  const statusQuery = usePageDiscoveryStatus(wid, did)
  const status = statusQuery.data ?? null
  const isRunning = status?.status === "running"

  const summaryQuery = usePageDiscoverySummary(wid, did, isRunning)
  const discover = useDiscoverPages(wid, did)
  const cancel = useCancelDiscovery(wid, did)
  const shopifyStatus = useShopifyStatus(wid, did)
  const shopifySync = useShopifySync(wid, did)
  const shopify = shopifyStatus.data?.connected ? shopifyStatus.data : null

  return {
    wid,
    did,
    domain: activeDomain,
    status,
    isRunning,
    statusLoading: statusQuery.isPending && Boolean(did),
    summary: summaryQuery.data ?? null,
    summaryLoading: summaryQuery.isPending && Boolean(did),
    discover,
    cancel,
    /** Connected Shopify store for this domain (null when not connected). */
    shopify,
    shopifyConfigured: Boolean(shopifyStatus.data?.configured),
    shopifySync,
    canManage: activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin",
  }
}

export type PageDiscoveryScreen = ReturnType<typeof usePageDiscoveryScreen>
