"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { ApiError, NetworkError } from "@/lib/api/client"
import { type RobotsCheckResult } from "@/lib/api/tools"
import * as React from "react"
import { toolsApi } from "@/lib/api/tools"

export function useRobotsScreen() {

  const { activeDomain } = useDashboard()

  const [url, setUrl] = React.useState("")

  const [running, setRunning] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)

  const [result, setResult] = React.useState<RobotsCheckResult | null>(null)

  const [prefilled, setPrefilled] = React.useState(false)

  if (!prefilled && activeDomain) {
    setPrefilled(true)
    setUrl(activeDomain.domain)
  }

  async function run(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const target = url.trim()
    if (!target) {
      setError("Enter a URL to check.")
      return
    }
    setRunning(true)
    setResult(null)
    try {
      setResult(await toolsApi.robotsCheck(target))
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else if (err instanceof NetworkError) setError(err.message)
      else setError("Something went wrong. Please try again.")
    } finally {
      setRunning(false)
    }
  }
  return { url, setUrl, running, error, setError, result, run }
}
