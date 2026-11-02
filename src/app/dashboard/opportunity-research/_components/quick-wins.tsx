"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IntentBadge } from "@/app/dashboard/keyword-analysis/_components/intent-badge"
import { QuickWinsChart } from "@/components/charts/lazy"
import { Pager } from "@/components/ui/pager"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useActiveMarket } from "@/hooks/dashboard"
import { useConnectGsc } from "@/hooks/api/use-gsc"
import { useQuickWins } from "@/hooks/api/use-opportunity"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { errorMessage } from "@/lib/api/client"
import { keywordReportsApi, type StrikingDistanceRow } from "@/lib/api/keyword-reports"
import { fetchAllPages } from "@/lib/api/pagination"
import { toast } from "sonner"
import { downloadCsv } from "@/lib/report/csv"
import { cn } from "@/lib/utils"
import { Download, Info, Loader2, RefreshCw } from "lucide-react"
import * as React from "react"
import { SearchInput } from "@/components/ui/search-input"
import { HeaderWithHelp } from "@/components/ui/column-help"
import { COLUMN_HELP } from "@/lib/column-help"

const num = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString())

const PAGE_SIZE = 25

/** Shown when this domain has no usable Search Console link. If the message
 *  signals an expired/revoked token, offer a one-click "Connect again" that
 *  restarts Google OAuth and returns to this exact tab. */
function GscConnectPrompt({ wid, message }: { wid: string; message?: string | null }) {
  const connect = useConnectGsc(wid)
  const expired = /expired|revoked|invalid_grant|reconnect/i.test(message ?? "")

  function reconnect() {
    if (!wid) return
    const returnPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard"
    connect.mutate(returnPath, {
      onError: () => toast.error("Could not start the Google connection. Please try again."),
    })
  }

  return (
    <Alert className="border-amber-500/30 bg-amber-500/5">
      <Info className="size-4 text-amber-500" />
      <AlertTitle className="text-sm">
        {expired ? "Your Google connection expired" : "Connect your search data for this domain"}
      </AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3 text-xs">
        <p>
          {expired
            ? "Google signed out this site’s Search Console link, so we can’t read your live rankings. Reconnect to restore quick wins."
            : "Quick wins use your real ranking positions from Google Search Console."}
        </p>
        <Button size="sm" onClick={reconnect} disabled={!wid || connect.isPending}>
          {connect.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {expired ? "Connect again" : "Connect Google Search Console"}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/** Quick wins (striking distance): keywords the domain already ranks #4–20 for
 * in Search Console, ranked by opportunity — "our keywords where we can rank".
 * Loads for the page's selected domain; Search Console is free to query. */
export function QuickWins({ wid, did }: { wid: string; did: string }) {
  const { country: activeCountry, language: activeLanguage } = useActiveMarket()
  const [onlyReal, setOnlyReal] = React.useState(true)
  const [filter, setFilter] = React.useState("")
  const q = useDebouncedValue(filter)
  const [page, setPage] = React.useState(1)
  const [exporting, setExporting] = React.useState(false)
  const minVolume = onlyReal ? 10 : 0

  // A new filter starts again at page 1 (adjusted during render).
  const filterKey = `${q}|${onlyReal}`
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey)
  if (filterKey !== prevFilterKey) { setPrevFilterKey(filterKey); setPage(1) }

  // ONE page of rows + every keyword's chart point (server-side search / paging).
  const list = { page, pageSize: PAGE_SIZE, sort: "opportunity", order: "desc", q } as const
  const query = useQuickWins(wid, did, minVolume, list)
  const data = query.data ?? null
  const rows = data?.rows ?? []

  /** Every matching row (fetched in big pages), as CSV. */
  async function exportCsv() {
    setExporting(true)
    try {
      const all = await fetchAllPages((p, size) =>
        keywordReportsApi.strikingDistance(wid, did, { country: activeCountry, language: activeLanguage, minVolume }, { ...list, page: p, pageSize: size })
          .then((d) => ({ rows: d.rows, pagination: d.pagination! })))
      downloadCsv("quick-wins", ["Keyword", "Intent", "Position", "Impressions", "Clicks", "Volume", "Opportunity"],
        all.map((r) => [r.keyword, r.intent, r.position, r.impressions, r.clicks, r.volume ?? "", r.opportunity]))
    } catch (err) {
      toast.error(errorMessage(err, "Could not export."))
    } finally { setExporting(false) }
  }

  if (query.isPending) {
    return (
      <Card aria-busy="true">
        <CardContent className="space-y-4 pt-6">
          <span className="sr-only" role="status">Loading quick wins…</span>
          <div className="flex justify-between gap-3"><Skeleton className="h-5 w-48" /><Skeleton className="h-8 w-64" /></div>
          <Skeleton className="h-56 w-full rounded-lg" />
          <TableSkeleton rows={6} columns={5} />
        </CardContent>
      </Card>
    )
  }
  if (query.isError) {
    return <Alert variant="destructive"><AlertDescription>{errorMessage(query.error, "Could not load quick wins.")}</AlertDescription></Alert>
  }
  if (data && !data.connected) {
    return <GscConnectPrompt wid={wid} message={data.message} />
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Quick wins <span className="text-muted-foreground">· {data?.count ?? 0}</span></h3>
            <p className="text-xs text-muted-foreground">
              Keywords you already rank #4–20 for — small on-page improvements here move the most traffic.
              {data ? <> · {data.site_url} · last {data.days} days</> : null}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-muted-foreground"
              title="Hide operator/scraper queries and terms with no search demand">
              <input type="checkbox" checked={onlyReal} className="size-4" onChange={(e) => setOnlyReal(e.target.checked)} />
              Real keywords only
            </label>
            <SearchInput value={filter} onValueChange={setFilter} placeholder="Filter keywords…" className="w-52" />
            <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data || exporting}>
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export
            </Button>
          </div>
        </div>
        {/* Chart: every matching keyword (slim points), not just this page. */}
        {(data?.points.length ?? 0) > 1 && <QuickWinsChart points={data!.points} />}
        {(data?.pagination?.total ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No keywords at positions #4–20 in this window.</p>
        ) : (
          <>
          <div className={cn("scrollbar-hide overflow-x-auto transition-opacity", query.isPlaceholderData && "opacity-60")}>
            <table className="w-full min-w-[620px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pl-3 pr-2 text-left font-medium"><HeaderWithHelp help={COLUMN_HELP.keyword}>Keyword</HeaderWithHelp></th>
                  <th className="py-2 pr-2 text-left font-medium"><HeaderWithHelp help={COLUMN_HELP.intent}>Intent</HeaderWithHelp></th>
                  <th className="py-2 pr-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.position}>Position</HeaderWithHelp></th>
                  <th className="py-2 pr-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.impressions}>Impr.</HeaderWithHelp></th>
                  <th className="py-2 pr-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.volume}>Volume</HeaderWithHelp></th>
                  <th className="py-2 pr-3 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.opportunity}>Opportunity</HeaderWithHelp></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: StrikingDistanceRow) => (
                  <tr key={r.keyword} className="border-b border-border/50 last:border-0 hover:bg-muted/30">
                    <td className="max-w-[340px] truncate py-2 pl-3 pr-2 font-medium" title={r.keyword}>{r.keyword}</td>
                    <td className="py-2 pr-2"><IntentBadge intent={r.intent} /></td>
                    <td className={cn("py-2 pr-2 text-right font-semibold tabular-nums", r.position <= 10 ? "text-emerald-500" : "text-amber-500")}>{r.position.toFixed(1)}</td>
                    <td className="py-2 pr-2 text-right tabular-nums text-muted-foreground">{r.impressions.toLocaleString()}</td>
                    <td className="py-2 pr-2 text-right tabular-nums">{num(r.volume)}</td>
                    <td className="py-2 pr-3 text-right font-semibold tabular-nums text-primary">{Math.round(r.opportunity).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager noun="keywords" pagination={data?.pagination} fetching={query.isFetching} onPageChange={setPage} />
          </>
        )}
      </CardContent>
    </Card>
  )
}
