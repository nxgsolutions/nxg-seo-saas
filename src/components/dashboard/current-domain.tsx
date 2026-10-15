"use client"

import { Globe, Plus } from "lucide-react"
import * as React from "react"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AddDomainDialog } from "@/components/dashboard/domain-dialogs"

/** Read-only "which domain this page is about". Switching happens in the top bar. */
export function CurrentDomain({ className }: { className?: string }) {
  const { activeDomain } = useDashboard()
  if (!activeDomain) return null
  return (
    <span className={cn("inline-flex h-9 max-w-full items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm", className)}
      title="Change the domain from the top bar">
      <Globe className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate font-medium">{activeDomain.domain}</span>
    </span>
  )
}

/** Shown by site-specific pages when the workspace has no website yet. */
export function NoDomain({ what = "this page" }: { what?: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Globe className="size-5" />
      </div>
      <p className="font-medium">Add your domain to start</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
        {what.charAt(0).toUpperCase() + what.slice(1)} works on one of your domains. Add it once and everything here fills in.
      </p>
      <Button className="mt-4" onClick={() => setOpen(true)}><Plus className="size-4" /> Add domain</Button>
      <AddDomainDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
