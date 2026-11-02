"use client"

import { useActiveDomain } from "@/hooks/dashboard/use-active-domain"
import { useActiveWorkspace } from "@/hooks/dashboard/use-active-workspace"

/**
 * Resolved market for the active website: the website's own country/language,
 * else the workspace default, else India/English. Same precedence as the old
 * `useDashboard().activeCountry` / `activeLanguage`.
 */
export function useActiveMarket(): { country: string; language: string } {
  const domain = useActiveDomain()
  const workspace = useActiveWorkspace()
  const country = domain?.country || workspace?.default_country || "in"
  const language = domain?.language || workspace?.default_language || "en"
  return { country, language }
}
