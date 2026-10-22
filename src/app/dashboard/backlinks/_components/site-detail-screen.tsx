"use client"

import { ArrowLeft, ExternalLink, Globe2 } from "lucide-react"
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
import { useRefreshSiteDetail, useSiteDetail } from "@/hooks/api/use-backlinks"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { compact } from "../../competitive-strategy/_lib/competitive-strategy-helpers"
import { DataStatus, FetchButton, Stat } from "./fetch-controls"

const PAGE_SIZE = 20
const date = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : "—")
function authTone(r: number | null | undefined) {
  if (r == null) return "text-muted-foreground"
  return r >= 50 ? "text-emerald-600 dark:text-emerald-400" : r >= 20 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
}

export default function SiteDetailScreen() {
  const params = useSearchParams()
  const host = params.get("host")
  const target = params.get("target")
  const { activeWorkspace, activeDomain } = useDashboard()
  const wid = activeWorkspace?.id ?? null
  const did = activeDomain?.id ?? null
  const [search, setSearch] = React.useState("")
  const q = useDebouncedValue(search.trim(), 300)
  const [page, setPage] = React.useState(1)
  // New search / site → back to page 1 (render-time reset, no effect).
  const resetKey = `${host}|${q}`
  const [seen, setSeen] = React.useState(resetKey)
  if (seen !== resetKey) { setSeen(resetKey); setPage(1) }

  const query = useSiteDetail(wid, did, host, target, { page, pageSize: PAGE_SIZE, q, sort: null, desc: true })
  const refresh = useRefreshSiteDetail(wid, did)
  const data = query.data ?? null
  const s = data?.summary

  const HEADER = (
    <PageHeader title={<><Globe2 className="size-5 text-primary" /> {host ?? "Referring site"}</>}
      description="Links from this site to you." />
  )
  if (!activeDomain) return <div className="space-y-6">{HEADER}<NoDomain what="this site" /></div>
  if (!host) return <div className="space-y-6">{HEADER}<Card className="p-6 text-sm text-muted-foreground">No site selected.</Card></div>

  function loadAll(force: boolean) {
    if (!wid || !did || !host) return
    refresh.mutate({ host, target, force }, { onSuccess: (d) => { if (d.fetched_now) toast.success("All links loaded") } })
  }

  const backHref = `/dashboard/backlinks${target ? `?target=${encodeURIComponent(target)}` : ""}`

  return (
    <div className="space-y-6">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Backlinks</Link>
      {HEADER}
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0 space-y-1">
            <a href={`https://${host}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lg font-semibold text-primary hover:underline">{host}<ExternalLink className="size-3.5" /></a>
            {data && <DataStatus state={data} />}
          </div>
          {data && <FetchButton state={data} busy={refresh.isPending} onFetch={loadAll} label="all links" requests={1} />}
        </div>

        {query.isPending ? (
          <div className="border-t border-border"><TableSkeleton rows={6} columns={4} label="Loading…" /></div>
        ) : !data || !data.found ? (
          <div className="border-t border-border px-6 py-12 text-center text-sm text-muted-foreground">
            No saved links from this site{data?.can_fetch ? " yet — use Load all links." : "."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Authority" value={s?.authority ?? "—"} tone={authTone(s?.authority)} />
              <Stat label="Links to you" value={s ? compact(s.links_to_you) : "—"} />
              <Stat label="Dofollow" value={s ? compact(s.dofollow_links) : "—"} />
              <Stat label="Spam" value={s?.spam_score ?? "—"} />
              <Stat label="First seen" value={date(s?.first_seen)} />
              <Stat label="Last seen" value={date(s?.last_seen)} />
            </div>
            {!data.complete && (
              <p className="border-t border-border bg-muted/30 px-6 py-2 text-xs text-muted-foreground">
                Showing the saved links from this site. Use Load all links for the complete list.
              </p>
            )}
            <div className="flex items-center gap-2 border-t border-border px-6 py-3">
              <SearchInput value={search} onValueChange={setSearch} placeholder="Search links…" className="w-full sm:w-72" />
            </div>
            <div className="overflow-x-auto border-t border-border">
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Linking page · anchor</th>
                  <th className="px-3 py-2 font-medium">Links to</th>
                  <th className="px-3 py-2 text-right font-medium">Authority</th>
                  <th className="px-3 py-2 text-right font-medium">First / last seen</th>
                </tr></thead>
                <tbody className="divide-y">
                  {data.links.map((l, i) => (
                    <tr key={`${l.url_from}:${i}`} className="align-top hover:bg-muted/40">
                      <td className="max-w-[360px] px-4 py-2">
                        <a href={l.url_from} target="_blank" rel="noopener noreferrer" className="block truncate font-medium text-primary hover:underline" title={l.url_from}>{l.page_from_title || l.url_from}</a>
                        <span className="block truncate text-xs text-muted-foreground">{l.anchor ? `“${l.anchor}”` : "no anchor"} · {l.dofollow ? "dofollow" : "nofollow"}{l.is_broken ? " · broken" : ""}</span>
                      </td>
                      <td className="max-w-[260px] px-3 py-2">
                        <a href={l.url_to ?? "#"} target="_blank" rel="noopener noreferrer" className="block truncate text-primary hover:underline" title={l.url_to ?? ""}>{(l.url_to ?? "—").replace(/^https?:\/\//, "")}</a>
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
