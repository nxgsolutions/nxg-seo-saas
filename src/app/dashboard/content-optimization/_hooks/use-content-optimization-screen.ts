"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import {
  useContentSession, useContentSessions, useKeywordOptions, useRunContentOptimization,
} from "@/hooks/api/use-content-optimization"
import { useSitePages } from "@/hooks/api/use-pages"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { errorMessage } from "@/lib/api/client"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { parseUrls } from "../_lib/content-optimization-helpers"

/**
 * Content Optimization page state. Data comes from TanStack Query hooks; this
 * hook only holds the form, the open session (mirrored in ?session= so a
 * refresh or shared link reopens it) and the history page/search.
 * `?url=` and `?keyword=` prefill the form (links from other pages).
 */
export function useContentOptimizationScreen() {
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const domainId = activeDomain?.id ?? null
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // ── Form ──
  const [url, setUrl] = React.useState(() => params.get("url") ?? "")
  const [keyword, setKeyword] = React.useState(() => params.get("keyword") ?? "")
  const [compareText, setCompareText] = React.useState("")
  const [showCompare, setShowCompare] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  // ── Open session (per workspace; switching workspace closes it) ──
  const [selection, setSelection] = React.useState<{ wid: string | null; id: string | null }>(
    () => ({ wid: workspaceId, id: params.get("session") }))
  const selectedId = selection.wid === workspaceId ? selection.id : null
  const sessionQuery = useContentSession(workspaceId, selectedId)

  function select(id: string | null) {
    setSelection({ wid: workspaceId, id })
    const next = new URLSearchParams(params.toString())
    next.delete("url")
    next.delete("keyword")
    if (id) next.set("session", id)
    else next.delete("session")
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  // ── History (server-paged + search) ──
  const [historyQ, setHistoryQ] = React.useState("")
  const q = useDebouncedValue(historyQ.trim(), 300)
  const [historyPage, setHistoryPage] = React.useState(1)
  const filterKey = `${workspaceId}|${q}`
  const [seenKey, setSeenKey] = React.useState(filterKey)
  if (seenKey !== filterKey) { // new search / workspace → back to page 1
    setSeenKey(filterKey)
    setHistoryPage(1)
  }
  const sessions = useContentSessions(workspaceId, historyPage, q)

  // ── Pickers ──
  const debouncedUrl = useDebouncedValue(url.trim(), 400)
  const keywordOptions = useKeywordOptions(workspaceId, domainId, debouncedUrl)
  // The active website's tracked pages (Page history), newest checked first.
  // Searched on the server by what's typed so ANY matching page surfaces — not
  // just the first page of rows. The scheme is stripped because url_key is
  // host+path (no scheme), so a full URL and a bare fragment both match.
  const pageSearch = debouncedUrl.replace(/^https?:\/\//i, "")
  const sitePages = useSitePages(workspaceId, domainId, 1, pageSearch, "checked", 100).data
  const siteHost = activeDomain?.domain ?? ""
  const pages = React.useMemo(() => {
    const out = siteHost ? [`https://${siteHost.replace(/^https?:\/\//, "")}/`] : []
    for (const p of sitePages?.rows ?? []) out.push(p.url)
    return [...new Set(out)]
  }, [sitePages, siteHost])

  // ── Run ──
  const run = useRunContentOptimization(workspaceId)
  function submit(event?: React.FormEvent) {
    event?.preventDefault()
    if (!workspaceId || run.isPending) return
    const target = url.trim()
    if (!target) {
      setFormError("Enter the page URL to optimize.")
      return
    }
    setFormError(null)
    run.mutate({
      url: target,
      keyword: keyword.trim() || null,
      domain_id: domainId,
      competitor_urls: showCompare ? parseUrls(compareText) : [],
    }, { onSuccess: (s) => select(s.id) })
  }

  /** Re-run the open session's page + keyword (after editing the page). */
  function rerun() {
    const s = sessionQuery.data
    if (!s) return
    // Pages the user typed have no Google position — compare with them again.
    const typed = s.result.competitors.filter((c) => c.position == null).map((c) => c.url)
    setUrl(s.url)
    setKeyword(s.keyword ?? "")
    run.mutate({ url: s.url, keyword: s.keyword, domain_id: domainId, competitor_urls: typed },
      { onSuccess: (n) => select(n.id) })
  }

  const runError = run.isError ? errorMessage(run.error, "Could not analyze this page.") : null

  return {
    workspaceId,
    form: {
      url, setUrl, keyword, setKeyword, compareText, setCompareText, showCompare, setShowCompare,
      error: formError ?? runError, clearError: () => { setFormError(null); run.reset() },
    },
    pages,
    keywordOptions: keywordOptions.data?.keywords ?? [],
    keywordOptionsLoading: keywordOptions.isPending && Boolean(domainId),
    aiAvailable: keywordOptions.data?.ai_available ?? true,
    running: run.isPending,
    runningUrl: run.isPending ? run.variables?.url ?? "" : "",
    submit,
    rerun,
    selectedId,
    select,
    session: sessionQuery.data ?? null,
    sessionLoading: Boolean(selectedId) && sessionQuery.isPending,
    sessionError: sessionQuery.isError,
    history: {
      q: historyQ, setQ: setHistoryQ, page: historyPage, setPage: setHistoryPage,
      rows: sessions.data?.rows ?? [],
      pagination: sessions.data?.pagination ?? null,
      loading: sessions.isPending && Boolean(workspaceId),
      fetching: sessions.isFetching && !sessions.isPending,
    },
  }
}

export type ContentOptimizationScreen = ReturnType<typeof useContentOptimizationScreen>
