"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { useRouter } from "next/navigation"
import { CornerDownLeft, Globe, Search } from "lucide-react"

import { navSections, navTabGroups, type NavItem } from "@/config/nav"
import { cn } from "@/lib/utils"

interface Command {
  label: string
  href: string
  icon: NavItem["icon"]
  /** Section heading this command is grouped under. */
  group: string
  /** Extra terms matched by search (never shown). */
  keywords?: string
}

/** Build the searchable command list once, from the nav config so it never
 *  drifts from the sidebar. Includes sidebar items, their children, the
 *  tab-group pages (which have no sidebar row of their own), and Domains. */
function buildCommands(): Command[] {
  const commands: Command[] = []
  const seen = new Set<string>()
  const add = (c: Command) => {
    if (c.href && !seen.has(c.href)) {
      seen.add(c.href)
      commands.push(c)
    }
  }

  for (const section of navSections) {
    const group = section.title ?? "General"
    for (const item of section.items) {
      const rows = item.children ?? [item]
      for (const row of rows) {
        if (row.href && !row.soon) add({ label: row.label, href: row.href, icon: row.icon, group })
      }
    }
  }

  // Tab-group pages that share one sidebar row — make each reachable by name.
  for (const tabGroup of navTabGroups) {
    for (const tab of tabGroup) {
      add({ label: tab.label, href: tab.href, icon: tab.icon, group: "Pages", keywords: tab.description })
    }
  }

  // Domains is only reachable from the topbar switcher today.
  add({ label: "Domains", href: "/dashboard/domains", icon: Globe, group: "Workspace", keywords: "add switch website site" })

  return commands
}

const ALL_COMMANDS = buildCommands()

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [activeIndex, setActiveIndex] = React.useState(0)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Open/close the palette, resetting the query and selection on open so it
  // always starts fresh.
  const setPaletteOpen = React.useCallback((next: boolean) => {
    if (next) {
      setQuery("")
      setActiveIndex(0)
    }
    setOpen(next)
  }, [])

  // ⌘K / Ctrl+K toggles the palette from anywhere.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPaletteOpen(!open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [open, setPaletteOpen])

  const results = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_COMMANDS
    return ALL_COMMANDS.filter((c) =>
      `${c.label} ${c.group} ${c.keywords ?? ""}`.toLowerCase().includes(q)
    )
  }, [query])

  // Clamp during render so a shrinking result set never leaves the highlight
  // out of range (no setState-in-effect needed).
  const clampedIndex = Math.min(activeIndex, Math.max(0, results.length - 1))

  // Scroll the highlighted row into view as the user arrows through.
  React.useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${clampedIndex}"]`)
      ?.scrollIntoView({ block: "nearest" })
  }, [clampedIndex])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(Math.min(clampedIndex + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(Math.max(clampedIndex - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const target = results[clampedIndex]
      if (target) go(target.href)
    }
  }

  // Group the flat results back into section buckets (order preserved).
  const grouped = React.useMemo(() => {
    const map = new Map<string, { command: Command; index: number }[]>()
    results.forEach((command, index) => {
      const bucket = map.get(command.group) ?? []
      bucket.push({ command, index })
      map.set(command.group, bucket)
    })
    return [...map.entries()]
  }, [results])

  return (
    <>
      {/* Topbar trigger */}
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="group hidden items-center gap-2 rounded-lg border border-border bg-muted/40 px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground sm:flex"
        aria-label="Search and jump to a page"
      >
        <Search className="size-4" />
        <span className="hidden md:inline">Search…</span>
        <kbd className="ml-1 hidden rounded border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-medium text-muted-foreground md:inline">
          ⌘K
        </kbd>
      </button>

      <Dialog.Root open={open} onOpenChange={setPaletteOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="dashboard-shell fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl outline-none transition-[opacity,scale] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <Dialog.Title className="sr-only">Search and jump to a page</Dialog.Title>

            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKeyDown}
                placeholder="Search pages and actions…"
                aria-label="Search pages and actions"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div ref={listRef} className="sidebar-scroll max-h-[min(24rem,60vh)] overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </p>
              ) : (
                grouped.map(([group, rows]) => (
                  <div key={group} className="mb-1">
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                      {group}
                    </p>
                    {rows.map(({ command, index }) => (
                      <button
                        key={command.href}
                        type="button"
                        data-index={index}
                        onClick={() => go(command.href)}
                        onMouseMove={() => setActiveIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm transition-colors",
                          index === clampedIndex
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-foreground"
                        )}
                      >
                        <command.icon
                          className={cn(
                            "size-4 shrink-0",
                            index === clampedIndex ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <span className="flex-1">{command.label}</span>
                        {index === clampedIndex ? (
                          <CornerDownLeft className="size-3.5 text-muted-foreground" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-3">
                <span><kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> navigate</span>
                <span><kbd className="font-sans">↵</kbd> open</span>
              </span>
              <span><kbd className="font-sans">esc</kbd> close</span>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
