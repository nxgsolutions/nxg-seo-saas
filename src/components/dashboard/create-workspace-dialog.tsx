"use client"

import { ArrowLeft, Check, ChevronDown, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { describeError, Modal, DomainField, domainFrom } from "@/components/dashboard/domain-dialogs"
import { workspacesApi } from "@/lib/api/workspaces"
import { cn } from "@/lib/utils"

const EXAMPLES = ["My Business", "Client: Acme", "Personal Blog"]

/**
 * Two plain-language steps: name the workspace (who it's for), then add the
 * website to grow (optional). Creates it, switches to it, and opens Overview.
 */
export function CreateWorkspaceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter()
  const { refreshWorkspaces, setActiveWorkspaceId } = useDashboard()
  const [step, setStep] = React.useState<1 | 2>(1)
  const [name, setName] = React.useState("")
  const [site, setSite] = React.useState("")
  const [sandbox, setSandbox] = React.useState(false)
  const [advanced, setAdvanced] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  function reset() {
    setStep(1); setName(""); setSite(""); setSandbox(false); setAdvanced(false); setError(null)
  }

  function next(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError("Give your workspace a name — your business or client name works best."); return }
    setError(null); setStep(2)
  }

  async function finish(withSite: boolean) {
    const domain = withSite ? domainFrom(site) : null
    if (withSite && !domain) { setError("That doesn't look like a domain. Try something like mystore.com"); return }
    setBusy(true); setError(null)
    try {
      const ws = await workspacesApi.create(name.trim(), { isSandbox: sandbox })
      let warn: string | null = null
      if (domain) {
        // The workspace exists even if the site can't be added — say so instead of failing.
        // Category is auto-detected in the background; no manual picking here.
        try { await workspacesApi.addDomain(ws.id, domain) }
        catch (err) { warn = describeError(err, "The domain could not be added.") }
      }
      await refreshWorkspaces()
      setActiveWorkspaceId(ws.id)
      if (warn) toast.warning(`Workspace created, but ${warn} Add it from the top bar.`)
      else toast.success(domain ? `“${ws.name}” is ready — working on ${domain}` : `“${ws.name}” is ready`)
      onOpenChange(false); reset()
      router.push("/dashboard")
    } catch (err) {
      setError(describeError(err, "Could not create the workspace."))
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onOpenChange={(o) => { if (busy) return; onOpenChange(o); if (!o) reset() }}
      title={step === 1 ? "Who is this workspace for?" : "Which domain do you want to grow?"}
      description={step === 1
        ? "A workspace keeps one business or client together — its domains, team and reports."
        : <>We&apos;ll find its keywords, rankings and competitors. You can add more domains later.</>}>
      {/* Step indicator */}
      <ol className="mb-5 flex items-center gap-2 text-xs" aria-label="Progress">
        {["Name", "Domain"].map((label, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <li key={label} className="flex items-center gap-2">
              {i > 0 && <span className="h-px w-6 bg-border" />}
              <span className={cn("flex size-5 items-center justify-center rounded-full text-[11px] font-semibold",
                done ? "bg-primary text-primary-foreground" : active ? "bg-primary/15 text-primary ring-1 ring-primary/40" : "bg-muted text-muted-foreground")}>
                {done ? <Check className="size-3" /> : n}
              </span>
              <span className={cn(active ? "font-medium text-foreground" : "text-muted-foreground")}>{label}</span>
            </li>
          )
        })}
        <li className="ml-auto text-muted-foreground">Step {step} of 2</li>
      </ol>

      {step === 1 ? (
        <form onSubmit={next} className="space-y-4">
          <div className="space-y-2">
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError(null) }}
              autoFocus
              maxLength={80}
              aria-label="Workspace name"
              aria-invalid={!!error || undefined}
              placeholder="e.g. My Business"
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive dark:bg-input/30"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Ideas:</span>
              {EXAMPLES.map((x) => (
                <button key={x} type="button" onClick={() => { setName(x); setError(null) }}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
                  {x}
                </button>
              ))}
            </div>
          </div>

          {/* Developer-only: sandbox workspaces send DataForSEO calls to the free Sandbox (dummy
              data, kept separate). Hidden in production; the backend also gates it. */}
          {process.env.NODE_ENV !== "production" && (
            <div className="text-xs">
              <button type="button" onClick={() => setAdvanced((v) => !v)} className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground">
                <ChevronDown className={cn("size-3.5 transition-transform", advanced && "rotate-180")} /> Advanced (developers)
              </button>
              {advanced && (
                <label className="mt-2 flex items-start gap-2">
                  <input type="checkbox" className="mt-0.5 size-4 accent-primary" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} />
                  <span>Sandbox workspace<span className="block text-muted-foreground">Test data only, kept separate.</span></span>
                </label>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); void finish(true) }} className="space-y-4">
          <DomainField value={site} onChange={(v) => { setSite(v); setError(null) }} disabled={busy} autoFocus invalid={!!error} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button type="button" variant="ghost" onClick={() => { setStep(1); setError(null) }} disabled={busy}>
              <ArrowLeft className="size-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => void finish(false)} disabled={busy}>Skip for now</Button>
              <Button type="submit" disabled={busy || !site.trim()}>
                {busy && <Loader2 className="size-4 animate-spin" />} Create workspace
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  )
}
