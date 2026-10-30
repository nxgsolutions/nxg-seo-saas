"use client"

import { CoreWebVitals } from "@/components/dashboard/core-web-vitals"
import { GscSearchPerformance } from "@/components/dashboard/gsc-search-performance"
import { PageHeader } from "@/components/dashboard/page-header"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Gauge, LayoutGrid, ListChecks, Zap } from "lucide-react"
import * as React from "react"
import { usePageScoreScreen } from "../_hooks/use-page-score-screen"
import { CategoryBreakdown } from "./category-breakdown"
import { ScoreForm } from "./score-form"
import { ScoreHero } from "./score-hero"

type Tab = "breakdown" | "performance"

function ResultSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="flex gap-5 rounded-2xl border bg-card p-5">
        <Skeleton className="size-32 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3 pt-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-64 rounded-full" /></div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
    </div>
  )
}

function EmptyState() {
  const items = [
    { icon: Gauge, title: "One number, 0–100", text: "A weighted blend of technical, on-page, content, performance, links and structured data." },
    { icon: LayoutGrid, title: "Category breakdown", text: "See each category's sub-score and open it for the exact checks and fixes." },
    { icon: ListChecks, title: "Tracked over time", text: "Every score is dated in Page history, so you can see what a change did." },
  ]
  return (
    <section className="rounded-2xl border border-dashed bg-card/50 px-6 py-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Gauge className="size-6" /></div>
        <h2 className="mt-3 text-base font-semibold">Score a page</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick one of your pages (or paste any URL), add a target keyword if you have one, and click Get score.</p>
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

export default function PageScorePage() {
  const screen = usePageScoreScreen()
  const { workspaceId, result, running, gscMatch } = screen
  const [tab, setTab] = React.useState<Tab>("breakdown")

  const toFix = result ? result.categories.reduce(
    (n, c) => n + c.checks.filter((x) => x.status !== "pass").length, 0) : 0

  return (
    <div className="space-y-6">
      <PageHeader title={<><Gauge className="size-5 text-primary" /> Overall Page Score</>}
        description="One weighted 0–100 for a page, built from technical, on-page, content, performance, links and structured-data checks. Real search data is shown alongside, never mixed into the score." />

      <ScoreForm screen={screen} />

      {running ? <ResultSkeleton label="Scoring the page…" />
        : result ? (
          <div className="space-y-4">
            <ScoreHero result={result} />
            <SegmentedTabs<Tab> value={tab} onChange={setTab} label="Score sections" items={[
              { value: "breakdown", label: "Breakdown", icon: LayoutGrid, count: toFix },
              { value: "performance", label: "Performance & search", icon: Zap },
            ]} />
            <div role="tabpanel" className="min-h-64 space-y-4">
              {tab === "breakdown" && <CategoryBreakdown categories={result.categories} />}
              {tab === "performance" && (
                <>
                  <CoreWebVitals url={result.url} strategy={result.metrics.device === "mobile" ? "mobile" : "desktop"} initial={result.metrics.core_web_vitals ?? null} />
                  <GscSearchPerformance workspaceId={workspaceId} domainId={gscMatch.domainId} domain={gscMatch.host || null} pageUrl={result.url} />
                </>
              )}
            </div>
          </div>
        ) : <EmptyState />}
    </div>
  )
}
