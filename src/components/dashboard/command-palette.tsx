"use client"

import * as React from "react"
import { Dialog } from "@base-ui/react/dialog"
import { useRouter } from "next/navigation"
import { CornerDownLeft, Gauge, Globe, Search } from "lucide-react"

import { navSections, navTabGroups, type NavItem } from "@/config/nav"
import { cn } from "@/lib/utils"

interface Command {
  label: string
  href: string
  icon: NavItem["icon"]
  /** Section heading this command is grouped under. */
  group: string
  /** Short line shown under the label in the results. */
  description?: string
  /** Extra terms matched by search (never shown). */
  keywords?: string
}

/**
 * Per-route metadata merged onto the nav config so search stays rich without
 * cluttering the sidebar. Keyed by href. `label` overrides the nav label only
 * where it would be ambiguous in a flat search list (e.g. two "Overview"s).
 */
const ROUTE_META: Record<
  string,
  { label?: string; description?: string; keywords?: string }
> = {
  "/dashboard": {
    description: "Home & key metrics",
    keywords: "home summary start",
  },
  "/dashboard/keyword-analysis": {
    description: "Volume, difficulty & SERP",
    keywords: "keywords research volume cpc difficulty serp intent",
  },
  "/dashboard/my-keywords": {
    description: "Your shortlisted keywords",
    keywords: "saved shortlist bookmark starred list",
  },
  "/dashboard/competitors": {
    description: "Rivals, gaps & ranked keywords",
    keywords: "competitors rivals gap domain compare",
  },
  "/dashboard/competitive-strategy": {
    description: "Positioning & competitive gaps",
    keywords: "competitive strategy positioning gap share of voice",
  },
  "/dashboard/opportunity-research": {
    description: "Prioritized SEO opportunities",
    keywords: "opportunity action plan tasks priority wins",
  },
  "/dashboard/page-discovery": {
    description: "Find & list your pages",
    keywords: "pages sitemap crawl discover urls inventory",
  },
  "/dashboard/content-optimization": {
    description: "Improve content & on-page score",
    keywords: "content writing optimize editor on-page copy",
  },
  "/dashboard/page-audit": {
    description: "Per-page SEO audit",
    keywords: "audit checks score page issues fix",
  },
  "/dashboard/site-score": {
    label: "SEO Score",
    description: "Whole-site score breakdown",
    keywords: "site score domain health overall grade",
  },
  "/dashboard/meta-tags": {
    description: "Titles & descriptions",
    keywords: "meta title description tags open graph og twitter",
  },
  "/dashboard/serp-preview": {
    description: "How it looks on Google",
    keywords: "serp preview snippet google result",
  },
  "/dashboard/backlinks": {
    label: "Backlinks Overview",
    description: "Your link profile",
    keywords: "backlinks links overview profile anchors referring",
  },
  "/dashboard/backlinks/explorer": {
    label: "Backlink Explorer",
    description: "Explore any domain's links",
    keywords: "backlinks explorer domain inspect",
  },
  "/dashboard/backlinks/gap": {
    label: "Link Opportunities",
    description: "Link gaps & reclamation",
    keywords: "backlinks gap opportunities reclaim prospects",
  },
  "/dashboard/robots": {
    description: "Robots & sitemap checks",
    keywords: "robots sitemap crawl technical indexable",
  },
  "/dashboard/search-performance": {
    description: "Clicks, impressions & queries",
    keywords: "search console performance gsc clicks impressions ctr",
  },
  "/dashboard/rankings": {
    description: "Track keyword positions",
    keywords: "rank tracking positions serp monitor",
  },
  "/dashboard/ai-search": {
    description: "Visibility in AI answers",
    keywords: "ai search overview chatgpt perplexity visibility geo aeo",
  },
  "/dashboard/reports": {
    description: "Exportable SEO reports",
    keywords: "reports export pdf share",
  },
  "/dashboard/team": {
    description: "Members & roles",
    keywords: "team members people roles invite",
  },
  "/dashboard/billing": {
    description: "Plan & invoices",
    keywords: "billing plan invoice subscription payment",
  },
  "/dashboard/settings": {
    description: "Workspace settings",
    keywords: "settings preferences configuration account",
  },
  "/dashboard/domains": {
    description: "Add or switch website",
    keywords: "domains website site switch add project",
  },
}

/** Routes that have no sidebar/tab entry of their own but should be searchable. */
const EXTRA_COMMANDS: Command[] = [
  // Full whole-site breakdown, reachable from Page Audit; give it its own entry.
  {
    label: "SEO Score",
    href: "/dashboard/site-score",
    icon: Gauge,
    group: "Content",
  },
  // Domains is otherwise only reachable from the topbar switcher.
  {
    label: "Domains",
    href: "/dashboard/domains",
    icon: Globe,
    group: "Workspace",
  },
]

/** Build the searchable command list once, from the nav config so it never
 *  drifts from the sidebar. Includes sidebar items, their children, the
 *  tab-group pages (which have no sidebar row of their own), plus the extra
 *  destinations above. Each entry is enriched with a description + synonyms. */
function buildCommands(): Command[] {
  const commands: Command[] = []
  const seen = new Set<string>()
  const add = (c: Command) => {
    if (!c.href || seen.has(c.href)) return
    seen.add(c.href)
    const meta = ROUTE_META[c.href]
    commands.push({
      ...c,
      label: meta?.label ?? c.label,
      description: meta?.description ?? c.description,
      keywords: [c.keywords, meta?.keywords].filter(Boolean).join(" ") || undefined,
    })
  }

  for (const section of navSections) {
    const group = section.title ?? "General"
    for (const item of section.items) {
      const rows = item.children ?? [item]
      for (const row of rows) {
        if (row.href && !row.soon)
          add({ label: row.label, href: row.href, icon: row.icon, group })
      }
    }
  }

  // Tab-group pages that share one sidebar row — make each reachable by name.
  for (const tabGroup of navTabGroups) {
    for (const tab of tabGroup) {
      add({
        label: tab.label,
        href: tab.href,
        icon: tab.icon,
        group: "Content",
        description: tab.description,
      })
    }
  }

  for (const extra of EXTRA_COMMANDS) add(extra)

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
    // Match every whitespace-separated token so "backlink gap" still narrows.
    const tokens = q.split(/\s+/)
    return ALL_COMMANDS.filter((c) => {
      const hay = `${c.label} ${c.group} ${c.description ?? ""} ${c.keywords ?? ""}`.toLowerCase()
      return tokens.every((t) => hay.includes(t))
    })
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
      {/* Topbar trigger — full pill on sm+, icon-only on mobile. */}
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="group hidden h-9 items-center gap-2 rounded-xl border border-border/80 bg-muted/40 pl-2.5 pr-2 text-sm text-muted-foreground shadow-sm transition-all hover:border-border hover:bg-muted/70 hover:text-foreground hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 sm:flex"
        aria-label="Search and jump to a page"
      >
        <Search className="size-4 transition-colors group-hover:text-foreground" />
        <span className="hidden min-w-[6rem] text-left md:inline">Search…</span>
        <kbd className="ml-1 hidden items-center gap-0.5 rounded-md border border-border bg-background px-1.5 py-0.5 font-sans text-[10px] font-semibold text-muted-foreground shadow-sm md:inline-flex">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="flex size-9 items-center justify-center rounded-xl border border-border/80 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground sm:hidden"
        aria-label="Search and jump to a page"
      >
        <Search className="size-4" />
      </button>

      <Dialog.Root open={open} onOpenChange={setPaletteOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
          <Dialog.Popup className="dashboard-shell fixed left-1/2 top-[12vh] z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border/80 bg-card/95 text-card-foreground shadow-2xl ring-1 ring-black/5 backdrop-blur-xl outline-none transition-[opacity,scale] duration-200 ease-out data-[ending-style]:scale-[0.98] data-[ending-style]:opacity-0 data-[starting-style]:scale-[0.98] data-[starting-style]:opacity-0">
            <Dialog.Title className="sr-only">Search and jump to a page</Dialog.Title>

            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-2.5">
              <Search className="size-[18px] shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setActiveIndex(0)
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Search pages and actions…"
                aria-label="Search pages and actions"
                className="h-10 w-full bg-transparent text-sm outline-none! shadow-none! placeholder:text-muted-foreground/70"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Clear
                </button>
              ) : null}
            </div>

            <div
              ref={listRef}
              className="sidebar-scroll max-h-[min(26rem,60vh)] overflow-y-auto p-2"
            >
              {results.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-2 py-12 text-center">
                  <div className="flex size-11 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
                    <Search className="size-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No results</p>
                  <p className="text-xs text-muted-foreground">
                    Nothing matches &ldquo;{query}&rdquo;. Try another term.
                  </p>
                </div>
              ) : (
                grouped.map(([group, rows]) => (
                  <div key={group} className="mb-1">
                    <p className="px-2 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
                      {group}
                    </p>
                    {rows.map(({ command, index }) => {
                      const active = index === clampedIndex
                      return (
                        <button
                          key={command.href}
                          type="button"
                          data-index={index}
                          onClick={() => go(command.href)}
                          onMouseMove={() => setActiveIndex(index)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors",
                            active
                              ? "bg-sidebar-accent text-sidebar-accent-foreground"
                              : "text-foreground hover:bg-muted/50"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-9 shrink-0 items-center justify-center rounded-lg border transition-colors",
                              active
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border/60 bg-muted/40 text-muted-foreground"
                            )}
                          >
                            <command.icon className="size-[18px]" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">
                              {command.label}
                            </span>
                            {command.description ? (
                              <span className="truncate text-xs text-muted-foreground">
                                {command.description}
                              </span>
                            ) : null}
                          </span>
                          {active ? (
                            <kbd className="flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                              <CornerDownLeft className="size-3" />
                            </kbd>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border/70 bg-muted/20 px-4 py-2.5 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-sans">↑</kbd>
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-sans">↓</kbd>
                  navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border border-border bg-background px-1 py-0.5 font-sans">↵</kbd>
                  open
                </span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-border bg-background px-1 py-0.5 font-sans">esc</kbd>
                close
              </span>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
