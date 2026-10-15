"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import * as React from "react"
import { TABS } from "../_lib/opportunity-research-helpers"

export function useOpportunityResearchScreen() {

  // The domain picked in the top bar.
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const domainId = activeDomain?.id ?? ""

  const [tab, setTab] = React.useState<(typeof TABS)[number]["key"]>("action")


  const ready = !!workspaceId && !!domainId
  return { workspaceId, domainId, tab, setTab, ready }
}
