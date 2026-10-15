"use client"

import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Globe, Plus, Search, Settings2 } from "lucide-react"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { AddDomainDialog } from "@/components/dashboard/domain-dialogs"
import { cn } from "@/lib/utils"

/** Domain the whole dashboard works on — the first crumb of the top bar.
 * Searchable, so a workspace with many domains stays easy to switch. */
export function DomainSwitcher() {
  const router = useRouter()
  const { domains, activeDomain, setActiveDomainId, domainsLoading } = useDashboard()
  const [open, setOpen] = React.useState(false)
  const [adding, setAdding] = React.useState(false)
  const [q, setQ] = React.useState("")

  const term = q.trim().toLowerCase()
  const list = term ? domains.filter((d) => d.domain.toLowerCase().includes(term)) : domains

  function choose(id: string) {
    setActiveDomainId(id)
    setOpen(false)
  }

  const dialog = <AddDomainDialog open={adding} onOpenChange={setAdding} />

  if (domainsLoading) {
    return <span className="h-7 w-32 animate-pulse rounded-md bg-muted" aria-hidden="true" />
  }

  // No domains yet: one clear call to action instead of an empty menu.
  if (domains.length === 0) {
    return (
      <>
        <button type="button" onClick={() => setAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-primary/40 px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/5">
          <Plus className="size-3.5" /> Add your domain
        </button>
        {dialog}
      </>
    )
  }

  const itemCls = "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"

  return (
    <>
      <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) setQ("") }}>
        <Popover.Trigger
          className="inline-flex min-w-0 max-w-[16rem] items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 data-[popup-open]:bg-muted"
          aria-label={`Domain: ${activeDomain?.domain ?? "none"} — change domain`}>
          <Globe className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{activeDomain?.domain}</span>
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="start" className="z-50 outline-none">
            <Popover.Popup className="w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md outline-none">
              {domains.length > 5 && (
                <div className="relative border-b border-border">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter" && list[0]) choose(list[0].id) }}
                    placeholder="Search domains…" aria-label="Search domains"
                    className="h-10 w-full bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground" />
                </div>
              )}
              <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
                <p className="px-2 pb-1 pt-1.5 text-xs font-medium text-muted-foreground">Domains</p>
                {list.length === 0 && <p className="px-2 py-2 text-sm text-muted-foreground">No domain matches “{q.trim()}”.</p>}
                {list.map((d) => (
                  <button key={d.id} type="button" onClick={() => choose(d.id)} className={itemCls}>
                    <Globe className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{d.domain}</span>
                    {d.id === activeDomain?.id && <Check className="size-4 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
              <div className="border-t border-border p-1">
                <button type="button" className={itemCls} onClick={() => { setOpen(false); setAdding(true) }}>
                  <Plus className="size-4 text-muted-foreground" /> Add domain
                </button>
                <button type="button" className={cn(itemCls)} onClick={() => { setOpen(false); router.push("/dashboard/domains") }}>
                  <Settings2 className="size-4 text-muted-foreground" /> Manage domains
                </button>
              </div>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      {dialog}
    </>
  )
}
