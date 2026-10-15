"use client"

import { AiOverviewCard } from "@/components/dashboard/ai-overview-card"
import { contentOptimizationHref } from "@/components/keywords/keyword-actions-menu"
import { KeywordOpportunityMap, ResearchExplorer, type ResultSort } from "@/components/keywords/research-explorer"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SearchInput } from "@/components/ui/search-input"
import { Pager } from "@/components/ui/pager"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useKeywordPoints, useKeywordResults } from "@/hooks/api/use-keyword-search"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { aiOverviewApi } from "@/lib/api/ai-overview"
import { errorMessage } from "@/lib/api/client"
import { keywordSearchApi, type ResearchDetail } from "@/lib/api/keyword-search"
import { fetchAllPages } from "@/lib/api/pagination"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"
import { Download, Info, Loader2 } from "lucide-react"
import { motion } from "motion/react"
import * as React from "react"
import { toast } from "sonner"
import { CATEGORY_LABELS, INTENTS } from "../_lib/keyword-analysis-helpers"

const PAGE_SIZE = 25

/**
 * One saved keyword search: AI overview, category tabs, filters, the results
 * table and the opportunity map. Results are fetched ONE PAGE at a time with
 * server-side filter/sort (TanStack Query, cached per page). Mount it with
 * `key={detail.id}` so tabs, filters and the selected keyword reset when a
 * different search opens.
 */
export function KeywordResults({ detail, workspaceId, domainId }: {
  detail: ResearchDetail
  workspaceId: string
  domainId: string | null
}) {
  const [cat, setCat] = React.useState("all")
  const [intent, setIntent] = React.useState<(typeof INTENTS)[number]>("all")
  const [filter, setFilter] = React.useState("")
  const q = useDebouncedValue(filter)
  const [sort, setSort] = React.useState<ResultSort>({ key: "search_volume", desc: true })
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)
  // Shared by the results table and the opportunity map below it.
  const [selectedId, setSelectedId] = React.useState<string | null>(null)

  // Any filter / search / sort change starts again at page 1 (adjusted during render).
  const filterKey = `${cat}|${intent}|${q}|${sort.key}|${sort.desc}`
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey)
  if (filterKey !== prevFilterKey) { setPrevFilterKey(filterKey); setPage(1) }

  const list = { page, pageSize: PAGE_SIZE, sort: sort.key, order: sort.desc ? "desc" : "asc", q } as const
  const results = useKeywordResults(workspaceId, detail.id, { ...list, category: cat, intent })
  const points = useKeywordPoints(workspaceId, detail.id)

  async function exportCsv() {
    setExporting(true)
    try {
      const rows = await fetchAllPages((p, size) => keywordSearchApi.results(workspaceId, detail.id,
        { ...list, page: p, pageSize: size }, { category: cat, intent }))
      downloadCsv(
        `keyword-ideas-${detail.seed_keyword.replace(/\s+/g, "-")}`,
        ["Keyword", "Intent", "Volume", "CPC", "PD", "SEO Difficulty", "Categories"],
        rows.map((r) => [
          r.keyword, r.metric?.intent ?? "", r.metric?.search_volume ?? "",
          r.metric?.cpc ?? "", r.metric?.competition ?? "", r.metric?.difficulty ?? "", r.sources.join("|"),
        ])
      )
    } catch (err) {
      toast.error(errorMessage(err, "Could not export the keywords."))
    } finally { setExporting(false) }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold">Keyword Ideas <span className="text-muted-foreground">{detail.seed_keyword}</span></h3>
                <p className="text-xs text-muted-foreground">{detail.result_count.toLocaleString()} keywords · Google Autocomplete{detail.seed_metric?.search_volume != null ? " + Ads volume" : ""} · saved</p>
              </div>
              <Button variant="outline" size="sm" onClick={exportCsv} disabled={exporting}>
                {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export filtered
              </Button>
            </div>

            <AiOverviewCard requestKey={`search:${detail.id}`}
              action={{ label: "Optimize content for this", href: contentOptimizationHref(detail.seed_keyword) }}
              load={(refresh) => aiOverviewApi.keywordSearch(workspaceId, detail.id, refresh)} />

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 border-b border-border">
              {[{ name: "all", count: detail.result_count }, ...detail.categories].map((c) => (
                <button key={c.name} onClick={() => setCat(c.name)}
                  className={cn("flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
                    cat === c.name ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                  {c.name === "all" ? "All" : CATEGORY_LABELS[c.name] ?? c.name}
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">{c.count}</span>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <SearchInput value={filter} onValueChange={setFilter} placeholder="Filter keywords…" className="min-w-[180px] flex-1" />
              <Select value={intent} onValueChange={(v) => setIntent((v as typeof intent) ?? "all")}>
                <SelectTrigger className="h-9 w-40"><SelectValue>{(v) => (v === "all" ? "All intents" : String(v).replace(/^\w/, (c) => c.toUpperCase()))}</SelectValue></SelectTrigger>
                <SelectContent>{INTENTS.map((i) => (<SelectItem key={i} value={i}>{i === "all" ? "All intents" : i.replace(/^\w/, (c) => c.toUpperCase())}</SelectItem>))}</SelectContent>
              </Select>
            </div>

            {detail.seed_metric?.search_volume == null ? (
              <Alert className="border-sky-500/30 bg-sky-500/5">
                <Info className="size-4 text-sky-500" />
                <AlertTitle className="text-sm">Volume, CPC &amp; PD show “—” until Google Ads Keyword Planner is connected</AlertTitle>
                <AlertDescription className="text-xs">Keyword ideas are saved. Intent and difficulty are estimates. Connect Google Ads to add search volume, bid and advertising competition metrics.</AlertDescription>
              </Alert>
            ) : null}

            {results.isError ? (
              <Alert variant="destructive"><AlertDescription>{errorMessage(results.error, "Could not load these keywords.")}</AlertDescription></Alert>
            ) : null}
            <ResearchExplorer rows={results.data?.rows ?? []} workspaceId={workspaceId} domainId={domainId}
              country={detail.country_code} language={detail.language_code} selectedId={selectedId} onSelect={setSelectedId}
              sort={sort} onSortChange={setSort}
              loading={results.isPending} fetching={results.isPlaceholderData || (results.isFetching && !results.isPending)}
              footer={<Pager className="mt-3" noun="keywords" pagination={results.data?.pagination}
                fetching={results.isFetching} onPageChange={setPage} />} />
          </CardContent>
        </Card>
      </motion.div>

      {points.data ? (
        <KeywordOpportunityMap points={points.data.points} skipped={points.data.skipped}
          selectedId={selectedId} onSelect={setSelectedId} />
      ) : null}
    </>
  )
}
