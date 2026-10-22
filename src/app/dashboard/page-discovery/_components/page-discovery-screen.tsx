"use client"

import { PageTypeDonut } from "@/components/charts/lazy"
import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { StatCard } from "@/components/dashboard/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  AlertTriangle, Ban, CheckCircle2, FileText, ListChecks, Loader2, Map as MapIcon,
  RefreshCw, Search, ShieldCheck, Sparkles, Square,
} from "lucide-react"
import type { ReactNode } from "react"
import { usePageDiscoveryScreen } from "../_hooks/use-page-discovery-screen"
import { TYPE_ORDER, typeMeta } from "../_lib/page-discovery-helpers"
import { DiscoveryTable } from "./discovery-table"

type Screen = ReturnType<typeof usePageDiscoveryScreen>

/** Brief "what this page does" shown in the title help popover. */
const pageDiscoveryHelp = (
  <>
    <p><span className="font-medium text-foreground">Page Discovery</span> finds every page on your website — from your sitemap, or by crawling if there isn&apos;t one.</p>
    <p className="mt-2">It shows which pages Google can <span className="font-medium text-foreground">index</span> (and which are noindex), groups them by type, and lets you send any page straight to a full audit.</p>
  </>
)

export default function PageDiscoveryScreen() {
  const s = usePageDiscoveryScreen()

  if (!s.domain) {
    return (
      <div className="space-y-6">
        <PageHeader title={<><Search className="size-5 text-primary" /> Page Discovery</>}
          description="Find and analyze all the pages on your website." help={pageDiscoveryHelp} />
        <NoDomain what="page discovery" />
      </div>
    )
  }

  const scanned = s.status && s.status.status !== "running"
  const hasPages = (s.summary?.total ?? 0) > 0
  const lastScan = scanned && s.status?.finished_at ? relTime(s.status.finished_at) : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Content"
        title={<><Search className="size-5 text-primary" /> Page Discovery</>}
        description="See every page on your website, check which ones Google can index, and pick pages to improve."
        help={pageDiscoveryHelp}
      />

      {/* Scan control + status */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium">{hasPages ? "Your pages" : "Scan your site"}</p>
              <p className="text-xs text-muted-foreground">
                {lastScan
                  ? `Last scanned ${lastScan}`
                  : "We read your sitemap first, then crawl the site if there isn’t one."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {s.isRunning && (
                <Button variant="outline" onClick={() => s.cancel.mutate()} disabled={s.cancel.isPending}>
                  {s.cancel.isPending ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-4" />}
                  Stop
                </Button>
              )}
              <Button onClick={() => s.discover.mutate(false)} disabled={s.isRunning || s.discover.isPending}>
                {s.isRunning || s.discover.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                {s.isRunning ? "Scanning…" : hasPages ? "Re-scan site" : "Discover pages"}
              </Button>
            </div>
          </div>
          <StatusArea screen={s} />
        </CardContent>
      </Card>

      {/* Results: KPIs + table (main) + breakdown (sidebar) */}
      {(hasPages || (s.isRunning && !s.status?.pages_found) || s.summaryLoading) && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard icon={FileText} label="Total pages found"
              value={(s.summary?.total ?? 0).toLocaleString()} delta={s.summary?.delta_pct ?? null} />
            <StatCard icon={ShieldCheck} label="Indexable pages"
              value={(s.summary?.indexable ?? 0).toLocaleString()} hint={pct(s.summary?.indexable, s.summary?.total)} />
            <StatCard icon={Ban} label="Noindex pages"
              value={(s.summary?.noindex ?? 0).toLocaleString()} hint={pct(s.summary?.noindex, s.summary?.total)} />
          </div>

          <div className="space-y-5">
            <DiscoveryTable wid={s.wid!} did={s.did!}
              running={s.isRunning} total={s.summary?.total ?? 0} />

            <ChartCard title="Pages by type" subtitle="How your discovered pages break down by template.">
              {s.summary && hasPages ? <Breakdown summary={s.summary} /> : <Skeleton className="h-56" />}
            </ChartCard>

            <div className="grid gap-5 lg:grid-cols-2">
              <ChartCard title="Indexability" subtitle="Which pages Google is allowed to index.">
                {s.summary && hasPages ? <IndexabilityChart summary={s.summary} /> : <Skeleton className="h-56" />}
              </ChartCard>
              <ChartCard title="Page health" subtitle="HTTP response for each discovered page.">
                {s.summary && hasPages ? <StatusChart summary={s.summary} /> : <Skeleton className="h-56" />}
              </ChartCard>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <ChartCard title="Content freshness" subtitle="When pages were last updated (from your sitemap).">
                {s.summary && hasPages ? <FreshnessChart summary={s.summary} /> : <Skeleton className="h-40" />}
              </ChartCard>
              <ChartCard title="How pages were found" subtitle="Discovered from your sitemap or by crawling.">
                {s.summary && hasPages ? <SourceChart summary={s.summary} /> : <Skeleton className="h-40" />}
              </ChartCard>
            </div>
          </div>
        </>
      )}

      {scanned && !hasPages && s.status?.source !== "no_sitemap" && !s.summaryLoading && (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          No pages discovered yet. Click <span className="font-medium text-foreground">Discover pages</span> to scan your site.
        </CardContent></Card>
      )}

    </div>
  )
}

function pct(part: number | undefined, total: number | undefined): string | undefined {
  if (!total || part == null) return undefined
  return `${Math.round((part / total) * 100)}% of pages`
}

/** "just now" / "5 min ago" / "3 hours ago" / "12 Aug". */
function relTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const mins = Math.round((Date.now() - then) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" })
}

// ── Status area (first-run intro / live progress / result) ───────────────────

const WHAT_YOU_GET = [
  { icon: Search, text: "Find every page from your sitemap (or by crawling your site)" },
  { icon: ShieldCheck, text: "See which pages Google can index, and which are set to noindex" },
  { icon: ListChecks, text: "Group pages by type — blog posts, content, categories and more" },
  { icon: MapIcon, text: "Jump straight from any page into a full Page Audit" },
]

function StatusArea({ screen: s }: { screen: Screen }) {
  // 1. In progress — live count + bar.
  if (s.isRunning) {
    const found = s.status?.pages_found ?? 0
    const done = s.status?.pages_enriched ?? 0
    const ratio = found ? Math.min(1, done / found) : 0
    return (
      <Banner tone="info" icon={<Loader2 className="size-5 animate-spin" />} title="Scanning your site…"
        text={found ? `Checked ${done.toLocaleString()} of ${found.toLocaleString()} pages.` : "Finding your pages…"}>
        {found > 0 && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
            <div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${Math.max(3, ratio * 100)}%` }} />
          </div>
        )}
      </Banner>
    )
  }
  // 2. Never scanned — what you'll get + a clear nudge.
  if (!s.status) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4">
        <p className="flex items-center gap-1.5 text-sm font-medium"><Sparkles className="size-4 text-primary" /> What you get</p>
        <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
          {WHAT_YOU_GET.map((f) => (
            <li key={f.text} className="flex items-start gap-2 text-sm text-muted-foreground">
              <f.icon className="mt-0.5 size-4 shrink-0 text-primary" />{f.text}
            </li>
          ))}
        </ul>
      </div>
    )
  }
  // 3. Results.
  if (s.status.status === "cancelled") {
    return <Banner tone="info" icon={<Square className="size-5" />} title="Scan stopped"
      text={`You stopped the scan.${s.status.pages_found ? ` We kept the ${s.status.pages_found.toLocaleString()} pages found so far.` : ""} Run it again whenever you're ready.`} />
  }
  if (s.status.status === "failed") {
    return <Banner tone="warn" icon={<AlertTriangle className="size-5" />} title="Scan failed" text="We couldn't scan this site. Check the domain is reachable and try again." />
  }
  // No sitemap — warn, recommend adding one, and ask before crawling (slower,
  // heavier on the site), instead of crawling automatically.
  if (s.status.source === "no_sitemap") {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-4">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-4 shrink-0" /> No sitemap found for {s.domain?.domain ?? "your site"}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A sitemap is the fastest way for Google — and us — to find all your pages.
          Most website builders and SEO plugins add one automatically at{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">/sitemap.xml</code>. Once it&apos;s there, scan again.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          No sitemap yet? No problem — we can still find your pages by following the links across your site.
          It just takes a little longer.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => s.discover.mutate(true)} disabled={s.discover.isPending}>
            {s.discover.isPending ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Find my pages anyway
          </Button>
          <Button variant="outline" onClick={() => s.discover.mutate(false)} disabled={s.discover.isPending}>
            <RefreshCw className="size-4" /> Check again for a sitemap
          </Button>
        </div>
      </div>
    )
  }
  if (s.status.source === "sitemap") {
    return <Banner tone="ok" icon={<CheckCircle2 className="size-5" />} title="Sitemap found"
      text={`Found ${s.status.pages_found.toLocaleString()} pages from your sitemap.${s.status.truncated ? " (scan limit reached)" : ""}`} />
  }
  if (s.status.source === "crawl") {
    return <Banner tone="ok" icon={<CheckCircle2 className="size-5" />} title="Pages found"
      text={`No sitemap, so we found ${s.status.pages_found.toLocaleString()} pages by following links across your site.`} />
  }
  return <Banner tone="warn" icon={<AlertTriangle className="size-5" />} title="No pages found" text="We couldn't find any pages. Check the domain is correct and reachable." />
}

const TONES = {
  ok: "border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400",
  info: "border-primary/30 bg-primary/5 text-primary",
  warn: "border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400",
} as const

function Banner({ tone, icon, title, text, children }: {
  tone: keyof typeof TONES; icon: ReactNode; title: string; text: string; children?: ReactNode
}) {
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", TONES[tone])}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
        {children}
      </div>
    </div>
  )
}

type Summary = NonNullable<Screen["summary"]>
interface Slice { name: string; value: number; color: string }

/** Shared card shell for every chart below the table. */
function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </CardContent>
    </Card>
  )
}

/** Legend list: color swatch, label, count and % — paired with a donut. */
function Legend({ slices, total }: { slices: Slice[]; total: number }) {
  return (
    <ul className="space-y-2">
      {slices.map((x) => (
        <li key={x.name} className="flex items-center justify-between gap-2 text-sm">
          <span className="inline-flex min-w-0 items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: x.color }} />
            <span className="truncate text-muted-foreground">{x.name}</span>
          </span>
          <span className="shrink-0 tabular-nums">
            <span className="font-medium">{x.value.toLocaleString()}</span>
            <span className="ml-1 text-xs text-muted-foreground">{total ? Math.round((x.value / total) * 100) : 0}%</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Horizontal proportional bars for a categorical breakdown (no chart lib). */
function BarList({ slices }: { slices: Slice[] }) {
  if (slices.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>
  const total = slices.reduce((a, x) => a + x.value, 0)
  const max = Math.max(...slices.map((x) => x.value), 1)
  return (
    <ul className="space-y-3">
      {slices.map((x) => (
        <li key={x.name} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-muted-foreground">{x.name}</span>
            <span className="shrink-0 tabular-nums">
              <span className="font-medium">{x.value.toLocaleString()}</span>
              <span className="ml-1 text-xs text-muted-foreground">{total ? Math.round((x.value / total) * 100) : 0}%</span>
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${Math.max(2, (x.value / max) * 100)}%`, background: x.color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Donut + legend, used for page type and indexability. */
function DonutWithLegend({ slices, centerLabel }: { slices: Slice[]; centerLabel?: string }) {
  if (slices.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No pages yet.</p>
  const total = slices.reduce((a, x) => a + x.value, 0)
  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
      <PageTypeDonut data={slices} centerLabel={centerLabel} />
      <Legend slices={slices} total={total} />
    </div>
  )
}

function Breakdown({ summary }: { summary: Summary }) {
  const slices = TYPE_ORDER
    .map((t) => ({ name: typeMeta(t).label, value: summary.by_type[t] ?? 0, color: typeMeta(t).color }))
    .filter((x) => x.value > 0)
  return <DonutWithLegend slices={slices} />
}

function IndexabilityChart({ summary }: { summary: Summary }) {
  const slices: Slice[] = [
    { name: "Indexable", value: summary.indexable, color: "var(--chart-pass)" },
    { name: "Noindex", value: summary.noindex, color: "var(--chart-warn)" },
    { name: "Unknown", value: summary.unknown_index, color: "var(--muted-foreground)" },
  ].filter((x) => x.value > 0)
  return <DonutWithLegend slices={slices} />
}

const STATUS_META: Record<string, Slice> = {
  ok: { name: "OK (2xx)", value: 0, color: "var(--chart-pass)" },
  redirect: { name: "Redirect (3xx)", value: 0, color: "var(--chart-3)" },
  client_error: { name: "Client error (4xx)", value: 0, color: "var(--chart-warn)" },
  server_error: { name: "Server error (5xx)", value: 0, color: "var(--chart-fail)" },
  unknown: { name: "Not checked", value: 0, color: "var(--muted-foreground)" },
}

function StatusChart({ summary }: { summary: Summary }) {
  const slices = Object.entries(STATUS_META)
    .map(([k, meta]) => ({ ...meta, value: summary.by_status[k] ?? 0 }))
    .filter((x) => x.value > 0)
  return <BarList slices={slices} />
}

const FRESHNESS_META: Array<[string, string, string]> = [
  ["last_30", "Updated in last 30 days", "var(--chart-1)"],
  ["last_90", "31–90 days ago", "var(--chart-2)"],
  ["last_year", "91–365 days ago", "var(--chart-3)"],
  ["older", "Over a year ago", "var(--chart-warn)"],
  ["unknown", "No date in sitemap", "var(--muted-foreground)"],
]

function FreshnessChart({ summary }: { summary: Summary }) {
  const slices = FRESHNESS_META
    .map(([k, name, color]) => ({ name, color, value: summary.by_freshness[k] ?? 0 }))
    .filter((x) => x.value > 0)
  return <BarList slices={slices} />
}

const SOURCE_META: Record<string, Slice> = {
  sitemap: { name: "From sitemap", value: 0, color: "var(--chart-1)" },
  crawl: { name: "From crawl", value: 0, color: "var(--chart-2)" },
  other: { name: "Other", value: 0, color: "var(--muted-foreground)" },
}

function SourceChart({ summary }: { summary: Summary }) {
  const slices = Object.entries(summary.by_source)
    .map(([k, value]) => ({ ...(SOURCE_META[k] ?? { name: k, color: "var(--muted-foreground)" }), value }))
    .filter((x) => x.value > 0)
  return <BarList slices={slices} />
}
