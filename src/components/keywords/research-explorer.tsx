"use client"

import * as React from "react"
import { ArrowDownUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { KeywordMetric, ResearchResult } from "@/lib/api/keyword-analysis"
import { cn } from "@/lib/utils"
import { OpportunityMapChart } from "@/components/charts/lazy"
import { ColumnHelp, HeaderWithHelp } from "@/components/ui/column-help"
import { ScrollMoreHint } from "@/components/ui/scroll-more-hint"
import { COLUMN_HELP } from "@/lib/column-help"
import { KeywordActionsMenu } from "@/components/keywords/keyword-actions-menu"
import { KeywordBreakdownSheet } from "@/components/keywords/keyword-breakdown-sheet"
import type { OpportunityPoint } from "@/components/charts/opportunity-map-chart"

const number = (v: number | null | undefined) => v == null ? "—" : v.toLocaleString()
export type ResultSortKey = "search_volume" | "cpc" | "competition" | "difficulty"
export interface ResultSort { key: ResultSortKey; desc: boolean }
const ROW_SKELETONS = 8

/** Opportunity map from the search's slim points (every plottable keyword, not just this page). */
export function KeywordOpportunityMap({ points, skipped, selectedId, onSelect }: {
  points: OpportunityPoint[]; skipped: number; selectedId: string | null; onSelect: (id: string) => void
}) {
  if (points.length <= 1) return null
  return <section aria-label="Opportunity map" className="rounded-lg border bg-card p-4">
    <p className="mb-1 text-sm font-semibold">Opportunity map</p>
    <OpportunityMapChart points={points} skipped={skipped} selectedId={selectedId} onSelect={onSelect} />
  </section>
}

/**
 * One page of keyword results (server-side sort + pagination). Controlled:
 * the parent owns `sort` and the page; `loading` = first load (skeleton rows),
 * `fetching` = a new page/sort is loading while the current rows stay visible
 * (dimmed + progress bar) so the table never collapses or jumps.
 */
export function ResearchExplorer({ rows, workspaceId, domainId, country, language, selectedId, onSelect: setSelectedId,
  sort, onSortChange, loading = false, fetching = false, footer, seedKeyword, seedMetric }: {
  rows: ResearchResult[]; workspaceId: string; domainId?: string | null; country: string; language: string
  selectedId: string | null; onSelect: (id: string) => void
  sort: ResultSort; onSortChange: (sort: ResultSort) => void
  loading?: boolean; fetching?: boolean
  /** Rendered under the table (the pager). */
  footer?: React.ReactNode
  /** The searched keyword — pinned to the top of the list and highlighted. */
  seedKeyword?: string | null
  seedMetric?: KeywordMetric | null
}) {
  const resultsRef = React.useRef<HTMLDivElement>(null)
  // A new page / sort starts at the top of the table.
  const firstId = rows[0]?.keyword_id
  React.useEffect(() => { resultsRef.current?.scrollTo({ top: 0 }) }, [firstId])
  // Clicking a keyword opens its Keyword Breakdown (metrics, trend, Google results).
  const [breakdown, setBreakdown] = React.useState<string | null>(null)

  // Pin the searched keyword at the top, highlighted, so it's always visible
  // instead of buried by the volume sort. Reuse its real row (keeps id + metric)
  // when it's on this page; otherwise synthesize one from the seed's own metric.
  const normKw = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ")
  const seedNorm = seedKeyword ? normKw(seedKeyword) : null
  const seedExisting = seedNorm ? rows.find((r) => normKw(r.keyword) === seedNorm) : undefined
  const pinned: ResearchResult | null = seedNorm && seedKeyword
    ? seedExisting ?? { rank: 0, keyword_id: `seed:${seedNorm}`, keyword: seedKeyword, country_code: country, language_code: language, sources: [], metric: seedMetric ?? null }
    : null
  const bodyRows = seedExisting ? rows.filter((r) => r !== seedExisting) : rows

  const renderRow = (row: ResearchResult, isSeed = false) => (
    <tr key={row.keyword_id} className={cn("border-b last:border-0 hover:bg-muted/40",
      isSeed ? "bg-amber-400/15 hover:bg-amber-400/20" : selectedId === row.keyword_id && "bg-primary/10")}>
      <td className="p-3"><div className="flex items-center gap-2">
        <KeywordActionsMenu keyword={row.keyword} workspaceId={workspaceId} domainId={domainId} country={country} language={language} />
        <button className="text-left font-medium text-primary underline-offset-4 hover:underline" title="Open keyword breakdown" onClick={() => { setSelectedId(row.keyword_id); setBreakdown(row.keyword) }}>{row.keyword}</button>
        {isSeed && <span className="shrink-0 rounded-full bg-amber-400/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Your search</span>}
      </div></td>
      <td className="p-2 text-right tabular-nums">{number(row.metric?.search_volume)}</td>
      <td className="p-2 text-right tabular-nums">{number(row.metric?.cpc)}</td>
      <td className="p-2 text-right tabular-nums">{number(row.metric?.competition)}</td>
      <td className="p-2 text-right tabular-nums">{row.metric?.difficulty == null ? "—" : Math.round(row.metric.difficulty)}</td>
      <td className="p-3"><Badge variant="outline">{row.metric?.intent ?? "Unknown"}</Badge></td>
    </tr>
  )
  return <div className="min-w-0">
    <p className="mb-3 text-xs text-muted-foreground">Click a keyword (or its + menu) for its metrics, monthly trend and Google results. Difficulty is an estimated score; advertising competition uses a 0–100 index.</p>
    <div className="relative">
      {/* Thin progress bar while a new page / sort loads (no layout change). */}
      <div aria-hidden="true" className={cn("absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden rounded-t-lg transition-opacity", fetching ? "opacity-100" : "opacity-0")}>
        <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-primary" />
      </div>
      {/* overscrollBehavior auto overrides .scroll-pane's `contain`: once this
          table scrolls to its top/bottom the wheel keeps scrolling the page,
          instead of staying trapped while the cursor is over the table. */}
      <div ref={resultsRef} tabIndex={0} aria-label="Keyword results" aria-busy={loading || fetching}
        style={{ overscrollBehavior: "auto" }}
        className="scroll-pane max-h-[760px] min-h-[420px] overflow-auto rounded-lg border">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="sticky top-0 z-10 bg-card"><tr className="border-b">
            <th className="p-3 text-left"><HeaderWithHelp help={COLUMN_HELP.keyword}>Keyword</HeaderWithHelp></th>
            {([['search_volume', 'Volume', COLUMN_HELP.volume], ['cpc', 'CPC / bid', COLUMN_HELP.cpc], ['competition', 'Ads comp.', COLUMN_HELP.adsCompetition], ['difficulty', 'Est. KD', COLUMN_HELP.estDifficulty]] as const).map(([key, label, help]) => <th key={key} className="p-2 text-right" aria-sort={sort.key === key ? sort.desc ? "descending" : "ascending" : "none"}>
              <span className="inline-flex items-center gap-1">
                <button className={cn("inline-flex items-center gap-1 whitespace-nowrap", sort.key === key && "text-foreground")}
                  onClick={() => onSortChange({ key, desc: sort.key === key ? !sort.desc : true })}>{label}<ArrowDownUp className="size-3" /></button>
                <ColumnHelp text={help} label={label} />
              </span>
            </th>)}
            <th className="p-3 text-left"><HeaderWithHelp help={COLUMN_HELP.intent}>Intent</HeaderWithHelp></th>
          </tr></thead>
          <tbody className={cn("transition-opacity", fetching && "opacity-60")}>
            {loading ? Array.from({ length: ROW_SKELETONS }, (_, i) => (
              <tr key={i} className="border-b last:border-0">
                <td className="p-3"><div className="flex items-center gap-2"><Skeleton className="size-6" /><Skeleton className="h-4 w-48" /></div></td>
                {[0, 1, 2, 3].map((c) => <td key={c} className="p-2"><Skeleton className="ml-auto h-4 w-12" /></td>)}
                <td className="p-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
              </tr>
            )) : <>
              {pinned ? renderRow(pinned, true) : null}
              {bodyRows.map((row) => renderRow(row))}
            </>}
            {!loading && !bodyRows.length && !pinned ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No keywords match these filters.</td></tr> : null}
          </tbody>
        </table>
      </div>
      <ScrollMoreHint target={resultsRef} />
    </div>
    {footer}
    {breakdown && (
      <KeywordBreakdownSheet key={breakdown} keyword={breakdown} open tab="metrics"
        onOpenChange={(o) => { if (!o) setBreakdown(null) }}
        workspaceId={workspaceId} domainId={domainId} country={country} language={language}
        options={<KeywordActionsMenu keyword={breakdown} workspaceId={workspaceId} domainId={domainId}
          country={country} language={language} label="Options" inBreakdown />} />
    )}
  </div>
}
