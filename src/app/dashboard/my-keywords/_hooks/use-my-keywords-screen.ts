"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useAddToRankTracking, useRemoveSavedKeyword } from "@/hooks/api/use-keyword-actions"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { ApiError, errorMessage } from "@/lib/api/client"
import { myKeywordsApi, type MyKeywordsSort, type SavedKeyword } from "@/lib/api/my-keywords"
import { fetchAllPages } from "@/lib/api/pagination"
import { queryKeys } from "@/lib/query/keys"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"

export const PAGE_SIZE = 25

/**
 * My Keywords page state: search, sort and page (server-side), the keyword
 * waiting for remove confirmation, rank tracking from the list, CSV export.
 * Everything is for the ACTIVE website (top-bar switcher).
 */
export function useMyKeywordsScreen() {
  const { activeWorkspace, activeDomain, domainsLoading } = useDashboard()
  const wid = activeWorkspace?.id ?? null
  const did = activeDomain?.id ?? null

  const [search, setSearch] = React.useState("")
  const q = useDebouncedValue(search.trim(), 300)
  const [sort, setSort] = React.useState<{ key: MyKeywordsSort; desc: boolean }>({ key: "added", desc: true })
  const [page, setPage] = React.useState(1)
  const filterKey = `${wid}|${did}|${q}|${sort.key}|${sort.desc}`
  const [seenKey, setSeenKey] = React.useState(filterKey)
  if (seenKey !== filterKey) { // new website / search / sort → page 1
    setSeenKey(filterKey)
    setPage(1)
  }

  const order = sort.desc ? "desc" : "asc"
  const list = useQuery({
    queryKey: queryKeys.myKeywords.list(wid ?? "", did ?? "", page, q, sort.key, order),
    queryFn: () => myKeywordsApi.list(wid!, did!, { page, pageSize: PAGE_SIZE, q, sort: sort.key, order }),
    enabled: Boolean(wid && did),
    placeholderData: keepPreviousData,
  })

  // Remove (confirmed in a dialog).
  const [toRemove, setToRemove] = React.useState<SavedKeyword | null>(null)
  const removeMutation = useRemoveSavedKeyword(wid, did)
  async function confirmRemove() {
    if (!toRemove) return
    await removeMutation.mutateAsync(toRemove.id)
    toast.success(`Removed “${toRemove.keyword}” from Saved Keywords`)
  }

  // Track a saved keyword's Google rank.
  const track = useAddToRankTracking(wid, did)
  const [trackingId, setTrackingId] = React.useState<string | null>(null)
  function trackRank(row: SavedKeyword) {
    setTrackingId(row.id)
    track.mutate(row.keyword, {
      onSuccess: () => toast.success(`Tracking Google rank for “${row.keyword}”`),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) toast.info(`“${row.keyword}” is already tracked`)
        else toast.error(errorMessage(err, "Could not start rank tracking."))
      },
      onSettled: () => setTrackingId(null),
    })
  }

  // CSV of the whole list (all pages, current search + sort).
  const [exporting, setExporting] = React.useState(false)
  async function exportCsv() {
    if (!wid || !did) return
    setExporting(true)
    try {
      const rows = await fetchAllPages((p, size) => myKeywordsApi.list(wid, did, { page: p, pageSize: size, q, sort: sort.key, order }))
      const head = ["Keyword", "Search volume", "CPC", "Difficulty", "Intent", "Google rank", "Country", "Saved on"]
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
      const lines = [head, ...rows.map((r) => [r.keyword, r.search_volume, r.cpc, r.difficulty, r.intent,
        r.rank_tracked ? r.position ?? "not in top 100" : "", r.country.toUpperCase(), r.created_at.slice(0, 10)])]
      const blob = new Blob([lines.map((l) => l.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" })
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)
      a.download = `my-keywords-${activeDomain?.domain ?? "site"}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (err) {
      toast.error(errorMessage(err, "Could not export the list."))
    } finally {
      setExporting(false)
    }
  }

  return {
    wid, did, activeDomain, noWebsite: !domainsLoading && !did,
    search, setSearch, sort, setSort, page, setPage,
    rows: list.data?.rows ?? [],
    pagination: list.data?.pagination ?? null,
    loading: list.isPending && Boolean(wid && did),
    fetching: list.isFetching && !list.isPending,
    error: list.isError ? errorMessage(list.error, "Could not load Saved Keywords.") : null,
    hasSearch: Boolean(q),
    toRemove, setToRemove, confirmRemove,
    trackRank, trackingId,
    exportCsv, exporting,
  }
}

export type MyKeywordsScreen = ReturnType<typeof useMyKeywordsScreen>
