"use client"

import { ExternalLink, Split, UserPlus } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"

import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useLinkGap, useRefreshLinkGap } from "@/hooks/api/use-backlinks"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ApiError, NetworkError } from "@/lib/api/client"
import { cn } from "@/lib/utils"
import { compact } from "../../competitive-strategy/_lib/competitive-strategy-helpers"
import { DataStatus, EmptyFetch, FetchButton } from "./fetch-controls"

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
  const [minCompetitors, setMinCompetitors] = React.useState(1)

  // Saved gap (TanStack Query); Fetch / Refresh is the paid call.
  const gap = useLinkGap(workspaceId, domainId)
  const refresh = useRefreshLinkGap(workspaceId, domainId)
  const data = gap.data ?? null
  const busy = refresh.isPending
  const error = refresh.isError ? errText(refresh.error, "Fetch failed.")
    : gap.isError ? errText(gap.error, "Could not load the link gap.") : null

  function fetchNow(force: boolean) {
    if (!workspaceId || !domainId) return
    refresh.mutate(force || !!data?.competitors_changed, {
      onSuccess: (d) => { if (d.fetched_now) toast.success("Link gap saved") },
    })
  }

  if (!activeDomain) return <div className="space-y-6">{header}<NoDomain what="the link gap" /></div>

  const rows = (data?.domains ?? []).filter((d) => d.competitors_linking >= minCompetitors)
  const cols = data?.run_competitors.length ? data.run_competitors : data?.competitors ?? []
  const noCompetitors = data != null && data.competitors.length === 0

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
            <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-3 text-xs">
              <span className="text-muted-foreground">Show sites linking to</span>
              {Array.from({ length: Math.max(1, cols.length) }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" onClick={() => setMinCompetitors(n)}
                  className={cn("rounded-md px-2 py-1", minCompetitors === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                  {n === 1 ? "any competitor" : `${n}+ competitors`}
                </button>
              ))}
              <span className="ml-auto text-muted-foreground">
                {rows.length} shown{data.total_count ? ` · ${compact(data.total_count)} found in total` : ""}
              </span>
            </div>
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-2 font-medium">Site (not linking to you)</th>
                  <th className="px-3 py-2 text-right font-medium">Authority</th>
                  <th className="px-3 py-2 font-medium">Links to</th>
                  {cols.map((c) => <th key={c} className="max-w-[9rem] truncate px-3 py-2 text-right font-medium normal-case" title={c}>{c}</th>)}
                </tr></thead>
                <tbody className="divide-y divide-border/60">
                  {rows.map((r) => (
                    <tr key={r.domain} className="hover:bg-muted/40">
                      <td className="px-6 py-2">
                        <a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                          {r.domain}<ExternalLink className="size-3" />
                        </a>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold tabular-nums">{r.rank ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        <span className={cn("rounded-full px-2 py-0.5 font-medium",
                          r.competitors_linking > 1 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                          {r.competitors_linking} of {cols.length}
                        </span>
                      </td>
                      {cols.map((c) => (
                        <td key={c} className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                          {r.links[c] != null ? compact(r.links[c] ?? 0) : "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-6 py-2 text-xs text-muted-foreground">
              Tip: sites linking to several competitors already cover your topic — they&apos;re the most likely to link to you too.
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
