"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"

/** Tracked Competitors page: the website picked in the top bar. Data lives in
 * hooks/api/use-competitors (cached; edits refresh dependent panels). */
export function useCompetitorsScreen() {
  const { activeDomain } = useDashboard()
  return { domainId: activeDomain?.id ?? "" }
}
