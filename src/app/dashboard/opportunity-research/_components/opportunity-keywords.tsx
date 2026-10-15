"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ColumnHelp, HeaderWithHelp } from "@/components/ui/column-help"
import { Pager } from "@/components/ui/pager"
import { SearchInput } from "@/components/ui/search-input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useActionItems, useActionPlan } from "@/hooks/api/use-action-plan"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { errorMessage } from "@/lib/api/client"
import { actionPlanApi, type ActionItem } from "@/lib/api/opportunity"
import { fetchAllPages } from "@/lib/api/pagination"
import { COLUMN_HELP } from "@/lib/column-help"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"
import { Download, ExternalLink, Loader2, Swords } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { kdBand } from "../_lib/opportunity-research-helpers"

const PAGE_SIZE = 20
const num = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString())

/** Sort options — "Best opportunity" is the plan's own priority (gain × ease). */
const SORTS = [
  { value: "opportunity", label: "Best opportunity" },
  { value: "volume", label: "Search volume" },
  { value: "gain", label: "Potential traffic" },
  { value: "difficulty", label: "Easiest first" },
] as const

function Kd({ kd }: { kd: number | null | undefined }) {
  if (kd == null) return <span className="text-muted-foreground">—</span>
  return <span className={cn("inline-flex min-w-9 justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums", kdBand(kd))}>{kd}</span>
}

function Pos({ pos }: { pos: number | null | undefined }) {
  if (pos == null) return <span className="text-muted-foreground">—</span>
  const tone = pos <= 3 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
    : pos <= 10 ? "bg-sky-500/10 text-sky-700 dark:text-sky-400"
      : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
  return <span className={cn("inline-flex rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums", tone)}>#{pos}</span>
}

function compHost(url: string | null, fallback: string | null) {
  if (!url) return fallback ?? "—"
  try { return new URL(url).hostname.replace(/^www\./, "") } catch { return fallback ?? "—" }
}

/**
 * Opportunity Keywords — keywords your competitors rank for (Google top-10) and
 * you don't yet. Computed live from stored competitor ranked-keyword data (no
 * paid call); each row links to the exact competitor page that ranks, so you can
 * study it and write a stronger one. Fully exportable for blog planning.
 */
export function OpportunityKeywords({ wid, did }: { wid: string; did: string }) {
  const [q, setQ] = React.useState("")
  const debouncedQ = useDebouncedValue(q)
  const [sort, setSort] = React.useState<string>("opportunity")
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)

  const filterKey = `${debouncedQ}|${sort}`
  const [prevKey, setPrevKey] = React.useState(filterKey)
  if (filterKey !== prevKey) { setPrevKey(filterKey); setPage(1) }

  const plan = useActionPlan(wid, did)
  // "opportunity" => plan's default priority order (no sort param).
  const sortParam = sort === "opportunity" ? undefined : sort
  const items = useActionItems(wid, did, "gap", { page, pageSize: PAGE_SIZE, q: debouncedQ, sort: sortParam })

  const rows = items.data?.rows ?? []
  const total = items.data?.pagination.total ?? 0
  const s = plan.data?.sources

  async function exportCsv() {
    setExporting(true)
    try {
      const all = await fetchAllPages((p, size) =>
        actionPlanApi.items(wid, did, "gap", { q: debouncedQ, sort: sortParam, page: p, pageSize: size }))
      downloadCsv("opportunity-keywords",
        ["Keyword", "Volume", "Difficulty", "Best competitor", "Their position", "Their ranking page",
          "Competitors ranking", "Potential visits/mo", "Why"],
        all.map((i: ActionItem) => [i.keyword, i.volume ?? "", i.difficulty ?? "",
          i.competitor ?? "", i.competitor_position ?? "", i.competitor_url ?? "",
          i.competitors_count ?? 1, i.gain, i.reason ?? ""]))
    } catch (err) {
      toast.error(errorMessage(err, "Could not export."))
    } finally { setExporting(false) }
  }

  if (plan.isPending && !items.data) {
    return <div className="rounded-xl border border-border"><TableSkeleton rows={10} columns={6} label="Finding opportunities…" /></div>
  }

  return (
    <div className="space-y-4">
      {/* Summary + controls */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Swords className="size-4 text-primary" /> Opportunity keywords
          </h2>
          <p className="ds-meta mt-0.5">
            {num(total)} keywords your competitors rank for and you don&apos;t
            {s?.competitors_with_rankings?.length ? ` · from ${s.competitors_with_rankings.join(", ")}` : ""}.
            Open a competitor&apos;s page to see how they rank, then write a better one.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onValueChange={setQ} placeholder="Filter keywords…" className="w-48" />
          <Select value={sort} onValueChange={(v) => setSort((v as string) ?? "opportunity")}>
            <SelectTrigger className="h-9 w-44">
              <SelectValue>{(v) => SORTS.find((o) => o.value === v)?.label ?? "Sort"}</SelectValue>
            </SelectTrigger>
            <SelectContent>{SORTS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting || total === 0}>
            {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export
          </Button>
        </div>
      </div>

      {items.isError ? (
        <Alert variant="destructive"><AlertDescription>{errorMessage(items.error, "Could not load opportunities.")}</AlertDescription></Alert>
      ) : !items.data ? (
        <div className="rounded-xl border border-border"><TableSkeleton rows={10} columns={6} label="Loading…" /></div>
      ) : total === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
          {debouncedQ ? "No opportunities match this filter." : (
            <>No competitor opportunities yet. Add competitors on{" "}
              <a href="/dashboard/competitors" className="text-primary hover:underline">Competitors</a>{" "}
              and pull their rankings on{" "}
              <a href="/dashboard/competitive-strategy" className="text-primary hover:underline">Competitive Strategy</a>.</>
          )}
        </div>
      ) : (
        <>
          <div className={cn("overflow-x-auto rounded-xl border border-border transition-opacity", items.isPlaceholderData && "opacity-60")}>
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium"><HeaderWithHelp help={COLUMN_HELP.keyword}>Keyword</HeaderWithHelp></th>
                  <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.volume}>Volume</HeaderWithHelp></th>
                  <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.seoDifficulty}>KD</HeaderWithHelp></th>
                  <th className="px-3 py-2 font-medium"><HeaderWithHelp help={COLUMN_HELP.bestCompetitor}>Best competitor</HeaderWithHelp></th>
                  <th className="px-3 py-2 text-center font-medium">Their pos.</th>
                  <th className="px-3 py-2 font-medium">Their ranking page</th>
                  <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.potentialGain}>Potential</HeaderWithHelp></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {rows.map((i) => (
                  <tr key={i.keyword} className="transition-colors hover:bg-muted/40">
                    <td className="max-w-[240px] px-4 py-2.5 font-medium"><span className="block truncate" title={i.keyword}>{i.keyword}</span></td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{num(i.volume)}</td>
                    <td className="px-3 py-2.5"><div className="flex justify-end"><Kd kd={i.difficulty} /></div></td>
                    <td className="px-3 py-2.5 text-xs">
                      <span className="font-medium">{compHost(i.competitor_url, i.competitor)}</span>
                      {i.competitors_count && i.competitors_count > 1 ? <span className="text-muted-foreground"> +{i.competitors_count - 1}</span> : null}
                    </td>
                    <td className="px-3 py-2.5 text-center"><Pos pos={i.competitor_position} /></td>
                    <td className="max-w-[260px] px-3 py-2.5">
                      {i.competitor_url ? (
                        <a href={i.competitor_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                          title={i.competitor_url}>
                          <span className="truncate">{i.competitor_url.replace(/^https?:\/\/(www\.)?/, "")}</span>
                          <ExternalLink className="size-3 shrink-0" />
                        </a>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-primary">+{num(i.gain)}<span className="text-[11px] font-normal text-muted-foreground">/mo</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager noun="opportunities" pagination={items.data.pagination} fetching={items.isFetching} onPageChange={setPage} />
          <p className="text-xs text-muted-foreground">
            Opportunities update automatically as new competitor ranking data comes in — no manual refresh, no extra cost.
            <span className="ml-1 inline-flex items-center gap-1"><ColumnHelp label="How this is built" text="For each competitor we read the keywords they rank in Google's top 10 for. Any that your site doesn't rank for becomes an opportunity, scored by search volume and how easy it is to rank. The linked page is the competitor's page that currently ranks." /></span>
          </p>
        </>
      )}
    </div>
  )
}
