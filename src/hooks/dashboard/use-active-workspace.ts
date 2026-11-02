"use client"

import * as React from "react"

import { useWorkspacesQuery } from "@/hooks/api/use-workspaces"
import type { Workspace } from "@/lib/api/workspaces"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  selectActiveWorkspaceId,
  setActiveWorkspace,
} from "@/store/slices/workspace-slice"

/** The active workspace id (client selection state). */
export function useActiveWorkspaceId(): string | null {
  return useAppSelector(selectActiveWorkspaceId)
}

/** All workspaces (server data). */
export function useWorkspaces(): Workspace[] {
  const { data } = useWorkspacesQuery()
  return data ?? []
}

/** The active workspace object (selection joined with the workspaces list). */
export function useActiveWorkspace(): Workspace | null {
  const activeId = useActiveWorkspaceId()
  const workspaces = useWorkspaces()
  return React.useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? null,
    [workspaces, activeId]
  )
}

/** Sets the active workspace (persisted to localStorage by the store). */
export function useSetActiveWorkspace(): (id: string) => void {
  const dispatch = useAppDispatch()
  return React.useCallback(
    (id: string) => {
      dispatch(setActiveWorkspace(id))
    },
    [dispatch]
  )
}
