"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { ApiError, NetworkError } from "@/lib/api/client"
import { type OptimizeResult } from "@/lib/api/optimization"
import * as React from "react"
import { optimizationApi } from "@/lib/api/optimization"
import { ImpactFilter } from "../_lib/page-optimization-helpers"

export function usePageOptimizationScreen() {

  const { activeDomain } = useDashboard()

  const [url, setUrl] = React.useState("")

  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop")

  const [running, setRunning] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)

  const [result, setResult] = React.useState<OptimizeResult | null>(null)

  const [filter, setFilter] = React.useState<ImpactFilter>("all")

  const [prefilled, setPrefilled] = React.useState(false)

  if (!prefilled) {
    const q = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("url") : null
    if (q) {
      setPrefilled(true)
      setUrl(q)
    } else if (activeDomain) {
      setPrefilled(true)
      setUrl(activeDomain.domain)
    }
  }

  async function run(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const target = url.trim()
    if (!target) {
      setError("Enter a URL to optimize.")
      return
    }
    setRunning(true)
    setResult(null)
    setFilter("all")
    try {
      setResult(await optimizationApi.optimize(target, device))
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else if (err instanceof NetworkError) setError(err.message)
      else setError("Could not build an optimization plan.")
    } finally {
      setRunning(false)
    }
  }

  const filtered = React.useMemo(
    () => (result ? result.recommendations.filter((r) => filter === "all" || r.impact === filter) : []),
    [result, filter]
  )

  const filters: { id: ImpactFilter; label: string; count: number }[] = result
    ? [
      { id: "all", label: "All", count: result.summary.total_issues },
      { id: "high", label: "High", count: result.summary.high },
      { id: "medium", label: "Medium", count: result.summary.medium },
      { id: "low", label: "Low", count: result.summary.low },
    ]
    : []
  return { url, setUrl, device, setDevice, running, error, setError, result, filter, setFilter, run, filtered, filters }
}
