"use client"

import { Pager } from "@/components/ui/pager"
import { SearchInput } from "@/components/ui/search-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, timeAgo } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, FileClock } from "lucide-react"
import type { PageHistoryScreen, PageScope, PageSort } from "../_hooks/use-page-history-screen"
import { hostPath } from "../_lib/page-history-helpers"

const SORTS: { value: PageSort; label: string }[] = [
  { value: "checked", label: "Last checked" },
  { value: "changed", label: "Last changed" },
  { value: "score", label: "Audit score" },
  { value: "url", label: "URL (A–Z)" },
]

function scoreChip(score: number | null): string {
  if (score == null) return "bg-muted text-muted-foreground"
  if (score >= 80) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
  if (score >= 50) return "bg-amber-500/12 text-amber-700 dark:text-amber-400"
  return "bg-destructive/10 text-destructive"
}

/** Tracked pages (server-paged). Rows keep their height while the next page loads. */
export function PageList({ screen }: { screen: PageHistoryScreen }) {
  const { filters, list, selectedId, select, activeDomain } = screen
  const scopes: { value: PageScope; label: string }[] = [
    { value: "site", label: activeDomain ? activeDomain.domain : "This website" },
    { value: "other", label: "Other sites" },
    { value: "all", label: "All pages" },
  ]
  return (
    <section className="rounded-2xl border bg-card shadow-xs" aria-label="Tracked pages">
      <header className="space-y-2.5 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><FileClock className="size-4 text-primary" /> Tracked pages</h2>
        <SearchInput value={filters.search} onValueChange={filters.setSearch} placeholder="Search URL or title…" />
        <div className="grid grid-cols-2 gap-2">
          <Select value={filters.scope} onValueChange={(v) => filters.setScope((v as PageScope) ?? "site")}>
            <SelectTrigger className="h-9 w-full" aria-label="Which pages"><SelectValue>{(v) => scopes.find((s) => s.value === v)?.label}</SelectValue></SelectTrigger>
            <SelectContent>{scopes.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={filters.sort} onValueChange={(v) => filters.setSort((v as PageSort) ?? "checked")}>
            <SelectTrigger className="h-9 w-full" aria-label="Sort"><SelectValue>{(v) => SORTS.find((s) => s.value === v)?.label}</SelectValue></SelectTrigger>
            <SelectContent>{SORTS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </header>

      {list.loading ? (
        <ul className="divide-y" role="status" aria-busy="true" aria-label="Loading pages">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </li>
          ))}
        </ul>
      ) : list.rows.length === 0 ? (
        <div className="px-4 py-10 text-center text-sm text-muted-foreground">
          {filters.search ? "No pages match your search." : "No pages yet. Run a Page Audit, Content Optimization or load a page in Title & Meta — every check is saved here."}
        </div>
      ) : (
        <ul className={cn("divide-y transition-opacity", list.fetching && "opacity-60")}>
          {list.rows.map((p) => {
            const active = p.id === selectedId
            return (
              <li key={p.id}>
                <button type="button" onClick={() => select(p.id)} aria-current={active || undefined}
                  className={cn("flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                    active && "bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]")}>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums", scoreChip(p.latest_audit_score))}
                    title={p.latest_audit_score != null ? "Latest audit score" : "Not audited yet"}>
                    {p.latest_audit_score ?? "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.title || hostPath(p.url)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{hostPath(p.url)}</span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{p.snapshot_count} check{p.snapshot_count === 1 ? "" : "s"}</span>
                      {p.last_changed_at && <span className="rounded bg-primary/10 px-1 font-medium text-primary">changed {timeAgo(p.last_changed_at)}</span>}
                    </span>
                  </span>
                  {p.score_delta ? (
                    <span className={cn("inline-flex shrink-0 items-center text-xs font-medium tabular-nums",
                      p.score_delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                      {p.score_delta > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {Math.abs(p.score_delta)}
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      <Pager className="border-t px-4 py-1.5" pagination={list.pagination} onPageChange={list.setPage}
        fetching={list.fetching} noun="pages" />
    </section>
  )
}
