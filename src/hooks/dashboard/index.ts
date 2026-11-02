"use client"

/**
 * Dashboard global-state hooks — the public replacement for the old
 * `useDashboard()`. Selection state (active workspace/website) comes from Redux;
 * user/workspaces/domains come from TanStack Query. Import focused hooks from
 * here rather than reaching into the store or query layers directly.
 */

import * as React from "react"

import { useReloadDomains as useReloadDomainsForWorkspace } from "@/hooks/api/use-workspaces"
import { useActiveWorkspaceId } from "@/hooks/dashboard/use-active-workspace"
import type { Domain } from "@/lib/api/workspaces"

export { useUser } from "@/hooks/dashboard/use-user"
export {
  useActiveWorkspace,
  useActiveWorkspaceId,
  useWorkspaces,
  useSetActiveWorkspace,
} from "@/hooks/dashboard/use-active-workspace"
export {
  useActiveDomain,
  useWorkspaceDomains,
  useSetActiveDomain,
} from "@/hooks/dashboard/use-active-domain"
export { useActiveMarket } from "@/hooks/dashboard/use-active-market"
export { useLogout } from "@/hooks/api/use-session"
export { useRefreshWorkspaces } from "@/hooks/api/use-workspaces"

/** Reloads the active workspace's websites (no args — reads the active id). */
export function useReloadDomains(): () => Promise<Domain[]> {
  const activeId = useActiveWorkspaceId()
  const reload = useReloadDomainsForWorkspace(activeId)
  return React.useCallback(() => reload(), [reload])
}
