"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type CompetitorAnalytics } from "@/lib/api/opportunity"
import { cn } from "@/lib/utils"
import { Loader2, RefreshCw } from "lucide-react"
import { compact, formatFetched, rankColor } from "../_lib/competitive-strategy-helpers"
import { HeaderWithHelp } from "@/components/ui/column-help"
import { COLUMN_HELP } from "@/lib/column-help"

interface Props {
  analytics: CompetitorAnalytics | null
  loading: boolean
  refreshing: boolean
  error: string | null
  onRefresh: (force: boolean) => void
}

export function CompetitorAnalyticsCard({ analytics, loading, refreshing, error, onRefresh }: Props) {
  const rows = analytics?.rows ?? []
  const maxTraffic = Math.max(...rows.map((r) => r.organic_traffic), 1)

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2 text-base">
            Whole-site competitor analytics
          </CardTitle>
          <CardDescription>
            Estimated monthly organic traffic, ranking keywords and traffic share
            {analytics?.fetched_at && <> · updated {formatFetched(analytics.fetched_at)}</>}
          </CardDescription>
        </div>
        {analytics?.configured !== false && (
          <Button variant="outline" size="sm" disabled={refreshing || loading}
            onClick={() => onRefresh(rows.length > 0)}>
            {refreshing
              ? <Loader2 className="size-3.5 animate-spin" />
              : <RefreshCw className="size-3.5" />}
            {rows.length > 0 ? "Refresh data" : "Fetch data"}
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {error && (
          <div className="mx-6 mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        )}

        {loading || (refreshing && rows.length === 0) ? (
          <div className="flex items-center gap-2 px-6 pb-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {refreshing ? "Fetching whole-site metrics…" : "Loading competitor analytics…"}
          </div>
        ) : analytics && !analytics.configured && rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            Whole-site data isn&apos;t available right now. Please try again later.
          </p>
        ) : rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            No whole-site metrics yet. Fetch them to compare traffic and keyword counts.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-6 py-2.5 font-medium">Domain</th>
                  <th className="px-4 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.siteTraffic}>Est. traffic / mo</HeaderWithHelp></th>
                  <th className="px-4 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.trafficShare}>Traffic share</HeaderWithHelp></th>
                  <th className="px-4 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.rankingKeywords}>Ranking keywords</HeaderWithHelp></th>
                  <th className="px-4 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.top3}>Top 3</HeaderWithHelp></th>
                  <th className="px-4 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.top10}>Top 10</HeaderWithHelp></th>
                  <th className="px-4 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.backlinks}>Backlinks</HeaderWithHelp></th>
                  <th className="px-4 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.refDomains}>Ref. domains</HeaderWithHelp></th>
                  <th className="px-6 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.domainRank}>Domain rank</HeaderWithHelp></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => (
                  <tr key={r.domain} className={cn("hover:bg-muted/40", r.is_you && "bg-primary/5")}>
                    <td className="px-6 py-2.5">
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{r.domain}</span>
                        {r.is_you && <Badge variant="primary">You</Badge>}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      <span className="inline-flex items-center justify-end gap-2">
                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <span className="block h-full rounded-full bg-primary"
                            style={{ width: `${Math.round((r.organic_traffic / maxTraffic) * 100)}%` }} />
                        </span>
                        {compact(r.organic_traffic)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{r.traffic_share}%</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{compact(r.ranking_keywords)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{compact(r.top3_keywords)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{compact(r.top10_keywords)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.backlinks != null ? compact(r.backlinks) : "—"}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{r.referring_domains != null ? compact(r.referring_domains) : "—"}</td>
                    <td className={cn("px-6 py-2.5 text-right font-semibold tabular-nums", rankColor(r.domain_rank))}>
                      {r.domain_rank ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {rows.length > 0 && (
          <p className="border-t border-border px-6 py-2.5 text-xs text-muted-foreground">
            Traffic share is relative to the domains listed. Domain rank is a 0–100 strength score based on backlinks.
            {analytics && analytics.missing.length > 0 && <> Not yet fetched: {analytics.missing.join(", ")}.</>}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
