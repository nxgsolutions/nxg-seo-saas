"use client"

import { Card, CardContent } from "@/components/ui/card"
import { errorMessage } from "@/lib/api/client"
import type { ResearchSummary } from "@/lib/api/keyword-search"
import { cn, timeAgo } from "@/lib/utils"
import type { UseQueryResult } from "@tanstack/react-query"
import { Globe, Search } from "lucide-react"
import { RecentSearchesSkeleton } from "./keyword-skeletons"

interface Props {
  query: UseQueryResult<ResearchSummary[]>
  /** The search currently open above (highlighted). */
  activeId: string | null
  onOpen: (item: ResearchSummary) => void
}

/** Recent keyword searches. Opening one loads the stored results — no provider
 * call; run the search again to fetch new data. */
export function RecentSearches({ query, activeId, onOpen }: Props) {
  if (query.isPending) return <RecentSearchesSkeleton />
  if (query.isError) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          {errorMessage(query.error, "Could not load recent searches.")}{" "}
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => void query.refetch()}>Try again</button>
        </CardContent>
      </Card>
    )
  }
  const items = query.data
  if (items.length === 0) return null

  return (
    <Card>
      <CardContent className="space-y-1 pt-6">
        <p className="mb-1 text-sm font-semibold">Recent searches</p>
        {items.map((h) => {
          const isDomain = h.kind === "domain"
          const Icon = isDomain ? Globe : Search
          const active = h.id === activeId
          return (
            <button key={h.id} onClick={() => onOpen(h)} aria-current={active || undefined}
              className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-muted/40",
                active && "bg-primary/10 hover:bg-primary/10")}>
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1 truncate font-medium">{isDomain ? h.target ?? h.seed_keyword : h.seed_keyword}</span>
              <span className={cn("shrink-0 rounded px-1.5 py-px text-xs font-semibold uppercase tracking-wide",
                isDomain ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                {isDomain ? "Domain" : "Keyword"}
              </span>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {h.result_count > 0 ? `${h.result_count} kw` : ""}
              </span>
              <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                {h.country_code.toUpperCase()} · {timeAgo(h.created_at)}
              </span>
            </button>
          )
        })}
      </CardContent>
    </Card>
  )
}
