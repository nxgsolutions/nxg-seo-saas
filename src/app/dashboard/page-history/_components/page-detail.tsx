"use client"

import { contentOptimizationHref } from "@/components/keywords/keyword-actions-menu"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { PageTimeline } from "@/lib/api/pages"
import { cn, timeAgo } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, ExternalLink, Gauge, Wand2 } from "lucide-react"
import Link from "next/link"
import type { PageHistoryScreen } from "../_hooks/use-page-history-screen"
import { fmtDate, hostPath } from "../_lib/page-history-helpers"
import { ChangeTimeline } from "./change-timeline"
import { SearchPerformanceCard } from "./search-performance-card"

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border bg-background/60 px-3 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
      {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

function Header({ data }: { data: PageTimeline }) {
  const { page, snapshots } = data
  const audits = snapshots.filter((s) => s.audit_score != null)
  const firstAudit = audits[audits.length - 1]?.audit_score ?? null
  const latest = page.latest_audit_score
  const sinceStart = latest != null && firstAudit != null && audits.length > 1 ? latest - firstAudit : null
  const changes = snapshots.reduce((n, s) => n + (s.changes.length ? 1 : 0), 0)
  const words = snapshots.find((s) => s.facts.word_count != null)?.facts.word_count

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5" aria-label="Page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold" title={page.title}>{page.title || hostPath(page.url)}</h2>
          <a href={page.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <span className="truncate">{hostPath(page.url)}</span> <ExternalLink className="size-3 shrink-0" />
          </a>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href={`/dashboard/page-audit?url=${encodeURIComponent(page.url)}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <Gauge className="size-4" /> Re-audit
          </Link>
          <Link href={contentOptimizationHref("", page.url)} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
            <Wand2 className="size-4" /> Optimize content
          </Link>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="Audit score" value={
          <span className="inline-flex items-center gap-1.5">
            {latest ?? "—"}
            {sinceStart ? (
              <span className={cn("inline-flex items-center text-xs font-medium", sinceStart > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                {sinceStart > 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(sinceStart)}
              </span>
            ) : null}
          </span>
        } sub={sinceStart != null ? `since first audit (${firstAudit})` : audits.length ? "1 audit" : "Not audited yet"} />
        <Stat label="Changes detected" value={changes} sub={`${page.snapshot_count} checks saved`} />
        <Stat label="Last changed" value={page.last_changed_at ? timeAgo(page.last_changed_at) : "—"}
          sub={`Last checked ${timeAgo(page.last_checked_at)}`} />
        <Stat label="Tracked since" value={fmtDate(page.first_seen_at)} sub={words != null ? `${words.toLocaleString()} words now` : undefined} />
      </div>
    </section>
  )
}

export function PageDetail({ screen }: { screen: PageHistoryScreen }) {
  const { timeline, timelineLoading, timelineError, performance, performanceLoading, days, setDays, selectedId } = screen
  if (!selectedId) return null
  if (timelineLoading) {
    return (
      <div className="space-y-4" role="status" aria-busy="true">
        <span className="sr-only">Loading page history…</span>
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }
  if (timelineError || !timeline) {
    return <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">This page could not be loaded.</p>
  }
  return (
    <div className="space-y-4">
      <Header data={timeline} />
      <SearchPerformanceCard performance={performance} loading={performanceLoading} snapshots={timeline.snapshots}
        days={days} setDays={setDays} />
      <ChangeTimeline snapshots={timeline.snapshots} impacts={performance?.impacts ?? []}
        windowDays={performance?.window_days ?? 28} />
    </div>
  )
}
