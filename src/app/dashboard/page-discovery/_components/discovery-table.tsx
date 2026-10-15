"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Pager } from "@/components/ui/pager"
import { SearchInput } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useDiscoveredPages } from "@/hooks/api/use-page-discovery"
import { errorMessage } from "@/lib/api/client"
import { pageDiscoveryApi, type DiscoveredPage } from "@/lib/api/page-discovery"
import { fetchAllPages } from "@/lib/api/pagination"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { scoreColor } from "@/app/dashboard/page-audit/_lib/page-audit-helpers"
import { Ban, Check, Download, ExternalLink, FileSearch, Loader2, Minus, PenLine } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { toast } from "sonner"
import {
  fmtDate, INDEXABLE_FILTERS, SORT_OPTIONS, STATUS_FILTERS, TYPE_FILTERS, sortOrder, typeMeta,
} from "../_lib/page-discovery-helpers"

const PAGE_SIZE = 10

export function DiscoveryTable({ wid, did, running, total, className }: {
  wid: string; did: string; running: boolean; total: number
  className?: string
}) {
  const [q, setQ] = React.useState("")
  const debouncedQ = useDebouncedValue(q)
  const [type, setType] = React.useState("all")
  const [status, setStatus] = React.useState("all")
  const [indexable, setIndexable] = React.useState("all")
  const [sort, setSort] = React.useState("priority")
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)

  // Any filter / sort change resets to page 1 (during render, no effect).
  const filterKey = `${debouncedQ}|${type}|${status}|${indexable}|${sort}`
  const [prevKey, setPrevKey] = React.useState(filterKey)
  if (filterKey !== prevKey) { setPrevKey(filterKey); setPage(1) }

  const filters = { type, status, indexable }
  const list = { page, pageSize: PAGE_SIZE, q: debouncedQ, sort, order: sortOrder(sort) }
  const query = useDiscoveredPages(wid, did, filters, list, running)
  const rows = query.data?.rows ?? []
  // Serial number offset for the current page (server-side pagination).
  const startIndex = ((query.data?.pagination.page ?? page) - 1) * PAGE_SIZE

  async function exportCsv() {
    setExporting(true)
    try {
      const all = await fetchAllPages((p, size) => pageDiscoveryApi.list(wid, did, { page: p, pageSize: size, q: debouncedQ }, filters))
      downloadCsv("discovered-pages",
        ["#", "URL", "Title", "Type", "Status", "Indexable", "Words", "Score", "Last modified"],
        all.map((r, i) => [i + 1, r.url, r.title, r.page_type, r.http_status ?? "", r.indexable == null ? "" : r.indexable ? "Yes" : "No", r.word_count ?? "", r.latest_audit_score ?? "", r.sitemap_lastmod ?? ""]))
    } catch (err) {
      toast.error(errorMessage(err, "Could not export."))
    } finally { setExporting(false) }
  }

  return (
    <Card className={className}>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Discovered pages <span className="text-muted-foreground">({total.toLocaleString()})</span></h3>
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={q} onValueChange={setQ} placeholder="Search pages…" className="w-48" aria-label="Search pages" />
            <FilterSelect value={type} onChange={setType} options={TYPE_FILTERS} label="Type" />
            <FilterSelect value={status} onChange={setStatus} options={STATUS_FILTERS} label="Status" />
            <FilterSelect value={indexable} onChange={setIndexable} options={INDEXABLE_FILTERS} label="Indexable" />
            <FilterSelect value={sort} onChange={setSort} options={SORT_OPTIONS} label="Sort" />
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting || total === 0}>
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export
            </Button>
          </div>
        </div>

        {query.isError ? (
          <p className="py-10 text-center text-sm text-destructive">{errorMessage(query.error, "Could not load pages.")}</p>
        ) : !query.data ? (
          <div className="rounded-lg border border-border"><TableSkeleton rows={8} columns={9} label="Loading pages…" /></div>
        ) : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {running ? "Scanning…" : debouncedQ || type !== "all" || status !== "all" || indexable !== "all" ? "No pages match these filters." : "No pages yet."}
          </p>
        ) : (
          <div className={cn("overflow-x-auto rounded-lg border border-border transition-opacity", query.isPlaceholderData && "opacity-60")}>
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="w-12 px-3 py-2 text-right font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Page</th>
                  <th className="w-28 px-3 py-2 font-medium">Type</th>
                  <th className="w-20 px-3 py-2 text-center font-medium">Status</th>
                  <th className="w-24 px-3 py-2 text-center font-medium">Indexable</th>
                  <th className="w-20 px-3 py-2 text-right font-medium">Words</th>
                  <th className="w-16 px-3 py-2 text-center font-medium">Score</th>
                  <th className="w-28 px-3 py-2 font-medium">Last mod.</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((r, i) => <Row key={r.id} row={r} sn={startIndex + i + 1} />)}
              </tbody>
            </table>
          </div>
        )}

        <Pager noun="pages" pagination={query.data?.pagination} fetching={query.isFetching} onPageChange={setPage} />
      </CardContent>
    </Card>
  )
}

function Row({ row: r, sn }: {
  row: DiscoveredPage; sn: number
}) {
  const t = typeMeta(r.page_type)
  const ok = r.http_status === 200
  return (
    <tr className="align-top hover:bg-muted/40">
      <td className="px-3 py-2.5 text-right text-xs tabular-nums text-muted-foreground">{sn}</td>
      <td className="max-w-0 px-3 py-2.5">
        <a href={r.url} target="_blank" rel="noreferrer" className="group flex items-center gap-1 font-medium hover:text-primary">
          <span className="truncate">{r.title || r.url}</span>
          <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
        </a>
        <p className="truncate text-xs text-muted-foreground">{r.url}</p>
      </td>
      <td className="px-3 py-2.5">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-muted/40 px-1.5 py-0.5 text-xs">
          <span className="size-2 shrink-0 rounded-sm" style={{ background: t.color }} />{t.label}
        </span>
      </td>
      <td className="px-3 py-2.5 text-center">
        <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
          r.http_status == null ? "text-muted-foreground"
            : ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive")}>
          {r.http_status ?? "—"}
        </span>
      </td>
      <td className="px-3 py-2.5 text-center">
        {r.indexable == null ? <Minus className="mx-auto size-4 text-muted-foreground" aria-label="Unknown" />
          : r.indexable ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <Check className="size-3" /> Indexable
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <Ban className="size-3" /> Noindex
            </span>
          )}
      </td>
      <td className="px-3 py-2.5 text-right text-xs tabular-nums">
        {r.word_count == null ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(r.word_count < 300 ? "font-medium text-amber-600 dark:text-amber-400" : "text-foreground")}
            title={r.word_count < 300 ? "Thin content — under 300 words" : undefined}
          >
            {r.word_count.toLocaleString()}
          </span>
        )}
      </td>
      <td className="px-3 py-2.5 text-center">
        <MiniScore score={r.latest_audit_score} />
      </td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground">{fmtDate(r.sitemap_lastmod)}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center justify-end gap-3">
          <Link href={`/dashboard/page-discovery/edit?page=${encodeURIComponent(r.id)}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            <PenLine className="size-3.5" /> Edit
          </Link>
          <Link href={`/dashboard/page-audit?url=${encodeURIComponent(r.url)}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground" title="Open full Page Audit">
            <FileSearch className="size-3.5" /> Audit
          </Link>
        </div>
      </td>
    </tr>
  )
}

/** Small circular audit-score ring for the table (— when never audited). */
function MiniScore({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>
  const c = 2 * Math.PI * 15
  return (
    <div className="relative mx-auto flex size-9 items-center justify-center" title={`Audit score ${score}/100`}>
      <svg className="size-9 -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3.5" className="stroke-muted" />
        <circle cx="18" cy="18" r="15" fill="none" strokeWidth="3.5" strokeLinecap="round"
          className={cn("stroke-current", scoreColor(score))}
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <span className={cn("absolute text-[11px] font-semibold tabular-nums", scoreColor(score))}>{score}</span>
    </div>
  )
}

function FilterSelect({ value, onChange, options, label }: {
  value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange((v as string) ?? "all")}>
      <SelectTrigger className="h-9 w-auto min-w-[8.5rem]" aria-label={label}>
        <SelectValue>{(v) => options.find((o) => o.value === v)?.label ?? label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
