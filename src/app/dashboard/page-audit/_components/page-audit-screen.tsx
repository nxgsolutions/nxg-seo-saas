"use client"

import { SiteScoreOverview } from "@/app/dashboard/site-score/_components/site-score-screen"
import { CategoryBreakdown } from "@/app/dashboard/page-score/_components/category-breakdown"
import { ChangeList } from "@/components/dashboard/page-changes"
import { CoreWebVitals } from "@/components/dashboard/core-web-vitals"
import { GscSearchPerformance } from "@/components/dashboard/gsc-search-performance"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import type { AuditSummary } from "@/lib/api/audits"
import { cn, timeAgo } from "@/lib/utils"
import {
  AlertTriangle, Gauge, History, Image as ImageIcon, LayoutGrid, ListChecks, Tags, Wrench, Zap,
} from "lucide-react"
import * as React from "react"
import { usePageAuditScreen } from "../_hooks/use-page-audit-screen"
import { hostOf, scoreColor } from "../_lib/page-audit-helpers"
import { AuditChecks } from "./audit-checks"
import { AuditForm } from "./audit-form"
import { AuditHero } from "./audit-hero"
import { AuditImages } from "./audit-images"
import { AuditMetadata } from "./audit-metadata"
import { PrioritizedFixes } from "./prioritized-fixes"

type Tab = "overview" | "fixes" | "full" | "speed" | "history"

function ResultSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="flex gap-5 rounded-2xl border bg-card p-5">
        <Skeleton className="size-32 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3 pt-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-64 rounded-full" /></div>
      </div>
      <Skeleton className="h-10 w-96 max-w-full rounded-2xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

/** A labelled section inside the "Full audit" tab. */
function Section({ icon: Icon, title, children }: {
  icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="size-4 text-primary" /> {title}
      </h3>
      {children}
    </section>
  )
}

/** The workspace's recent audits — click one to open its full detail above. */
function AuditedPages({ history, activeId, onOpen }: {
  history: AuditSummary[]; activeId: string | null; onOpen: (id: string) => void
}) {
  if (history.length === 0) return null
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="mb-3 text-sm font-semibold">Audited pages <span className="text-muted-foreground">({history.length})</span></h3>
        <ul className="divide-y rounded-xl border">
          {history.map((a) => {
            const s = a.overall ?? a.score
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onOpen(a.id)}
                  aria-current={a.id === activeId ? "true" : undefined}
                  className={cn("flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                    a.id === activeId && "bg-muted/60")}
                >
                  <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold tabular-nums", scoreColor(s))}>{s}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{hostOf(a.url)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.url.replace(/^https?:\/\//, "")}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  const items = [
    { icon: Wrench, title: "What to fix first", text: "Issues ranked by impact, each with the evidence and how to fix it." },
    { icon: ListChecks, title: "Full checklist", text: "Titles, headings, indexing, canonical, social tags, images and speed." },
    { icon: Gauge, title: "One genuine score", text: "A content-led 0–100 with the category breakdown — the same number everywhere." },
  ]
  return (
    <section className="rounded-2xl border border-dashed bg-card/50 px-6 py-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Gauge className="size-6" /></div>
        <h2 className="mt-3 text-base font-semibold">Audit a page</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick one of your pages (or paste any URL) above and click Run audit.</p>
      </div>
      <div className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-xl border bg-card p-4">
            <Icon className="size-5 text-primary" />
            <p className="mt-2 text-sm font-medium">{title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function PageAuditPage() {
  const screen = usePageAuditScreen()
  const { workspaceId, result, resultLoading, resultError, running, gscMatch, history, openHistory } = screen
  const [tab, setTab] = React.useState<Tab>("overview")
  // A new result opens on "Overview" (adjust during render, no effect).
  const [seenId, setSeenId] = React.useState(result?.id)
  if (result?.id !== seenId) {
    setSeenId(result?.id)
    setTab("overview")
  }

  const findings = result?.metrics.findings?.length ?? 0
  const notPassing = result?.checks.filter((c) => c.status !== "pass").length ?? 0
  const changes = result?.changes ?? []

  return (
    <div className="space-y-6">
      <PageHeader title={<><Gauge className="size-5 text-primary" /> Page Audit</>}
        description="Your whole-site score, and a per-page audit — score, fixes, speed and history — all in one place." />

      {/* Whole-site overview */}
      <Card><CardContent className="pt-6"><SiteScoreOverview /></CardContent></Card>

      {/* Pick a page (or paste any URL) and run an audit */}
      <AuditForm screen={screen} />

      {/* Per-page detail */}
      {running ? <ResultSkeleton label="Auditing the page…" />
        : resultLoading ? <ResultSkeleton label="Loading audit…" />
        : resultError ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">This audit could not be loaded.</p>
        : result ? (
          <div className="space-y-4">
            <AuditHero result={result} />
            {result.blockers && result.blockers.length > 0 && (
              <div role="alert" className="flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium">Why this score is capped</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
                    {result.blockers.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              </div>
            )}
            <SegmentedTabs<Tab> value={tab} onChange={setTab} label="Audit sections" items={[
              { value: "overview", label: "Overview", icon: LayoutGrid },
              { value: "fixes", label: "Fix first", icon: Wrench, count: findings },
              { value: "full", label: "Full audit", icon: ListChecks, count: notPassing },
              { value: "speed", label: "Speed & search", icon: Zap },
              { value: "history", label: "History", icon: History, count: changes.length },
            ]} />
            <div role="tabpanel" className="min-h-64 space-y-4">
              {tab === "overview" && (
                result.categories && result.categories.length > 0
                  ? <CategoryBreakdown categories={result.categories} />
                  : <p className="text-sm text-muted-foreground">No category breakdown for this audit — re-run it to compute one.</p>
              )}
              {tab === "fixes" && <PrioritizedFixes result={result} />}
              {tab === "full" && (
                <div className="space-y-8">
                  <Section icon={ListChecks} title="All checks"><AuditChecks result={result} /></Section>
                  <Section icon={Tags} title="Tags & content"><AuditMetadata result={result} /></Section>
                  <Section icon={ImageIcon} title="Images">
                    {result.metrics.image_details
                      ? <AuditImages result={result} />
                      : <p className="text-sm text-muted-foreground">This audit didn&apos;t record image details — run it again.</p>}
                  </Section>
                </div>
              )}
              {tab === "speed" && (
                <>
                  <CoreWebVitals url={result.url} strategy={result.metrics.device === "mobile" ? "mobile" : "desktop"} initial={result.metrics.core_web_vitals ?? null} />
                  <GscSearchPerformance workspaceId={workspaceId} domainId={gscMatch.domainId} domain={gscMatch.host || null} pageUrl={result.url} />
                </>
              )}
              {tab === "history" && (
                changes.length > 0
                  ? <Card><CardContent className="pt-6">
                      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><History className="size-4 text-primary" /> Changed since the last check</h3>
                      <ChangeList changes={changes} />
                    </CardContent></Card>
                  : <p className="text-sm text-muted-foreground">No changes recorded yet. Re-audit this page over time to track what changed and how the score moved.</p>
              )}
            </div>
          </div>
        ) : <EmptyState />}

      {/* Already-audited pages */}
      <AuditedPages history={history} activeId={result?.id ?? null} onOpen={openHistory} />
    </div>
  )
}
