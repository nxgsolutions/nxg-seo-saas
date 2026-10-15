"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { KeywordActionsMenu } from "@/components/keywords/keyword-actions-menu"
import { KeywordBreakdownSheet } from "@/components/keywords/keyword-breakdown-sheet"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { ColumnHelp, HeaderWithHelp } from "@/components/ui/column-help"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Pager } from "@/components/ui/pager"
import { SearchInput } from "@/components/ui/search-input"
import { Skeleton } from "@/components/ui/skeleton"
import type { MyKeywordsSort, SavedKeyword } from "@/lib/api/my-keywords"
import { COLUMN_HELP } from "@/lib/column-help"
import { cn, timeAgo } from "@/lib/utils"
import { ArrowDown, ArrowDownUp, ArrowUp, Bookmark, Download, Globe, KeyRound, Loader2, ScanSearch, Trash2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { useMyKeywordsScreen, type MyKeywordsScreen } from "../_hooks/use-my-keywords-screen"

const fmt = (v: number | null, digits = 0) => (v == null ? "—" : v.toLocaleString(undefined, { maximumFractionDigits: digits }))

function kdTone(kd: number | null): string {
  if (kd == null) return "text-muted-foreground"
  if (kd < 30) return "text-emerald-600 dark:text-emerald-400"
  if (kd < 60) return "text-amber-600 dark:text-amber-400"
  return "text-destructive"
}

/** Tracked Google rank with movement since the previous check, or a Track button. */
function RankCell({ row, screen }: { row: SavedKeyword; screen: MyKeywordsScreen }) {
  if (!row.rank_tracked) {
    const busy = screen.trackingId === row.id
    return (
      <Button variant="outline" size="xs" onClick={() => screen.trackRank(row)} disabled={busy}>
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ScanSearch className="size-3.5" />} Track
      </Button>
    )
  }
  if (row.position == null) {
    return <span className="text-xs text-muted-foreground" title={row.rank_date ? `Checked ${row.rank_date}` : "Waiting for the first check"}>
      {row.rank_date ? "Not in top 100" : "Waiting…"}
    </span>
  }
  const moved = row.previous_position != null ? row.previous_position - row.position : 0
  return (
    <span className="inline-flex items-center gap-1 font-semibold tabular-nums" title={row.rank_date ? `Checked ${row.rank_date}` : undefined}>
      #{row.position}
      {moved !== 0 && (
        <span className={cn("inline-flex items-center text-xs font-medium", moved > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
          {moved > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}{Math.abs(moved)}
        </span>
      )}
    </span>
  )
}

function SortHeader({ k, label, help, screen, align = "right" }: {
  k: MyKeywordsSort; label: string; help?: string; screen: MyKeywordsScreen; align?: "left" | "right"
}) {
  const active = screen.sort.key === k
  return (
    <th className={cn("p-2", align === "right" ? "text-right" : "text-left")} aria-sort={active ? (screen.sort.desc ? "descending" : "ascending") : "none"}>
      <span className="inline-flex items-center gap-1">
        <button type="button" className={cn("inline-flex cursor-pointer items-center gap-1 whitespace-nowrap", active && "text-foreground")}
          onClick={() => screen.setSort({ key: k, desc: active ? !screen.sort.desc : k !== "keyword" && k !== "rank" })}>
          {label}<ArrowDownUp className="size-3" />
        </button>
        {help && <ColumnHelp text={help} label={label} />}
      </span>
    </th>
  )
}

function EmptyState({ searching }: { searching: boolean }) {
  if (searching) return <p className="px-6 py-14 text-center text-sm text-muted-foreground">No saved keywords match your search.</p>
  return (
    <div className="mx-auto max-w-md px-6 py-14 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bookmark className="size-6" /></div>
      <p className="mt-3 text-sm font-semibold">No saved keywords yet</p>
      <p className="mt-1 text-sm text-muted-foreground">
        In any keyword table, open the <span className="font-medium text-foreground">+</span> menu next to a keyword and choose{" "}
        <span className="font-medium text-foreground">Save keyword</span>.
      </p>
      <Link href="/dashboard/keyword-analysis" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
        <KeyRound className="size-4" /> Find keywords
      </Link>
    </div>
  )
}

export default function MyKeywordsPage() {
  const s = useMyKeywordsScreen()
  const [breakdown, setBreakdown] = React.useState<SavedKeyword | null>(null)
  const total = s.pagination?.total ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title={<><Bookmark className="size-5 text-primary" /> Saved Keywords</>}
        description="A shortlist you save for this website — with current volume, cost per click, difficulty and your Google rank."
        help={<>
          <p><span className="font-medium text-foreground">Save keyword</span> adds a keyword to this shortlist, so you can collect and compare ideas in one place — with its volume, CPC, difficulty, intent and current Google rank.</p>
          <p className="mt-2">It does <span className="font-medium text-foreground">not</span> track position over time. To watch a keyword move on Google, use <span className="font-medium text-foreground">Track rank</span> (on the Rank Tracking page).</p>
        </>} />

      {s.noWebsite ? (
        <Alert><Globe className="size-4" /><AlertDescription>Add a website first — Saved Keywords are saved per website.</AlertDescription></Alert>
      ) : (
        <section className="rounded-2xl border bg-card shadow-xs" aria-label="Saved Keywords">
          <header className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
            <p className="mr-auto text-sm font-semibold">
              {s.activeDomain?.domain} <span className="font-normal text-muted-foreground">· {total.toLocaleString()} keyword{total === 1 ? "" : "s"}</span>
            </p>
            <SearchInput value={s.search} onValueChange={s.setSearch} placeholder="Search saved keywords…" className="w-full sm:w-64" />
            <Button variant="outline" size="sm" onClick={s.exportCsv} disabled={s.exporting || total === 0}>
              {s.exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export CSV
            </Button>
          </header>

          {s.error && <Alert variant="destructive" className="m-4"><AlertDescription>{s.error}</AlertDescription></Alert>}

          <div className="relative">
            <div aria-hidden="true" className={cn("absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden transition-opacity", s.fetching ? "opacity-100" : "opacity-0")}>
              <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-primary" />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead><tr className="border-b text-xs text-muted-foreground">
                  <SortHeader k="keyword" label="Keyword" screen={s} align="left" />
                  <SortHeader k="volume" label="Volume" help={COLUMN_HELP.volume} screen={s} />
                  <SortHeader k="cpc" label="CPC" help={COLUMN_HELP.cpc} screen={s} />
                  <SortHeader k="difficulty" label="Difficulty" help={COLUMN_HELP.estDifficulty} screen={s} />
                  <th className="p-2 text-left"><HeaderWithHelp help={COLUMN_HELP.intent}>Intent</HeaderWithHelp></th>
                  <SortHeader k="rank" label="Google rank" help="Your position in Google, from Rank Tracking. Click Track to start tracking it." screen={s} />
                  <SortHeader k="added" label="Saved" screen={s} />
                  <th className="w-12 p-2"><span className="sr-only">Remove</span></th>
                </tr></thead>
                <tbody className={cn("transition-opacity", s.fetching && "opacity-60")}>
                  {s.loading ? Array.from({ length: 8 }, (_, i) => (
                    <tr key={i} className="h-12 border-b last:border-0">
                      <td className="p-3"><div className="flex items-center gap-2"><Skeleton className="size-6" /><Skeleton className="h-4 w-48" /></div></td>
                      {[0, 1, 2].map((c) => <td key={c} className="p-2"><Skeleton className="ml-auto h-4 w-12" /></td>)}
                      <td className="p-2"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="p-2"><Skeleton className="ml-auto h-6 w-16" /></td>
                      <td className="p-2"><Skeleton className="ml-auto h-4 w-14" /></td>
                      <td className="p-2" />
                    </tr>
                  )) : s.rows.length === 0 ? (
                    <tr><td colSpan={8}><EmptyState searching={s.hasSearch} /></td></tr>
                  ) : s.rows.map((r) => (
                    <tr key={r.id} className="h-12 border-b last:border-0 hover:bg-muted/40">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <KeywordActionsMenu keyword={r.keyword} workspaceId={s.wid} domainId={s.did} country={r.country} language={r.language} />
                          <button type="button" onClick={() => setBreakdown(r)} title="Open keyword details"
                            className="cursor-pointer text-left font-medium text-primary underline-offset-4 hover:underline">{r.keyword}</button>
                        </div>
                      </td>
                      <td className="p-2 text-right tabular-nums">{fmt(r.search_volume)}</td>
                      <td className="p-2 text-right tabular-nums">{fmt(r.cpc, 2)}</td>
                      <td className={cn("p-2 text-right font-medium tabular-nums", kdTone(r.difficulty))}>{fmt(r.difficulty)}</td>
                      <td className="p-2">{r.intent
                        ? <span className="rounded-full border px-2 py-0.5 text-xs capitalize">{r.intent}</span>
                        : <span className="text-xs text-muted-foreground">—</span>}</td>
                      <td className="p-2 text-right"><RankCell row={r} screen={s} /></td>
                      <td className="p-2 text-right text-xs text-muted-foreground" title={new Date(r.created_at).toLocaleString()}>{timeAgo(r.created_at)}</td>
                      <td className="p-2 text-right">
                        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive"
                          onClick={() => s.setToRemove(r)} aria-label={`Remove ${r.keyword}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Pager className="border-t px-4 py-1.5" pagination={s.pagination} onPageChange={s.setPage} fetching={s.fetching} noun="keywords" />
        </section>
      )}

      <ConfirmDialog
        open={s.toRemove !== null}
        onOpenChange={(o) => { if (!o) s.setToRemove(null) }}
        title={<>Remove “{s.toRemove?.keyword}”?</>}
        description="It will be removed from Saved Keywords for this website."
        details={<p className="text-muted-foreground">Rank tracking and other saved data are not affected. You can save it again any time.</p>}
        confirmLabel={<><Trash2 className="size-4" /> Remove keyword</>}
        errorText="Could not remove the keyword. Please try again."
        onConfirm={s.confirmRemove}
      />

      {breakdown && s.wid && (
        <KeywordBreakdownSheet key={breakdown.id} keyword={breakdown.keyword} open tab="metrics"
          onOpenChange={(o) => { if (!o) setBreakdown(null) }}
          workspaceId={s.wid} domainId={s.did} country={breakdown.country} language={breakdown.language}
          options={<KeywordActionsMenu keyword={breakdown.keyword} workspaceId={s.wid} domainId={s.did}
            country={breakdown.country} language={breakdown.language} label="Options" inBreakdown />} />
      )}
    </div>
  )
}
