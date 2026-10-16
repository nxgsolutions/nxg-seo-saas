"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Globe, Loader2, X } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CategorySelect } from "@/components/dashboard/category-select"
import { normalizeDomain } from "@/components/dashboard/competitor-combobox"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { ApiError, NetworkError } from "@/lib/api/client"
import { workspacesApi } from "@/lib/api/workspaces"
import { cn } from "@/lib/utils"

export function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.fieldErrors[0]?.message ?? err.message
  if (err instanceof NetworkError) return err.message
  return fallback
}

/** "example.com" if the text looks like a website, else null. */
export function domainFrom(text: string): string | null {
  const d = normalizeDomain(text)
  return d && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(d) ? d : null
}

/** Centered dialog shell used by the workspace / website dialogs. */
export function Modal({ open, onOpenChange, title, description, children, className }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Popup className={cn(
          "dashboard-shell fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl outline-none transition-[opacity,scale] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
          className)}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Dialog.Title className="font-heading text-lg font-bold tracking-tight">{title}</Dialog.Title>
              {description && <Dialog.Description className="text-sm text-muted-foreground">{description}</Dialog.Description>}
            </div>
            <Dialog.Close render={<Button variant="ghost" size="icon-sm" />} aria-label="Close"><X /></Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/** Website address field: accepts anything pasted (https://, www., paths) and
 * shows the clean site name it will use. */
export function DomainField({ value, onChange, disabled, autoFocus, invalid }: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  autoFocus?: boolean
  invalid?: boolean
}) {
  const site = domainFrom(value)
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Globe aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus={autoFocus}
          inputMode="url"
          autoComplete="url"
          aria-label="Domain"
          aria-invalid={invalid || undefined}
          placeholder="yourdomain.com"
          className="flex h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/30"
        />
      </div>
      <p className="min-h-4 text-xs text-muted-foreground">
        {site ? <>We&apos;ll track <strong className="text-foreground">{site}</strong></>
          : "Just the domain is enough — e.g. mystore.com"}
      </p>
    </div>
  )
}

/** "Add website" — adds a site to the active workspace and switches to it. */
export function AddDomainDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { activeWorkspace, reloadDomains, setActiveDomainId } = useDashboard()
  const [text, setText] = React.useState("")
  const [category, setCategory] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const site = domainFrom(text)
    if (!site) { setError("Enter a domain, e.g. mystore.com"); return }
    if (!activeWorkspace) return
    setBusy(true); setError(null)
    try {
      const created = await workspacesApi.addDomain(activeWorkspace.id, site, { categoryId: category })
      await reloadDomains()
      setActiveDomainId(created.id)
      toast.success(`Now working on ${created.domain}`)
      setText(""); setCategory(null)
      onOpenChange(false)
    } catch (err) {
      setError(describeError(err, "Could not add the domain."))
    } finally { setBusy(false) }
  }

  return (
    <Modal open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setError(null); setCategory(null) } }}
      title="Add a domain"
      description={<>It&apos;s added to <strong className="text-foreground">{activeWorkspace?.name}</strong> and every page switches to it.</>}>
      <form onSubmit={submit} className="space-y-4">
        <DomainField value={text} onChange={(v) => { setText(v); setError(null) }} disabled={busy} autoFocus invalid={!!error} />
        <CategorySelect value={category} onChange={setCategory} disabled={busy} />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy || !text.trim()}>
            {busy && <Loader2 className="size-4 animate-spin" />} Add domain
          </Button>
        </div>
      </form>
    </Modal>
  )
}
