"use client"

import * as React from "react"
import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronsUpDown, FlaskConical, Plus, Search } from "lucide-react"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { CreateWorkspaceDialog } from "@/components/dashboard/create-workspace-dialog"
import type { Workspace } from "@/lib/api/workspaces"
import { cn } from "@/lib/utils"

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
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Combobox.Root<Workspace>
        items={workspaces}
        value={activeWorkspace ?? null}
        onValueChange={(ws) => {
          if (ws) setActiveWorkspaceId(ws.id)
        }}
        open={open}
        onOpenChange={setOpen}
        itemToStringLabel={(ws) => ws?.name ?? ""}
        isItemEqualToValue={(a, b) => a?.id === b?.id}
        autoHighlight
      >
        <Combobox.Trigger className="flex w-full items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-2 text-left text-sm outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/40">
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
        </Combobox.Trigger>

        <Combobox.Portal>
          <Combobox.Positioner
            align="start"
            sideOffset={6}
            className="z-50 outline-none"
          >
            <Combobox.Popup
              className={cn(
                "flex max-h-[min(24rem,var(--available-height))] w-[var(--anchor-width)] min-w-[15rem] max-w-[var(--available-width)] flex-col overflow-hidden",
                "rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none",
                "origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
              )}
            >
              {/* Search box pinned at the top; the list below it scrolls. */}
              <div className="relative shrink-0 border-b border-border/70 p-2">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                />
                <Combobox.Input
                  placeholder="Search workspaces…"
                  autoComplete="off"
                  className="h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
                />
              </div>

              {/* Stays mounted for screen readers; padding lives on the inner
                  node so the wrapper is 0-height whenever matches exist. */}
              <Combobox.Empty>
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No workspaces match your search.
                </p>
              </Combobox.Empty>

              <Combobox.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
                {(ws: Workspace) => (
                  <Combobox.Item
                    key={ws.id}
                    value={ws}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none select-none",
                      "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                    )}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold text-foreground">
                      {ws.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="flex-1 truncate">{ws.name}</span>
                    {ws.is_sandbox ? <SandboxBadge /> : null}
                    {ws.id === activeWorkspace?.id ? (
                      <Check className="size-4 shrink-0 text-primary" />
                    ) : null}
                  </Combobox.Item>
                )}
              </Combobox.List>

              {/* Footer action: not a selectable item, so it opens the dialog
                  and closes the popup instead of changing the active workspace. */}
              <div className="shrink-0 border-t border-border/70 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setCreating(true)
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                >
                  <Plus className="size-4" />
                  <span>New workspace</span>
                </button>
              </div>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>

      <CreateWorkspaceDialog open={creating} onOpenChange={setCreating} />
    </>
  )
}
