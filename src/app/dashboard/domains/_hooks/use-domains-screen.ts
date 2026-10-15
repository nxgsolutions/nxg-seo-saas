"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { ApiError, NetworkError } from "@/lib/api/client"
import * as React from "react"
import { toast } from "sonner"
import { workspacesApi } from "@/lib/api/workspaces"

export function useDomainsScreen() {

  // Websites come from the dashboard context (shared with the top-bar switcher).
  const { activeWorkspace, activeDomain, setActiveDomainId, domains, reloadDomains, domainsLoading: loading } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null

  // Deleting is owner/admin only (the API enforces it too).
  const canDelete = activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin"


  const [newSite, setNewSite] = React.useState("")

  const [adding, setAdding] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)

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
    } catch (err) {
      if (err instanceof ApiError) setError(err.fieldErrors[0]?.message ?? err.message)
      else if (err instanceof NetworkError) setError(err.message)
      else setError("Could not add the domain.")
    } finally {
      setAdding(false)
    }
  }
  return { activeWorkspace, activeDomain, setActiveDomainId, canDelete, domains, loading, newSite, setNewSite, adding, error, setError, addDomain }
}
