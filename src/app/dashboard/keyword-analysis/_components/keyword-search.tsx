"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useKeywordSearch, useRunKeywordSearch } from "@/hooks/api/use-keyword-search"
import { errorMessage } from "@/lib/api/client"
import { Search } from "lucide-react"
import * as React from "react"
import { KeywordResults } from "./keyword-results"
import { KeywordResultsSkeleton } from "./keyword-skeletons"
import { SearchBar } from "./search-bar"

/**
 * Search box + the open search's results.
 *
 * `activeId` (owned by the page) is the saved search on screen: set by a new
 * search here or by picking one from Recent searches. Data comes from TanStack
 * Query, so reopening a search is instant from cache.
 */
export function KeywordSearch({ workspaceId, activeId, onShow, query }: {
  workspaceId: string | null
  activeId: string | null
  onShow: (id: string) => void
  /** From the URL (?q=…) — the "+" keyword menu's "View more ideas" links here. */
  query?: string | null
}) {
  const { activeWorkspace, activeDomain } = useDashboard()
  const resultsRef = React.useRef<HTMLDivElement>(null)
  const [seed, setSeed] = React.useState("")
  // Start from the workspace defaults (Settings → Workspace defaults); the user
  // can still change them per search. Resync when the workspace is switched.
  const wsCountry = activeWorkspace?.default_country ?? "in"
  const wsLang = activeWorkspace?.default_language ?? "en"
  const [language, setLanguage] = React.useState(wsLang)
  const [location, setLocation] = React.useState(wsCountry)
  const [wsKey, setWsKey] = React.useState(activeWorkspace?.id ?? "")
  if ((activeWorkspace?.id ?? "") !== wsKey) {
    setWsKey(activeWorkspace?.id ?? "")
    setLanguage(wsLang)
    setLocation(wsCountry)
  }
  const [inputError, setInputError] = React.useState<string | null>(null)

  const runSearch = useRunKeywordSearch(workspaceId)
  const opened = useKeywordSearch(workspaceId, activeId)
  const detail = opened.data ?? null

  // Opening a saved search fills the box with its keyword (adjusted during render).
  const [shownId, setShownId] = React.useState<string | null>(null)
  if (detail && detail.id !== shownId) {
    setShownId(detail.id)
    setSeed(detail.seed_keyword)
  }

  function search(term: string, scrollToResults = false) {
    if (!workspaceId) return
    if (!term.trim()) { setInputError("Enter a seed keyword."); return }
    setInputError(null)
    runSearch.mutate({ seed: term.trim(), country: location, language }, {
      onSuccess: (d) => {
        onShow(d.id)
        if (scrollToResults) requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
      },
    })
  }

  // Opened from a keyword's "+" menu ("View more ideas"): search that keyword once.
  const lastQuery = React.useRef("")
  React.useEffect(() => {
    if (!query || !workspaceId || lastQuery.current === query) return
    lastQuery.current = query
    setSeed(query)
    search(query, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per new ?q
  }, [query, workspaceId])

  const running = runSearch.isPending
  const opening = Boolean(activeId) && opened.isPending
  const error = inputError
    ?? (runSearch.isError ? errorMessage(runSearch.error, "Could not run keyword search.") : null)
    ?? (opened.isError ? errorMessage(opened.error, "Could not load that search.") : null)

  return (
    <div className="space-y-5">
      <SearchBar
        value={seed} onChange={setSeed} language={language} setLanguage={setLanguage}
        location={location} setLocation={setLocation} loading={running || !workspaceId}
        placeholder="e.g. upsc pyq" label="Discover new keywords" icon={<Search className="size-4" />}
        onSubmit={(e) => { e?.preventDefault(); search(seed) }}
      />

      {error ? <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert> : null}

      <div ref={resultsRef} className="scroll-mt-20 space-y-5">
        {running ? (
          <KeywordResultsSkeleton label={`Finding keyword ideas for “${seed.trim()}”… this can take a few seconds.`} />
        ) : opening ? (
          <KeywordResultsSkeleton label="Opening saved search…" />
        ) : detail && workspaceId ? (
          <KeywordResults key={detail.id} detail={detail} workspaceId={workspaceId} domainId={activeDomain?.id ?? null} />
        ) : null}
      </div>
    </div>
  )
}
