"use client"

import { PageSearchChart } from "@/components/charts/lazy"
import type { PageSearchMetric } from "@/components/charts/page-search-chart"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import type { PagePerformance, PageSnapshot } from "@/lib/api/pages"
import { BarChart3, Info, MousePointerClick, Plug, Target } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { isoDay } from "../_lib/page-history-helpers"

const STATUS_TEXT: Record<Exclude<PagePerformance["status"], "ok">, { text: string; link?: boolean }> = {
  not_connected: { text: "Connect Google Search Console to see clicks and rankings for this page — and how they moved after each change.", link: true },
  no_property: { text: "Search Console has no verified property for this website. Add and verify it in Search Console.", link: true },
  no_website: { text: "This page isn't on one of your websites, so there's no Search Console data for it." },
  error: { text: "Search Console couldn't be reached right now (the connection may need to be renewed). Showing the last saved numbers." , link: true },
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background/60 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-base font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/** Daily clicks / impressions / position for the page with change markers. */
export function SearchPerformanceCard({ performance, loading, snapshots, days, setDays }: {
  performance: PagePerformance | null
  loading: boolean
  snapshots: PageSnapshot[]
  days: number
  setDays: (d: number) => void
}) {
  const [metric, setMetric] = React.useState<PageSearchMetric>("clicks")
  const changeDays = snapshots.filter((s) => s.changes.length > 0).map((s) => isoDay(s.captured_at))
  const series = performance?.series ?? []
  const clicks = series.reduce((a, d) => a + d.clicks, 0)
  const impressions = series.reduce((a, d) => a + d.impressions, 0)
  const weighted = series.filter((d) => d.position != null && d.impressions)
  const pos = weighted.length ? weighted.reduce((a, d) => a + d.position! * d.impressions, 0) / weighted.reduce((a, d) => a + d.impressions, 0) : null

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5" aria-label="Search results over time">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="size-4 text-primary" /> Google search results</h3>
          <p className="text-xs text-muted-foreground">From Search Console · dashed lines = days the page changed</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentedTabs<PageSearchMetric> value={metric} onChange={setMetric} label="Metric" items={[
            { value: "clicks", label: "Clicks", icon: MousePointerClick },
            { value: "impressions", label: "Impressions" },
            { value: "position", label: "Position", icon: Target },
          ]} />
          <SegmentedTabs<string> value={String(days)} onChange={(v) => setDays(Number(v))} label="Period" items={[
            { value: "90", label: "3M" }, { value: "180", label: "6M" }, { value: "365", label: "12M" },
          ]} />
        </div>
      </header>

      {loading ? (
        <div className="mt-4 space-y-3" role="status" aria-busy="true">
          <span className="sr-only">Loading search data…</span>
          <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}</div>
          <Skeleton className="h-60 rounded-xl" />
        </div>
      ) : (
        <>
          {performance && performance.status !== "ok" && (
            <div className="mt-4 flex items-start gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              {STATUS_TEXT[performance.status].link ? <Plug className="mt-0.5 size-3.5 shrink-0" /> : <Info className="mt-0.5 size-3.5 shrink-0" />}
              <span>
                {STATUS_TEXT[performance.status].text}
                {STATUS_TEXT[performance.status].link && <> <Link href="/dashboard/settings" className="font-medium text-primary hover:underline">Open Integrations</Link></>}
              </span>
            </div>
          )}
          {series.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Total label="Clicks" value={clicks.toLocaleString()} />
              <Total label="Impressions" value={impressions.toLocaleString()} />
              <Total label="Avg. position" value={pos ? pos.toFixed(1) : "—"} />
            </div>
          )}
          <div className="mt-3">
            {series.length > 0 || performance?.status === "ok"
              ? <PageSearchChart data={series} metric={metric} changeDays={changeDays} />
              : null}
          </div>
        </>
      )}
    </section>
  )
}
