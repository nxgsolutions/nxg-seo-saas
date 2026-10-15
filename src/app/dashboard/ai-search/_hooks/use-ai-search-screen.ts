"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { type AiSearchResult } from "@/lib/api/ai"
import { ApiError, NetworkError } from "@/lib/api/client"
import * as React from "react"
import { aiApi } from "@/lib/api/ai"

export function useAiSearchScreen() {

  const { activeDomain } = useDashboard()

  const [query, setQuery] = React.useState("")

  const [domain, setDomain] = React.useState("")

  const [running, setRunning] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)

  const [result, setResult] = React.useState<AiSearchResult | null>(null)

  const [prefilled, setPrefilled] = React.useState(false)

  if (!prefilled && activeDomain) {
    setPrefilled(true)
    setDomain(activeDomain.domain)
  }

  async function run(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const q = query.trim()
    if (!q) {
      setError("Enter a topic or query to analyze.")
      return
    }
    setRunning(true)
    setResult(null)
    try {
      setResult(await aiApi.search(q, domain.trim() || undefined))
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else if (err instanceof NetworkError) setError(err.message)
      else setError("Could not run the analysis.")
    } finally {
      setRunning(false)
    }
  }
  return { query, setQuery, domain, setDomain, running, error, setError, result, run }
}
