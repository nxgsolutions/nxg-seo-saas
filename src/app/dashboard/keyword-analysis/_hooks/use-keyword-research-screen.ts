"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useRecentKeywordSearches } from "@/hooks/api/use-keyword-search"
import type { ResearchSummary } from "@/lib/api/keyword-search"
import { useRouter } from "next/navigation"
import * as React from "react"

/** Keyword Analysis page state: the recent-searches query and which saved
 * search is open (`activeId`). Data loading lives in hooks/api. */
export function useKeywordResearchScreen() {
  const { activeWorkspace } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const router = useRouter()
  const recent = useRecentKeywordSearches(workspaceId)
  const [activeId, setActiveId] = React.useState<string | null>(null)

  // Keyword searches reopen here (from cache / DB); a domain entry (older data)
  // opens that domain in Competitive Strategy instead.
  const openSearch = React.useCallback((item: ResearchSummary) => {
    if (item.kind === "domain") {
      const d = item.target ?? item.seed_keyword
      router.push(`/dashboard/competitive-strategy?competitor=${encodeURIComponent(d)}`)
      return
    }
    setActiveId(item.id)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [router])

  return { workspaceId, recent, activeId, setActiveId, openSearch }
}
