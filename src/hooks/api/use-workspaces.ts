"use client"

/**
 * Workspaces and their websites (domains) as server state. These used to be
 * fetched imperatively inside DashboardContext; they now live in TanStack Query
 * so they share the app's server-state layer. Which workspace/website is
 * *active* is client state and lives in Redux (see `@/hooks/dashboard`).
 */

import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { queryKeys } from "@/lib/query/keys"
import { workspacesApi, type Domain, type Workspace } from "@/lib/api/workspaces"

/** All workspaces the user belongs to. */
export function useWorkspacesQuery() {
  return useQuery({
    queryKey: queryKeys.workspaces.all(),
    queryFn: () => workspacesApi.list(),
  })
}

/** Websites of a workspace. Disabled until a workspace id is known. */
export function useWorkspaceDomainsQuery(workspaceId: string | null) {
  return useQuery({
    queryKey: queryKeys.workspaces.domains(workspaceId ?? ""),
    queryFn: () => workspacesApi.domains(workspaceId!),
    enabled: Boolean(workspaceId),
  })
}

/** Refetches the workspaces list and returns the fresh list. */
export function useRefreshWorkspaces() {
  const qc = useQueryClient()
  return React.useCallback(
    () =>
      qc.fetchQuery({
        queryKey: queryKeys.workspaces.all(),
        queryFn: () => workspacesApi.list(),
      }) as Promise<Workspace[]>,
    [qc]
  )
}

/** Refetches the active workspace's websites and returns the fresh list. */
export function useReloadDomains(workspaceId: string | null) {
  const qc = useQueryClient()
  return React.useCallback(async (): Promise<Domain[]> => {
    if (!workspaceId) return []
    return qc.fetchQuery({
      queryKey: queryKeys.workspaces.domains(workspaceId),
      queryFn: () => workspacesApi.domains(workspaceId),
    })
  }, [qc, workspaceId])
}
