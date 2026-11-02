"use client"

import { Button } from "@/components/ui/button"
import { Pager } from "@/components/ui/pager"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useCompetitorKeywords } from "@/hooks/api/use-competitor-keywords"
import { errorMessage } from "@/lib/api/client"
import { opportunityApi, type CompetitorKeywordKind } from "@/lib/api/opportunity"
import { fetchAllPages } from "@/lib/api/pagination"
import { toast } from "sonner"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"
import { Download, ExternalLink, Loader2 } from "lucide-react"
import * as React from "react"
import { compact, posColor } from "../_lib/competitive-strategy-helpers"
import { HeaderWithHelp } from "@/components/ui/column-help"
import { COLUMN_HELP } from "@/lib/column-help"
import { KeywordActionsMenu } from "@/components/keywords/keyword-actions-menu"

const PAGE_SIZE = 10

function kdColor(v: number | null) {
  if (v == null) return "text-muted-foreground"
  return v >= 70 ? "text-red-500" : v >= 40 ? "text-amber-500" : "text-emerald-600 dark:text-emerald-400"
}

interface Props {
  workspaceId: string
  domainId: string
  competitor: string
  kind: Exclude<CompetitorKeywordKind, "all">
}

/** A competitor's keywords (common or gap) with URL, volume, positions, est.
 * visits, CPC, paid & SEO difficulty — all from stored SERP/Ads/GSC data. */
export function CompetitorKeywordsPanel({ workspaceId, domainId, competitor, kind }: Props) {
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)
  const list = { page, pageSize: PAGE_SIZE, sort: "search_volume", order: "desc" } as const
  // ONE page from the server; the previous page stays visible while the next loads.
  const query = useCompetitorKeywords(workspaceId, domainId, competitor, kind, list)
  const data = query.data ?? null

  if (query.isError) return <p className="px-6 py-4 text-sm text-destructive">{errorMessage(query.error, "Could not load keywords.")}</p>
  if (!data) return <TableSkeleton rows={5} columns={7} label="Loading keywords…" />
  if ((data.pagination?.total ?? data.rows.length) === 0) {
    return (
      <p className="px-6 py-4 text-sm text-muted-foreground">
        {kind === "common"
          ? "No shared keywords yet — you don't rank for any tracked keyword this competitor ranks for."
          : "No keyword gap — you rank for every tracked keyword this competitor ranks for."}
      </p>
    )
  }

  const rows = data.rows

  /** Every row (fetched in big pages), as CSV. */
  async function exportCsv() {
    setExporting(true)
    try {
      const all = await fetchAllPages((p, size) =>
        opportunityApi.competitorKeywords(workspaceId, domainId, competitor, kind, { ...list, page: p, pageSize: size })
          .then((d) => ({ rows: d.rows, pagination: d.pagination! })))
      downloadCsv(
        `${competitor}-${kind}-keywords`,
        ["Keyword", "Their URL", "Volume", "Their position", "Your position", "Est. visits",
          "CPC", "Paid difficulty", "SEO difficulty"],
        all.map((r) => [
          r.keyword, r.their_url ?? "", r.search_volume ?? "", r.their_position,
          r.our_position ?? "", r.est_visits ?? "", r.cpc ?? "", r.paid_difficulty ?? "",
          r.seo_difficulty ?? "",
        ]),
      )
    } catch (e) {
      toast.error(errorMessage(e, "Could not export."))
    } finally { setExporting(false) }
  }

  return (
    <div className="bg-muted/20">
      <div className={cn("overflow-x-auto transition-opacity", query.isPlaceholderData && "opacity-60")}>
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-6 py-2 font-medium"><HeaderWithHelp help={COLUMN_HELP.keywordUrl}>Keyword</HeaderWithHelp></th>
              <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.volume}>Volume</HeaderWithHelp></th>
              <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.theirPosition}>Their pos.</HeaderWithHelp></th>
              <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.yourPosition}>Your pos.</HeaderWithHelp></th>
              <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.estVisits}>Est. visits</HeaderWithHelp></th>
              <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.cpc}>CPC</HeaderWithHelp></th>
              <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.paidDifficulty}>Paid diff.</HeaderWithHelp></th>
              <th className="px-6 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.seoDifficulty}>SEO diff.</HeaderWithHelp></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {rows.map((r) => (
              <tr key={r.keyword} className="hover:bg-muted/40">
                <td className="max-w-[360px] px-6 py-2">
                  <div className="flex min-w-0 items-start gap-2">
                  <KeywordActionsMenu keyword={r.keyword} workspaceId={workspaceId} domainId={domainId} className="mt-px" />
                  <div className="min-w-0 flex-1">
                  {r.their_url ? (
                    // Keyword + URL are one link to their ranking page.
                    <a href={r.their_url} target="_blank" rel="noopener noreferrer" title={r.their_url}
                      className="group block min-w-0">
                      <span className="block truncate font-medium text-primary group-hover:underline">{r.keyword}</span>
                      <span className="flex items-center gap-1 truncate text-xs text-muted-foreground group-hover:text-foreground">
                        <span className="truncate">{r.their_url}</span>
                        <ExternalLink className="size-3 shrink-0" />
                      </span>
                    </a>
                  ) : (
                    <p className="truncate font-medium text-primary">{r.keyword}</p>
                  )}
                  </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.search_volume != null ? r.search_volume.toLocaleString() : "—"}</td>
                <td className={cn("px-3 py-2 text-right font-medium tabular-nums", posColor(r.their_position))}>{r.their_position}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {r.our_position != null ? (
                    <span className={posColor(r.our_position)} title={r.our_position_source === "gsc" ? "From your search data" : "From Google results"}>
                      {r.our_position}
                    </span>
                  ) : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{r.est_visits != null ? compact(r.est_visits) : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.cpc != null ? `$${r.cpc.toFixed(2)}` : "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.paid_difficulty ?? "—"}</td>
                <td className={cn("px-6 py-2 text-right font-semibold tabular-nums", kdColor(r.seo_difficulty))}>{r.seo_difficulty ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-2">
        <Pager className="flex-1" noun="keywords" pagination={data.pagination} fetching={query.isFetching} onPageChange={setPage} />
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
          {exporting ? <Loader2 className="size-3.5 animate-spin" /> : <Download className="size-3.5" />} Export CSV
        </Button>
      </div>
      <p className="px-6 pb-2 text-xs text-muted-foreground">Est. visits = volume × click-through rate at their position.</p>
    </div>
  )
}
