"use client"

import * as React from "react"

import { useActiveWorkspaceId } from "@/hooks/dashboard/use-active-workspace"
import { useWorkspaceDomainsQuery } from "@/hooks/api/use-workspaces"
import type { Domain } from "@/lib/api/workspaces"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { readStoredDomainId } from "@/store/persist"
import { selectChosenDomainId, setActiveDomain } from "@/store/slices/domain-slice"

/** Websites of the active workspace, plus their loading flag. */
export function useWorkspaceDomains(): { domains: Domain[]; loading: boolean } {
  const activeId = useActiveWorkspaceId()
  const query = useWorkspaceDomainsQuery(activeId)
  return {
    domains: query.data ?? [],
    loading: Boolean(activeId) && query.isLoading,
  }
}

/**
 * The active website. Resolution matches the old DashboardContext: the website
 * chosen this session, else the one remembered in localStorage, else the first
 * website; a stale/unknown choice falls back to the first.
 */
export function useActiveDomain(): Domain | null {
  const activeId = useActiveWorkspaceId()
  const chosen = useAppSelector(selectChosenDomainId(activeId))
  const { domains } = useWorkspaceDomains()
  return React.useMemo(() => {
    if (!activeId) return null
    const wanted = chosen ?? readStoredDomainId(activeId)
    return domains.find((d) => d.id === wanted) ?? domains[0] ?? null
  }, [activeId, chosen, domains])
}

/** Sets the active website for the active workspace (persisted by the store). */
export function useSetActiveDomain(): (domainId: string) => void {
  const dispatch = useAppDispatch()
  const activeId = useActiveWorkspaceId()
  return React.useCallback(
    (domainId: string) => {
      if (!activeId) return
      dispatch(setActiveDomain({ workspaceId: activeId, domainId }))
    },
    [dispatch, activeId]
  )
}
