"use client"

import * as React from "react"

import { useDashboard } from "@/components/dashboard/dashboard-context"

/**
 * Remounts the page whenever the active workspace OR website changes.
 *
 * Pages keep per-site state (loaded results, open panels, the competitor being
 * viewed). Workspaces and websites have different domain ids, so without a
 * remount a page could keep showing the previous site's data until a manual
 * refresh. Keying the subtree on both ids resets all of it at once — the same
 * as a refresh, minus the full reload. Waits for the websites to load so pages
 * never start on "no website" and then jump.
 */
export function WorkspaceScope({ children }: { children: React.ReactNode }) {
  const { activeWorkspace, activeDomain, domainsLoading } = useDashboard()
  if (domainsLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }
  return (
    <React.Fragment key={`${activeWorkspace?.id ?? "none"}:${activeDomain?.id ?? "none"}`}>
      {children}
    </React.Fragment>
  )
}
