"use client"

import { AlertTriangle, Loader2, Trash2 } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { describeError, Modal } from "@/components/dashboard/domain-dialogs"
import type { Domain } from "@/lib/api/workspaces"
import { workspacesApi } from "@/lib/api/workspaces"

const ERASED = [
  "Tracked keywords and rank history",
  "Competitor list and competitor rankings",
  "Keyword research, clusters and search results",
  "Opportunity research and action plan data",
]

/** Permanent delete, confirmed by typing the domain name. */
export function DeleteDomainDialog({ domain, onOpenChange }: {
  /** The domain to delete; null = closed. */
  domain: Domain | null
  onOpenChange: (open: boolean) => void
}) {
  const { activeWorkspace, activeDomain, reloadDomains } = useDashboard()
  const [typed, setTyped] = React.useState("")
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fresh confirmation for each domain opened (adjusted during render).
  const [prevId, setPrevId] = React.useState(domain?.id)
  if (domain?.id !== prevId) {
    setPrevId(domain?.id)
    setTyped(""); setError(null)
  }

  const matches = !!domain && typed.trim().toLowerCase() === domain.domain.toLowerCase()

  async function remove(e: React.FormEvent) {
    e.preventDefault()
    if (!domain || !activeWorkspace || !matches) return
    setBusy(true); setError(null)
    try {
      await workspacesApi.deleteDomain(activeWorkspace.id, domain.id)
      toast.success(`Deleted ${domain.domain}`)
      onOpenChange(false)
      // If it was the active domain, the dashboard falls back to the first remaining one.
      await reloadDomains()
    } catch (err) {
      setError(describeError(err, "Could not delete the domain."))
    } finally { setBusy(false) }
  }

  return (
    <Modal open={!!domain} onOpenChange={(o) => { if (!busy) onOpenChange(o) }}
      title={<span className="flex items-center gap-2"><AlertTriangle className="size-5 text-destructive" /> Delete {domain?.domain}?</span>}
      description="This can't be undone. Everything saved for this domain is erased:">
      <form onSubmit={remove} className="space-y-4">
        <ul className="space-y-1 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
          {ERASED.map((x) => <li key={x} className="flex gap-2"><span className="text-destructive">•</span>{x}</li>)}
        </ul>
        {domain?.id === activeDomain?.id && (
          <p className="text-xs text-muted-foreground">You&apos;re working on this domain now — the dashboard will switch to another one.</p>
        )}
        <label className="block space-y-1.5 text-sm">
          <span>Type <strong className="font-semibold">{domain?.domain}</strong> to confirm</span>
          <input value={typed} onChange={(e) => { setTyped(e.target.value); setError(null) }} autoFocus
            autoComplete="off" spellCheck={false} disabled={busy} aria-label="Type the domain to confirm"
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30" />
        </label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="destructive" disabled={!matches || busy}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Delete domain
          </Button>
        </div>
      </form>
    </Modal>
  )
}
