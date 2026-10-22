"use client"

import { ChevronDown, ExternalLink, Split, UserPlus } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Pager } from "@/components/ui/pager"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useLinkGap, useRefreshLinkGap } from "@/hooks/api/use-backlinks"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ApiError, NetworkError } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { compact } from "../../competitive-strategy/_lib/competitive-strategy-helpers"
import { DataStatus, EmptyFetch, FetchButton } from "./fetch-controls"

const PAGE_SIZE = 20
const errText = (e: unknown, f: string) => (e instanceof ApiError || e instanceof NetworkError ? e.message : f)
const HEADER = (
  <PageHeader title={<><Split className="size-5 text-primary" /> Link Gap</>}
    description="Sites that link to your competitors but not to you — your best prospects for new backlinks." />
)

export default function LinkGapPage({ embedded = false }: { embedded?: boolean }) {
  const header = embedded ? null : HEADER
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const domainId = activeDomain?.id ?? null

  // Saved gap (TanStack Query); Fetch / Refresh is the paid call.
  const gap = useLinkGap(workspaceId, domainId)
  const refresh = useRefreshLinkGap(workspaceId, domainId)
  const data = gap.data ?? null
  const busy = refresh.isPending
  const error = refresh.isError ? errText(refresh.error, "Fetch failed.")
    : gap.isError ? errText(gap.error, "Could not load the link gap.") : null

  // Competitors present in the fetched run — the only ones we can filter/compare by.
  const cols = data?.run_competitors.length ? data.run_competitors : data?.competitors ?? []
  const colsKey = cols.join("|")
  // Multi-select: which competitors to compare against, and whether a prospect
  // must link to ANY selected competitor or ALL of them.
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [mode, setMode] = React.useState<"any" | "all">("any")
  const [seenCols, setSeenCols] = React.useState("")
  if (seenCols !== colsKey) { setSeenCols(colsKey); setSelected(new Set(cols)) } // new run → select all
  const [page, setPage] = React.useState(1)
  const [seenFilter, setSeenFilter] = React.useState("")

  function toggle(c: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }
  const allSelected = cols.length > 0 && cols.every((c) => selected.has(c))
  function toggleAll() { setSelected(allSelected ? new Set() : new Set(cols)) }

  function fetchNow(force: boolean) {
    if (!workspaceId || !domainId) return
    refresh.mutate(force || !!data?.competitors_changed, {
      onSuccess: (d) => { if (d.fetched_now) toast.success("Link gap saved") },
    })
  }

  // Filtered rows (client-side: the competitor filter is a UI choice and the gap is a
  // bounded stored snapshot), then paginated to PAGE_SIZE with the shared Pager.
  const sel = cols.filter((c) => selected.has(c)) // keeps column order
  const linkedCount = (r: { links: Record<string, number | null> }) =>
    sel.filter((c) => (r.links[c] ?? 0) > 0).length
  const rows = (data?.domains ?? []).filter((d) => {
    if (sel.length === 0) return false
    const n = linkedCount(d)
    return mode === "all" ? n === sel.length : n >= 1
  })
  const filterKey = `${colsKey}|${mode}|${sel.join(",")}`
  if (seenFilter !== filterKey) { setSeenFilter(filterKey); setPage(1) } // new filter → page 1
  const total = rows.length
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const pageRows = rows.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)
  const pageInfo = { page: pageClamped, page_size: PAGE_SIZE, total, total_pages: totalPages }
  const noCompetitors = data != null && data.competitors.length === 0

  if (!activeDomain) return <div className="space-y-6">{header}<NoDomain what="the link gap" /></div>

  return (
    <div className="space-y-6">
      {header}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">{activeDomain.domain} vs competitors</h2>
            </div>
            {data && <DataStatus state={data} />}
            {data && data.competitors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-muted-foreground">Comparing:</span>
                {data.competitors.map((c) => <span key={c} className="rounded-full border border-border px-2 py-0.5">{c}</span>)}
                <Link href="/dashboard/competitors" className="text-primary hover:underline">Edit list</Link>
              </div>
            )}
          </div>
          {data?.fetched_at && !noCompetitors && (
            <FetchButton state={data} busy={busy} onFetch={fetchNow} label="link gap" requests={1} />
          )}
        </div>

        {data?.competitors_changed && (
          <p className="mx-6 mb-4 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-sm">
            Your competitor list changed since this was fetched — Refresh to compare against the new list.
          </p>
        )}
        {error && <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        {!data ? (
          <div className="border-t border-border"><TableSkeleton rows={6} columns={5} label="Loading the link gap…" /></div>
        ) : noCompetitors ? (
          <div className="border-t border-border px-6 py-12 text-center">
            <p className="font-medium">Add your competitors first</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">The link gap compares who links to them with who links to you.</p>
            <Button className="mt-4" render={<Link href="/dashboard/competitors" />}><UserPlus className="size-4" /> Add competitors</Button>
          </div>
        ) : !data.fetched_at ? (
          <div className="border-t border-border">
            <EmptyFetch title="No link gap saved yet"
              body={`Find sites linking to ${data.competitors.join(", ")} but not to you.`}
              note={!data.can_fetch ? "Fetching new data is turned off right now." : null}>
              <FetchButton state={data} busy={busy} onFetch={fetchNow} label="link gap" requests={1} big />
            </EmptyFetch>
          </div>
        ) : (
          <>
            {/* Competitor filter: any/all + a searchable-style multi-select dropdown (portaled, so it isn't clipped). */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-3 text-xs">
              <span className="text-muted-foreground">Show sites linking to</span>
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                {(["any", "all"] as const).map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)}
                    className={cn("px-2 py-1 capitalize", mode === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                    {m}
                  </button>
                ))}
              </div>
              <span className="text-muted-foreground">of</span>
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 gap-1 px-2.5 text-xs font-normal" />}>
                  {sel.length === cols.length ? "all competitors" : sel.length === 0 ? "no competitors" : `${sel.length} of ${cols.length} competitors`}
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  <div className="flex items-center justify-between gap-2 px-1.5 pb-1">
                    <DropdownMenuLabel className="px-0">Compare against</DropdownMenuLabel>
                    <button type="button" onClick={toggleAll} className="text-xs font-medium text-primary hover:underline">
                      {allSelected ? "Clear" : "Select all"}
                    </button>
                  </div>
                  <DropdownMenuSeparator />
                  <div className="max-h-64 overflow-auto">
                    {cols.map((c) => (
                      <DropdownMenuCheckboxItem key={c} checked={selected.has(c)} onCheckedChange={() => toggle(c)}>
                        <span className="truncate" title={c}>{c}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                  <DropdownMenuSeparator />
                  <p className="px-2 py-1 text-[11px] text-muted-foreground">Link Gap compares up to your {cols.length} top competitors.</p>
                </DropdownMenuContent>
              </DropdownMenu>
              <span className="ml-auto text-muted-foreground">
                {total} matching{data.total_count ? ` · ${compact(data.total_count)} found` : ""}
              </span>
            </div>
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-2 font-medium">Site (not linking to you)</th>
                  <th className="px-3 py-2 text-right font-medium">Authority</th>
                  <th className="px-3 py-2 font-medium">Links to</th>
                  {sel.map((c) => <th key={c} className="max-w-[9rem] truncate px-3 py-2 text-right font-medium normal-case" title={c}>{c}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border/60">
                  {total === 0 ? (
                    <tr><td colSpan={3 + sel.length} className="px-6 py-10 text-center text-sm text-muted-foreground">
                      {sel.length === 0 ? "Select at least one competitor above." : "No sites match this filter — try “any” or fewer competitors."}
                    </td></tr>
                  ) : pageRows.map((r) => {
                    const n = linkedCount(r)
                    return (
                      <tr key={r.domain} className="hover:bg-muted/40">
                        <td className="px-6 py-2">
                          <a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                            {r.domain}<ExternalLink className="size-3" />
                          </a>
                        </td>
                        <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.rank ?? "—"}</td>
                        <td className="px-3 py-2 text-xs">
                          <span className={cn("rounded-full px-2 py-0.5 font-medium",
                            n > 1 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                            {n} of {sel.length}
                          </span>
                        </td>
                        {sel.map((c) => (
                          <td key={c} className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {r.links[c] != null ? compact(r.links[c] ?? 0) : "—"}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pager className="border-t border-border px-6 py-2" pagination={pageInfo} onPageChange={setPage} noun="prospects" />
            <p className="border-t border-border px-6 py-2 text-xs text-muted-foreground">
              Tip: sites linking to several of your competitors already cover your topic — they&apos;re the most likely to link to you too.
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
