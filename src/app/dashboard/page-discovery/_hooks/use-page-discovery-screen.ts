"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import {
  useCancelDiscovery,
  useDiscoverPages,
  usePageDiscoveryStatus,
  usePageDiscoverySummary,
} from "@/hooks/api/use-page-discovery"

/** Page Discovery screen state: ids (from the top bar), the latest scan status,
 * KPI summary, and the "Discover" action. Filters/pagination live in the table. */
export function usePageDiscoveryScreen() {
  const { activeWorkspace, activeDomain } = useDashboard()
  const wid = activeWorkspace?.id ?? null
  const did = activeDomain?.id ?? null

  const statusQuery = usePageDiscoveryStatus(wid, did)
  const status = statusQuery.data ?? null
  const isRunning = status?.status === "running"

  const summaryQuery = usePageDiscoverySummary(wid, did, isRunning)
  const discover = useDiscoverPages(wid, did)
  const cancel = useCancelDiscovery(wid, did)

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
  }
}

export type PageDiscoveryScreen = ReturnType<typeof usePageDiscoveryScreen>
