"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { type CompetitorAnalytics, type OpportunityStrategy, type StrategyScope } from "@/lib/api/opportunity"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronDown, Trophy } from "lucide-react"
import * as React from "react"
import { compact, posColor } from "../_lib/competitive-strategy-helpers"
import { CompetitorKeywordsPanel } from "./competitor-keywords-panel"
import { HeaderWithHelp } from "@/components/ui/column-help"
import { COLUMN_HELP } from "@/lib/column-help"

interface Props {
  workspaceId: string
  domainId: string
  data: OpportunityStrategy
  analytics: CompetitorAnalytics | null
  /** Open the domain in "Where competitors actually rank" (optional). */
  onShowRankings?: (domain: string) => void
  /** Switch between your competitor list and all domains in your SERPs (optional). */
  onScopeChange?: (scope: StrategyScope) => void
}

type Open = { domain: string; kind: "common" | "gap" } | null

function ViewAll({ count, active, onClick }: { count: number; active: boolean; onClick: () => void }) {
  return (
    <span className="inline-flex items-center justify-end gap-2">
      <span className="tabular-nums">{count}</span>
      <button type="button" onClick={onClick} disabled={count === 0}
        className={cn("inline-flex items-center gap-0.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
          active ? "border-primary bg-primary text-primary-foreground" : "border-primary/40 text-primary hover:bg-primary/10")}>
        View all <ChevronDown className={cn("size-3 transition-transform", active && "rotate-180")} />
      </button>
    </span>
  )
}

/** Competitors on your tracked keywords, Ubersuggest-style: common keywords and
 * keyword gap (each expandable into a keyword list), plus whole-site estimated
 * traffic and backlinks from the stored DataForSEO analytics. */
export function CompetitorFootprintTable({ workspaceId, domainId, data, analytics, onShowRankings, onScopeChange }: Props) {
  const [open, setOpen] = React.useState<Open>(null)
  const site = React.useMemo(
    () => new Map((analytics?.rows ?? []).map((r) => [r.domain, r])), [analytics])
  const maxShared = data.competitors[0]?.keywords_shared || 1

  function toggle(domain: string, kind: "common" | "gap") {
    setOpen((o) => (o?.domain === domain && o.kind === kind ? null : { domain, kind }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base">Competitor footprint</CardTitle>
          {onScopeChange && data.curated_count > 0 && (
            <div className="flex rounded-lg border border-border p-0.5 text-xs">
              {([["curated", `Your competitors (${data.curated_count})`], ["serp", "All in Google results"]] as const).map(([id, label]) => (
                <button key={id} type="button" onClick={() => onScopeChange(id)}
                  className={cn("rounded-md px-2.5 py-1 font-medium transition-colors",
                    data.scope === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <CardDescription>
          {data.scope === "curated"
            ? <>Your competitor list (managed in <Link href="/dashboard/competitors" className="text-primary hover:underline">Tracked competitors</Link>) on </>
            : <>Every domain found in the Google results for </>}
          <strong>your {data.total_keywords} tracked keywords</strong>. <strong>Common</strong> = you both rank,{" "}
          <strong>Gap</strong> = they rank and you don&apos;t. Open either list for URLs, positions and difficulty.
          For keywords from the competitor&apos;s whole site, use &quot;Where competitors actually rank&quot; above.
          {data.scope === "serp" && data.curated_count === 0 && (
            <> Add your real competitors in <Link href="/dashboard/competitors" className="text-primary hover:underline">Tracked competitors</Link> to focus this list.</>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-full sm:min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5 font-medium sm:px-6">Competitor</th>
                <th className="hidden px-4 py-2.5 text-right font-medium min-[480px]:table-cell"><HeaderWithHelp help={COLUMN_HELP.keywordsShared}>Keywords shared</HeaderWithHelp></th>
                <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell"><HeaderWithHelp help={COLUMN_HELP.common}>Common · your kw</HeaderWithHelp></th>
                <th className="px-4 py-2.5 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.gap}>Gap · your kw</HeaderWithHelp></th>
                <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell"><HeaderWithHelp help={COLUMN_HELP.avgPosition}>Avg pos.</HeaderWithHelp></th>
                <th className="hidden px-4 py-2.5 text-right font-medium sm:table-cell"><HeaderWithHelp help={COLUMN_HELP.siteTraffic}>Est. traffic</HeaderWithHelp></th>
                <th className="hidden px-6 py-2.5 text-right font-medium sm:table-cell"><HeaderWithHelp help={COLUMN_HELP.backlinks}>Backlinks</HeaderWithHelp></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.competitors.map((c, i) => {
                const s = site.get(c.domain)
                const isOpen = open?.domain === c.domain
                return (
                  <React.Fragment key={c.domain}>
                    <tr className={cn("hover:bg-muted/40", isOpen && "bg-muted/30")}>
                      <td className="px-4 py-2.5 sm:px-6">
                        <span className="flex items-center gap-2">
                          {i === 0 && <Trophy className="size-3.5 shrink-0 text-amber-500" />}
                          <span className="truncate font-medium">{c.domain}</span>
                          {onShowRankings && (
                            <button type="button" onClick={() => onShowRankings(c.domain)}
                              className="rounded border border-border px-1.5 py-px text-xs text-muted-foreground hover:border-primary/40 hover:text-primary"
                              title="Keywords this domain actually ranks for">
                              Rankings
                            </button>
                          )}
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-right tabular-nums min-[480px]:table-cell">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                            <span className="block h-full rounded-full bg-primary"
                              style={{ width: `${Math.round((c.keywords_shared / maxShared) * 100)}%` }} />
                          </span>
                          {c.keywords_shared}
                        </span>
                      </td>
                      <td className="hidden px-4 py-2.5 text-right sm:table-cell">
                        <ViewAll count={c.common_keywords} active={isOpen && open?.kind === "common"}
                          onClick={() => toggle(c.domain, "common")} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <ViewAll count={c.gap_keywords} active={isOpen && open?.kind === "gap"}
                          onClick={() => toggle(c.domain, "gap")} />
                      </td>
                      <td className={cn("hidden px-4 py-2.5 text-right font-medium tabular-nums sm:table-cell", c.avg_position != null ? posColor(c.avg_position) : "text-muted-foreground")}
                        title={c.avg_position == null ? "Not seen in Google results for your tracked keywords yet" : undefined}>
                        {c.avg_position != null ? `#${c.avg_position}` : "—"}
                      </td>
                      <td className="hidden px-4 py-2.5 text-right tabular-nums sm:table-cell">{s ? compact(s.organic_traffic) : "—"}</td>
                      <td className="hidden px-6 py-2.5 text-right tabular-nums sm:table-cell">{s?.backlinks != null ? compact(s.backlinks) : "—"}</td>
                    </tr>
                    {isOpen && open && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <CompetitorKeywordsPanel workspaceId={workspaceId} domainId={domainId}
                            competitor={c.domain} kind={open.kind} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-6 py-2.5 text-xs text-muted-foreground">
          Keyword counts cover your tracked keywords (latest Google results and your search data). Est. traffic and
          backlinks are whole-site figures from the analytics below — refresh there to update them.
        </p>
      </CardContent>
    </Card>
  )
}
