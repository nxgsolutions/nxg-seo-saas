"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { ApiError, NetworkError } from "@/lib/api/client"
import { useQueryClient } from "@tanstack/react-query"
import * as React from "react"
import { toast } from "sonner"
import { type Domain, workspacesApi } from "@/lib/api/workspaces"

// How long to wait for background category detection before giving up (the
// homepage scrape + one AI call usually resolves within a few seconds).
const POLL_EVERY_MS = 2500
const POLL_MAX_TRIES = 10

export function useDomainsScreen() {

  // Websites come from the dashboard context (shared with the top-bar switcher).
  const { activeWorkspace, activeDomain, setActiveDomainId, domains, reloadDomains, domainsLoading: loading } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const qc = useQueryClient()

  // Deleting is owner/admin only (the API enforces it too).
  const canDelete = activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin"


  const [newSite, setNewSite] = React.useState("")

  const [adding, setAdding] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)

  // Domains whose category is still being auto-detected in the background. We
  // poll until each resolves (or the window elapses) so the detected category
  // appears on its own, without a manual refresh.
  const [detecting, setDetecting] = React.useState<string[]>([])

  const anyDetecting = detecting.length > 0
  React.useEffect(() => {
    if (!anyDetecting) return
    let alive = true
    let tries = 0
    const timer = window.setInterval(async () => {
      tries += 1
      let list: Domain[] = []
      try { list = await reloadDomains() } catch { /* transient — keep polling */ }
      if (!alive) return
      const resolved = new Set(list.filter((d) => d.category_id).map((d) => d.id))
      if (resolved.size) qc.invalidateQueries({ queryKey: ["categories"] })
      setDetecting((prev) => {
        const next = prev.filter((id) => !resolved.has(id))
        return tries >= POLL_MAX_TRIES ? [] : next
      })
    }, POLL_EVERY_MS)
    return () => { alive = false; window.clearInterval(timer) }
  }, [anyDetecting, reloadDomains, qc])

  async function addDomain(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const url = newSite.trim()
    if (!url || !workspaceId) {
      setError("Enter a domain, e.g. example.com.")
      return
    }
    setAdding(true)
    try {
      const created = await workspacesApi.addDomain(workspaceId, url)
      await reloadDomains()
      toast.success(`Added ${created.domain}`)
      setNewSite("")
      // Surface the background-detected category once it lands.
      if (!created.category_id) setDetecting((prev) => prev.includes(created.id) ? prev : [...prev, created.id])
    } catch (err) {
      if (err instanceof ApiError) setError(err.fieldErrors[0]?.message ?? err.message)
      else if (err instanceof NetworkError) setError(err.message)
      else setError("Could not add the domain.")
    } finally {
      setAdding(false)
    }
  }
  return { activeWorkspace, activeDomain, setActiveDomainId, canDelete, domains, loading, newSite, setNewSite, adding, error, setError, addDomain, detecting }
}
