"use client"

import { useActiveDomain } from "@/hooks/dashboard"

/** Tracked Competitors page: the website picked in the top bar. Data lives in
 * hooks/api/use-competitors (cached; edits refresh dependent panels). */
export function useCompetitorsScreen() {
  const activeDomain = useActiveDomain()
  return { domainId: activeDomain?.id ?? "" }
}
