"use client"

import { contentOptimizationHref } from "@/components/keywords/keyword-actions-menu"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useOpportunityPages } from "@/hooks/api/use-opportunity"
import { cn } from "@/lib/utils"
import { ChevronDown, Wand2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { FEATURE_ICON, titleCase } from "../_lib/opportunity-research-helpers"

/** The page's highest-volume keyword. */
function topKeyword(keywords: { keyword: string; search_volume: number }[]): string {
  return keywords.reduce((a, b) => (b.search_volume > a.search_volume ? b : a)).keyword
}

export function PagesSection({ wid, did }: { wid: string; did: string }) {
  const query = useOpportunityPages(wid, did)
  const rows = query.data?.rows ?? []
  // undefined = not toggled yet → the first page starts expanded.
  const [toggled, setOpen] = React.useState<string | null | undefined>(undefined)
  const open = toggled === undefined ? rows[0]?.id ?? null : toggled

  if (query.isPending) {
    return (
      <div className="space-y-3" role="status" aria-busy="true">
        <span className="sr-only">Loading pages…</span>
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {rows.map((p) => {
        const expanded = open === p.id
        return (
          <Card key={p.id}>
            <button type="button" onClick={() => setOpen(expanded ? null : p.id)} className="w-full text-left">
              <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
                <div className="min-w-0">
                  <CardTitle className="truncate text-sm">{p.title || p.url}</CardTitle>
                  <CardDescription className="truncate">{p.url.replace(/^https?:\/\//, "")}</CardDescription>
                </div>
                <div className="flex shrink-0 items-center gap-4 text-xs text-muted-foreground">
                  <span><span className="font-semibold text-foreground">{p.keyword_count}</span> keywords</span>
                  <span><span className="font-semibold text-foreground">{p.total_volume.toLocaleString()}</span> vol</span>
                  <span>avg #{p.avg_position ?? "—"}</span>
                  <ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
                </div>
              </CardHeader>
            </button>
            {expanded ? (
              <CardContent className="p-0">
                {/* Optimize this page for its biggest keyword (Content Optimization, prefilled). */}
                {p.keywords[0] && (
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5">
                    <span className="text-xs text-muted-foreground">
                      Biggest keyword: <span className="font-medium text-foreground">{topKeyword(p.keywords)}</span>
                    </span>
                    <Link href={contentOptimizationHref(topKeyword(p.keywords), p.url)}
                      className={cn(buttonVariants({ variant: "outline", size: "xs" }), "gap-1.5")}>
                      <Wand2 className="size-3.5" /> Optimize this page
                    </Link>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-y border-border bg-muted/40 text-xs text-muted-foreground">
                        <th className="px-3 py-2 text-left font-medium">Keyword</th>
                        <th className="px-3 py-2 text-right font-medium">Volume</th>
                        <th className="px-3 py-2 text-right font-medium">Position</th>
                        <th className="px-3 py-2 text-left font-medium">Intent</th>
                        <th className="px-3 py-2 text-right font-medium">Opportunity</th>
                        <th className="px-3 py-2 text-left font-medium">SERP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {p.keywords.map((k) => (
                        <tr key={k.keyword} className="hover:bg-muted/30">
                          <td className="px-3 py-2 font-medium">{k.keyword}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{k.search_volume.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{k.current_position ?? "—"}</td>
                          <td className="px-3 py-2"><Badge variant="outline" className="text-xs">{titleCase(k.intent)}</Badge></td>
                          <td className="px-3 py-2 text-right font-semibold tabular-nums">{k.opportunity_score}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              {k.serp_features.map((f) => {
                                const Icon = FEATURE_ICON[f]
                                return Icon ? <Icon key={f} className="size-3.5" /> : null
                              })}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            ) : null}
          </Card>
        )
      })}
    </div>
  )
}
