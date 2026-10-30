"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useRunPageScore } from "@/hooks/api/use-page-score"
import { useSitePages } from "@/hooks/api/use-pages"
import { errorMessage } from "@/lib/api/client"
import type { PageScoreDetail } from "@/lib/api/page-score"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { hostOf } from "../_lib/page-score-helpers"

/**
 * Overall Page Score state. The result lives in component memory (the saved
 * record is in Page history); ?url= prefills the form (links from other pages).
 */
export function usePageScoreScreen() {
  const { activeWorkspace, domains, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const params = useSearchParams()

  const [url, setUrl] = React.useState(() => params.get("url") ?? "")
  const [keyword, setKeyword] = React.useState("")
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop")
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<PageScoreDetail | null>(null)

  // Default the URL to the active website's home page (once it's known).
  const [prefilled, setPrefilled] = React.useState(Boolean(params.get("url")))
  if (!prefilled && activeDomain) {
    setPrefilled(true)
    setUrl(`https://${activeDomain.domain}/`)
  }

  const runMutation = useRunPageScore(workspaceId)
  const running = runMutation.isPending

  function runScore(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const target = url.trim()
    if (!target || !workspaceId) {
      setError("Enter a URL to score.")
      return
    }
    runMutation.mutate(
      { url: target, keyword: keyword.trim() || null, device },
      {
        onSuccess: (res) => setResult(res),
        onError: (err) => setError(errorMessage(err)),
      },
    )
  }

  // Suggestions: the active website's tracked pages (newest checked first).
  const sitePages = useSitePages(workspaceId, activeDomain?.id ?? null, 1, "", "checked", 50)
  const pageOptions = React.useMemo(() => {
    const home = activeDomain ? [`https://${activeDomain.domain}/`] : []
    return [...new Set([...home, ...(sitePages.data?.rows ?? []).map((p) => p.url)])]
  }, [sitePages.data, activeDomain])

  // Match the scored URL to a workspace domain so GSC can resolve a property.
  const gscMatch = React.useMemo(() => {
    if (!result) return { domainId: null as string | null, host: "" }
    const host = hostOf(result.url)
    const site = domains.find((w) => w.domain.toLowerCase().replace(/^www\./, "") === host)
    return { domainId: site?.id ?? null, host }
  }, [result, domains])

  return {
    workspaceId, url, setUrl, keyword, setKeyword, device, setDevice,
    running, error, setError, result, runScore, pageOptions, gscMatch,
  }
}
