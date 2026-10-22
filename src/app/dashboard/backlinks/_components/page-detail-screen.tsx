"use client"

import { AlertTriangle, ArrowLeft, ExternalLink, FileText } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"

import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Card } from "@/components/ui/card"
import { Pager } from "@/components/ui/pager"
import { SearchInput } from "@/components/ui/search-input"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { usePageDetail, useRefreshPageDetail } from "@/hooks/api/use-backlinks"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { compact } from "../../competitive-strategy/_lib/competitive-strategy-helpers"
import { DataStatus, FetchButton, Stat } from "./fetch-controls"

const PAGE_SIZE = 25
const date = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : "—")
function authTone(r: number | null | undefined) {
  if (r == null) return "text-muted-foreground"
  return r >= 50 ? "text-emerald-600 dark:text-emerald-400" : r >= 20 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
}

export default function PageDetailScreen() {
  const params = useSearchParams()
  const url = params.get("url")
  const target = params.get("target")
  const { activeWorkspace, activeDomain } = useDashboard()
  const wid = activeWorkspace?.id ?? null
  const did = activeDomain?.id ?? null
  const [search, setSearch] = React.useState("")
  const q = useDebouncedValue(search.trim(), 300)
  const [page, setPage] = React.useState(1)
  // New search / page → back to page 1 (render-time reset, no effect).
  const resetKey = `${url}|${q}`
  const [seen, setSeen] = React.useState(resetKey)
  if (seen !== resetKey) { setSeen(resetKey); setPage(1) }

  const query = usePageDetail(wid, did, url, target, { page, pageSize: PAGE_SIZE, q, sort: null, desc: true })
  const refresh = useRefreshPageDetail(wid, did)
  const data = query.data ?? null
  const s = data?.summary
  const broken = s?.status === "broken"

  const shortUrl = (url ?? "page").replace(/^https?:\/\//, "")
  const HEADER = (
    <PageHeader title={<><FileText className="size-5 text-primary" /> {shortUrl}</>}
      description="Every site linking to this page." />
  )
  if (!activeDomain) return <div className="space-y-6">{HEADER}<NoDomain what="this page" /></div>
  if (!url) return <div className="space-y-6">{HEADER}<Card className="p-6 text-sm text-muted-foreground">No page selected.</Card></div>

  function loadAll(force: boolean) {
    if (!wid || !did || !url) return
    refresh.mutate({ url, target, force }, { onSuccess: (d) => { if (d.fetched_now) toast.success("All links loaded") } })
  }

  const backHref = `/dashboard/backlinks${target ? `?target=${encodeURIComponent(target)}` : ""}`

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Backlinks</Link>
      {HEADER}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 truncate text-lg font-semibold text-primary hover:underline" title={url}>{shortUrl}<ExternalLink className="size-3.5 shrink-0" /></a>
              {s && <span className={cn("rounded px-1.5 py-px text-xs font-medium", broken ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400")}>{broken ? "Broken" : "Live"}</span>}
            </div>
            {data && <DataStatus state={data} />}
          </div>
          {data && <FetchButton state={data} busy={refresh.isPending} onFetch={loadAll} label="all links" requests={1} />}
        </div>

        {query.isPending ? (
          <div className="border-t border-border"><TableSkeleton rows={6} columns={4} label="Loading…" /></div>
        ) : !data || !data.found ? (
          <div className="border-t border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No saved links to this page{data?.can_fetch ? " yet — use Load all links." : "."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Links" value={s ? compact(s.links) : "—"} />
              <Stat label="Linking sites" value={s ? compact(s.linking_sites) : "—"} />
              <Stat label="Dofollow" value={s ? compact(s.dofollow) : "—"} />
              <Stat label="Best authority" value={s?.best_authority ?? "—"} tone={authTone(s?.best_authority)} />
              <Stat label="First seen" value={date(s?.first_seen)} />
              <Stat label="Last seen" value={date(s?.last_seen)} />
            </div>
            {broken && s?.suggested_fix && (
              <div className="flex gap-3 border-t border-amber-500/25 bg-amber-500/5 px-6 py-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-medium">This page no longer loads but still has backlinks.</p>
                  <p className="text-muted-foreground">
                    Suggested fix: {s.suggested_fix}. <Link href={`/dashboard/page-audit?url=${encodeURIComponent(url)}`} className="text-primary hover:underline">Check it in Page Audit</Link>.
                  </p>
                </div>
              </div>
            )}
            {!data.complete && (
              <p className="border-t border-border bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
                Showing the saved links to this page. Use Load all links for the complete list.
              </p>
            )}
            <div className="flex items-center gap-2 border-t border-border px-6 py-3">
              <SearchInput value={search} onValueChange={setSearch} placeholder="Search links…" className="w-full sm:w-72" />
            </div>
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Linking site</th>
                  <th className="px-3 py-2 font-medium">Linking page · anchor</th>
                  <th className="px-3 py-2 text-right font-medium">Authority</th>
                  <th className="px-3 py-2 text-right font-medium">First / last seen</th>
                </tr></thead>
                <tbody className="divide-y">
                  {data.links.map((l, i) => (
                    <tr key={`${l.url_from}:${i}`} className="align-top hover:bg-muted/40">
                      <td className="px-4 py-2">
                        {l.domain_from ? (
                          <Link href={`/dashboard/backlinks/site?host=${encodeURIComponent(l.domain_from)}${target ? `&target=${encodeURIComponent(target)}` : ""}`} className="font-medium text-primary hover:underline">{l.domain_from}</Link>
                        ) : "—"}
                      </td>
                      <td className="max-w-[360px] px-3 py-2">
                        <a href={l.url_from} target="_blank" rel="noopener noreferrer" className="block truncate text-primary hover:underline" title={l.url_from}>{l.page_from_title || l.url_from}</a>
                        <span className="block truncate text-xs text-muted-foreground">{l.anchor ? `“${l.anchor}”` : "no anchor"} · {l.dofollow ? "dofollow" : "nofollow"}</span>
                      </td>
                      <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", authTone(l.domain_from_rank))}>{l.domain_from_rank ?? "—"}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{date(l.first_seen)} / {date(l.last_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager className="border-t border-border px-4 py-1.5" pagination={data.pagination} onPageChange={setPage} fetching={query.isFetching && !query.isPending} noun="links" />
          </>
        )}
      </Card>
    </div>
  )
}
