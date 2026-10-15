"use client"

/** Workspace members (TanStack Query). `setMembers` edits the cached list in
 * place, so invite / remove / optimistic role changes update every screen. */

import { useQuery, useQueryClient } from "@tanstack/react-query"
import * as React from "react"

import { workspacesApi, type WorkspaceMember } from "@/lib/api/workspaces"
import { queryKeys } from "@/lib/query/keys"

export function useMembers(wid: string | null) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.members(wid ?? ""),
    queryFn: () => workspacesApi.members(wid!),
    enabled: Boolean(wid),
  })
  const setMembers = React.useCallback(
    (next: WorkspaceMember[] | ((prev: WorkspaceMember[]) => WorkspaceMember[])) =>
      qc.setQueryData<WorkspaceMember[]>(queryKeys.members(wid ?? ""), (prev = []) =>
        typeof next === "function" ? next(prev) : next),
    [qc, wid],
  )
  return { ...query, members: query.data ?? [], setMembers }
}
