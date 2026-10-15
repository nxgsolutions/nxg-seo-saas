"use client"

import { Pager } from "@/components/ui/pager"
import { SearchInput } from "@/components/ui/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, timeAgo } from "@/lib/utils"
import { History } from "lucide-react"
import type { ContentOptimizationScreen } from "../_hooks/use-content-optimization-screen"
import { hostOf, scoreBg } from "../_lib/content-optimization-helpers"

/** Saved runs (server-paged, searchable). Rows keep their height while the next page loads. */
export function SessionHistory({ screen }: { screen: ContentOptimizationScreen }) {
  const { history, selectedId, select } = screen
  return (
    <section className="rounded-2xl border bg-card shadow-xs" aria-label="Recent runs">
      <header className="space-y-2.5 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><History className="size-4 text-primary" /> Recent runs</h2>
        <SearchInput value={history.q} onValueChange={history.setQ} placeholder="Search page or keyword…" />
      </header>

      {history.loading ? (
        <ul className="divide-y" role="status" aria-busy="true" aria-label="Loading runs">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </li>
          ))}
        </ul>
      ) : history.rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {history.q ? "No runs match your search." : "No runs yet. Analyze a page to start."}
        </p>
      ) : (
        <ul className={cn("divide-y transition-opacity", history.fetching && "opacity-60")}>
          {history.rows.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => select(s.id)} aria-current={selectedId === s.id || undefined}
                className={cn("flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                  selectedId === s.id && "bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]")}>
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums", scoreBg(s.content_score))}>
                  {s.content_score ?? "—"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{s.title || hostOf(s.url)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {s.keyword ? `“${s.keyword}” · ` : ""}{timeAgo(s.created_at)}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <Pager className="border-t px-4 py-1.5" pagination={history.pagination} onPageChange={history.setPage}
        fetching={history.fetching} noun="runs" />
    </section>
  )
}
