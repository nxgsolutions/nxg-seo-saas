"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { usePagePerformance, usePageTimeline, useSitePages } from "@/hooks/api/use-pages"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

export type PageSort = "checked" | "changed" | "score" | "url"
/** "site" = the active website, "other" = pages on other sites, "all". */
export type PageScope = "site" | "other" | "all"

/**
 * Page history state: the tracked-pages list (server-paged, filtered by the
 * active website), the selected page (?page=<id> so a refresh / shared link
 * reopens it), its timeline and its search performance.
 */
export function usePageHistoryScreen() {
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [scope, setScope] = React.useState<PageScope>("site")
  const [sort, setSort] = React.useState<PageSort>("checked")
  const [search, setSearch] = React.useState("")
  const q = useDebouncedValue(search.trim(), 300)
  const [listPage, setListPage] = React.useState(1)

  const domainFilter = scope === "site" ? activeDomain?.id ?? null : scope === "other" ? "other" : null
  const filterKey = `${workspaceId}|${domainFilter}|${q}|${sort}`
  const [seenKey, setSeenKey] = React.useState(filterKey)
  if (seenKey !== filterKey) { // new filter → back to page 1
    setSeenKey(filterKey)
    setListPage(1)
  }
  const list = useSitePages(workspaceId, scope === "site" && !activeDomain ? null : domainFilter, listPage, q, sort)
  const rows = list.data?.rows ?? []

  // Selected page: ?page= or, by default, the first row.
  const picked = params.get("page")
  const selectedId = picked ?? rows[0]?.id ?? null
  function select(id: string) {
    const next = new URLSearchParams(params.toString())
    next.set("page", id)
    router.replace(`${pathname}?${next.toString()}`, { scroll: false })
  }

  const [days, setDays] = React.useState(180)
  const timeline = usePageTimeline(workspaceId, selectedId)
  const performance = usePagePerformance(workspaceId, selectedId, days)

  return {
    workspaceId,
    activeDomain,
    filters: { scope, setScope, sort, setSort, search, setSearch },
    list: {
      rows,
      pagination: list.data?.pagination ?? null,
      page: listPage,
      setPage: setListPage,
      loading: list.isPending && Boolean(workspaceId),
      fetching: list.isFetching && !list.isPending,
    },
    selectedId,
    select,
    timeline: timeline.data ?? null,
    timelineLoading: Boolean(selectedId) && timeline.isPending,
    timelineError: timeline.isError,
    performance: performance.data ?? null,
    performanceLoading: Boolean(selectedId) && performance.isPending,
    days,
    setDays,
  }
}

export type PageHistoryScreen = ReturnType<typeof usePageHistoryScreen>
