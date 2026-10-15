"use client"

import * as React from "react"
import { Check, ChevronsUpDown, FlaskConical, Plus } from "lucide-react"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { CreateWorkspaceDialog } from "@/components/dashboard/create-workspace-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** Marks a workspace whose data comes from the free DataForSEO Sandbox (test
 *  data, kept separate from live) so it is never mistaken for real numbers. */
function SandboxBadge() {
  return (
    <span
      title="Sandbox workspace — test data (DataForSEO Sandbox), kept separate from live"
      className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide text-amber-600 dark:text-amber-400"
    >
      <FlaskConical className="size-3" />
      Sandbox
    </span>
  )
}

export function WorkspaceSwitcher() {
  const { workspaces, activeWorkspace, setActiveWorkspaceId } = useDashboard()
  const [creating, setCreating] = React.useState(false)

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
          {(activeWorkspace?.name ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-medium">
              {activeWorkspace?.name ?? "Select workspace"}
            </span>
            {activeWorkspace?.is_sandbox ? <SandboxBadge /> : null}
          </span>
          <span className="block truncate text-xs text-muted-foreground capitalize">
            {activeWorkspace?.role ?? ""}
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[15rem]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onClick={() => setActiveWorkspaceId(ws.id)}
          >
            <span className="flex size-5 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-foreground">
              {ws.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="flex-1 truncate">{ws.name}</span>
            {ws.is_sandbox ? <SandboxBadge /> : null}
            {ws.id === activeWorkspace?.id ? (
              <Check className="size-4 text-primary!" />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setCreating(true)}>
          <Plus />
          <span>New workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <CreateWorkspaceDialog open={creating} onOpenChange={setCreating} />
    </>
  )
}
