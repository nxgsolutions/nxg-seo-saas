"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { ApiError } from "@/lib/api/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useCurrentUserQuery } from "@/hooks/api/use-session"
import { useWorkspacesQuery } from "@/hooks/api/use-workspaces"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { loadActiveWorkspaceId } from "@/store/persist"
import {
  selectActiveWorkspaceId,
  setActiveWorkspace,
} from "@/store/slices/workspace-slice"

/**
 * Loads the session + workspaces and gates the dashboard shell until they are
 * ready — the job the old DashboardProvider did, minus holding the state
 * (which now lives in Query + Redux). Redirects unauthenticated users to login
 * and un-onboarded users to onboarding, and picks the initial active workspace
 * (stored id if still valid, else the first one).
 */
export function DashboardGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const activeId = useAppSelector(selectActiveWorkspaceId)

  const userQuery = useCurrentUserQuery()
  const workspacesQuery = useWorkspacesQuery()

  const user = userQuery.data
  const workspaces = workspacesQuery.data
  const error = userQuery.error ?? workspacesQuery.error
  const is401 = error instanceof ApiError && error.status === 401

  // Not authenticated -> login. Not onboarded -> onboarding.
  React.useEffect(() => {
    if (is401) {
      router.replace("/login?next=/dashboard")
    }
  }, [is401, router])
  React.useEffect(() => {
    if (user && !user.is_onboarded) {
      router.replace("/onboarding")
    }
  }, [user, router])

  // Pick the initial active workspace once the list is in and none is chosen
  // (or the chosen one no longer exists).
  React.useEffect(() => {
    if (!workspaces) return
    if (activeId && workspaces.some((w) => w.id === activeId)) return
    const stored = loadActiveWorkspaceId()
    const initial =
      (stored && workspaces.some((w) => w.id === stored) ? stored : null) ??
      workspaces[0]?.id ??
      null
    if (initial) dispatch(setActiveWorkspace(initial))
  }, [workspaces, activeId, dispatch])

  if (error && !is401) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Alert className="max-w-md">
          <AlertTitle>Dashboard unavailable</AlertTitle>
          <AlertDescription>
            <p>
              We couldn’t load your workspace. Check your connection and try
              again.
            </p>
            <Button
              className="mt-3"
              onClick={() => {
                userQuery.refetch()
                workspacesQuery.refetch()
              }}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Wait for an onboarded user, the workspaces list, and (when any workspaces
  // exist) a chosen active workspace — so pages never start on "no workspace"
  // and then jump once the initial pick lands.
  const ready = Boolean(
    user?.is_onboarded &&
      workspaces &&
      (workspaces.length === 0 || activeId)
  )

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  return <>{children}</>
}
