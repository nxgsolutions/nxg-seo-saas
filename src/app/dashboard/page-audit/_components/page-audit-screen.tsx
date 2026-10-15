"use client"

import { CoreWebVitals } from "@/components/dashboard/core-web-vitals"
import { GscSearchPerformance } from "@/components/dashboard/gsc-search-performance"
import { PageHeader } from "@/components/dashboard/page-header"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Gauge, Image as ImageIcon, ListChecks, Tags, Wrench, Zap } from "lucide-react"
import * as React from "react"
import { usePageAuditScreen } from "../_hooks/use-page-audit-screen"
import { AuditChecks } from "./audit-checks"
import { AuditForm } from "./audit-form"
import { AuditHero } from "./audit-hero"
import { AuditHistory } from "./audit-history"
import { AuditImages } from "./audit-images"
import { AuditMetadata } from "./audit-metadata"
import { PrioritizedFixes } from "./prioritized-fixes"

type Tab = "fixes" | "checks" | "tags" | "images" | "speed"

function ResultSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="flex gap-5 rounded-2xl border bg-card p-5">
        <Skeleton className="size-32 shrink-0 rounded-full" />
        <div className="flex-1 space-y-3 pt-3"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-6 w-64 rounded-full" /></div>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      <Skeleton className="h-10 w-96 max-w-full rounded-2xl" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

function EmptyState() {
  const items = [
    { icon: Wrench, title: "What to fix first", text: "Issues ranked by impact, each with the evidence and how to fix it." },
    { icon: ListChecks, title: "Full checklist", text: "Titles, headings, indexing, canonical, social tags, images and speed." },
    { icon: Gauge, title: "Tracked over time", text: "Every audit is dated in Page history — see what changed and its effect." },
  ]
  return (
    <section className="rounded-2xl border border-dashed bg-card/50 px-6 py-10">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Gauge className="size-6" /></div>
        <h2 className="mt-3 text-base font-semibold">Audit a page</h2>
        <p className="mt-1 text-sm text-muted-foreground">Pick one of your pages (or paste any URL) and click Run audit.</p>
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
  const { workspaceId, result, resultLoading, resultError, running, gscMatch } = screen
  const [tab, setTab] = React.useState<Tab>("fixes")
  // A new result opens on "Fix first" (adjust during render, no effect).
  const [seenId, setSeenId] = React.useState(result?.id)
  if (result?.id !== seenId) {
    setSeenId(result?.id)
    setTab("fixes")
  }

  const findings = result?.metrics.findings?.length ?? 0
  const notPassing = result?.checks.filter((c) => c.status !== "pass").length ?? 0

  return (
    <div className="space-y-6">
      <PageHeader title={<><Gauge className="size-5 text-primary" /> Page Audit</>}
        description="Check any page for technical SEO, tags, content, images and speed — with clear fixes. Every audit is saved to Page history." />

      <AuditForm screen={screen} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-4">
          {running ? <ResultSkeleton label="Auditing the page…" />
            : resultLoading ? <ResultSkeleton label="Loading audit…" />
            : resultError ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">This audit could not be loaded.</p>
            : result ? (
              <>
                <AuditHero result={result} />
                <SegmentedTabs<Tab> value={tab} onChange={setTab} label="Audit sections" items={[
                  { value: "fixes", label: "Fix first", icon: Wrench, count: findings },
                  { value: "checks", label: "All checks", icon: ListChecks, count: notPassing },
                  { value: "tags", label: "Tags & content", icon: Tags },
                  { value: "images", label: "Images", icon: ImageIcon, count: result.metrics.images_total ?? 0 },
                  { value: "speed", label: "Speed & search", icon: Zap },
                ]} />
                <div role="tabpanel" className="min-h-64 space-y-4">
                  {tab === "fixes" && <PrioritizedFixes result={result} />}
                  {tab === "checks" && <AuditChecks result={result} />}
                  {tab === "tags" && <AuditMetadata result={result} />}
                  {tab === "images" && (result.metrics.image_details
                    ? <AuditImages result={result} />
                    : <p className="text-sm text-muted-foreground">This audit didn&apos;t record image details — run it again.</p>)}
                  {tab === "speed" && (
                    <>
                      <CoreWebVitals url={result.url} strategy={result.metrics.device === "mobile" ? "mobile" : "desktop"} />
                      <GscSearchPerformance workspaceId={workspaceId} domainId={gscMatch.domainId} domain={gscMatch.host || null} pageUrl={result.url} />
                    </>
                  )}
                </div>
              </>
            ) : <EmptyState />}
        </div>
        <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <AuditHistory {...screen} />
        </aside>
      </div>
    </div>
  )
}
