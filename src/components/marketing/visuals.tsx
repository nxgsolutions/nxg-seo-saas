/**
 * Illustrative product visuals for the public site.
 *
 * These are static, server-rendered mockups of the NXGSEO interface. Every
 * number is sample data for illustration — never customer results — and each
 * window is captioned as such. Pure markup + inline SVG: no client JS.
 */
import * as React from "react"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  FileText,
  Gauge,
  Globe,
  Image as ImageIcon,
  LayoutDashboard,
  LineChart,
  ListChecks,
  MessageCircleQuestion,
  PlayCircle,
  Search,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export function MockWindow({
  title = "app.nxgseo.com",
  children,
  className,
  bodyClassName,
  caption = true,
}: {
  title?: string
  children: React.ReactNode
  className?: string
  bodyClassName?: string
  caption?: boolean
}) {
  return (
    <figure className={cn("relative", className)}>
      <div className="surface overflow-hidden rounded-2xl">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[oklch(0.7_0.17_25)]/70" />
          <span className="size-2.5 rounded-full bg-[oklch(0.8_0.15_85)]/70" />
          <span className="size-2.5 rounded-full bg-[oklch(0.72_0.15_150)]/70" />
          <span className="mx-auto flex h-5 min-w-0 max-w-[60%] items-center gap-1.5 truncate rounded-md bg-background/70 px-3 font-mono text-[10px] text-muted-foreground">
            <span className="size-1.5 shrink-0 rounded-full bg-[var(--chart-pass)]" />
            {title}
          </span>
          <span className="w-10" />
        </div>
        <div className={cn("p-4 sm:p-5", bodyClassName)}>{children}</div>
      </div>
      {caption ? (
        <figcaption className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Illustrative preview · sample data
        </figcaption>
      ) : null}
    </figure>
  )
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-background/60", className)}>{children}</div>
}

function PanelTitle({ icon: Icon, children, right }: { icon?: React.ElementType; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
      <span className="flex items-center gap-2 text-xs font-semibold">
        {Icon ? <Icon className="size-3.5 text-brand" /> : null}
        {children}
      </span>
      {right}
    </div>
  )
}

function Delta({ v, invert }: { v: number; invert?: boolean }) {
  const good = invert ? v < 0 : v > 0
  if (v === 0) return <span className="font-mono text-[11px] text-muted-foreground">—</span>
  const Icon = v > 0 ? ArrowUp : ArrowDown
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold tabular-nums",
        good ? "text-[var(--chart-pass)]" : "text-[var(--chart-fail)]",
      )}
    >
      <Icon className="size-3" />
      {Math.abs(v)}
    </span>
  )
}

const intentStyles: Record<string, string> = {
  I: "bg-sky-500/12 text-sky-600 dark:text-sky-300",
  C: "bg-violet-500/12 text-violet-600 dark:text-violet-300",
  T: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300",
  N: "bg-amber-500/14 text-amber-700 dark:text-amber-300",
}
function Intent({ k }: { k: keyof typeof intentStyles }) {
  return (
    <span className={cn("inline-flex size-5 items-center justify-center rounded-md font-mono text-[10px] font-bold", intentStyles[k])}>
      {k}
    </span>
  )
}

function Bar({ value, className }: { value: number; className?: string }) {
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <span className={cn("block h-full rounded-full", className)} style={{ width: `${value}%`, backgroundImage: className ? undefined : "var(--grad-brand)" }} />
    </span>
  )
}

/** Build a smooth-ish SVG path from values scaled into a w×h box. */
function linePath(values: number[], w: number, h: number, min: number, max: number, invert = false) {
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => {
    const t = (v - min) / (max - min)
    return [i * step, invert ? t * h : h - t * h] as const
  })
  return pts
    .map(([x, y], i) => {
      if (i === 0) return `M${x.toFixed(1)},${y.toFixed(1)}`
      const [px, py] = pts[i - 1]
      const cx = (px + x) / 2
      return `C${cx.toFixed(1)},${py.toFixed(1)} ${cx.toFixed(1)},${y.toFixed(1)} ${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")
}

/* ------------------------------------------------------------------ */
/* Hero dashboard                                                      */
/* ------------------------------------------------------------------ */

const heroTraffic = [22, 24, 23, 27, 26, 30, 29, 33, 35, 34, 39, 41, 40, 45, 48, 47, 52, 55]

export function HeroDashboard() {
  const w = 560
  const h = 150
  const line = linePath(heroTraffic, w, h, 15, 60)
  return (
    <MockWindow title="app.nxgseo.com/overview" bodyClassName="p-0" caption={false}>
      <div className="grid grid-cols-[auto_1fr]">
        {/* Sidebar */}
        <aside className="hidden w-44 flex-col gap-0.5 border-r border-border bg-muted/20 p-3 md:flex">
          {[
            { icon: LayoutDashboard, label: "Overview", active: true },
            { icon: Search, label: "Keywords" },
            { icon: LineChart, label: "Rankings" },
            { icon: FileText, label: "Content" },
            { icon: Gauge, label: "Site audit" },
            { icon: Users, label: "Competitors" },
          ].map((i) => (
            <span
              key={i.label}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[11px] font-medium",
                i.active ? "bg-brand/10 text-brand" : "text-muted-foreground",
              )}
            >
              <i.icon className="size-3.5" />
              {i.label}
            </span>
          ))}
          <div className="mt-auto rounded-lg border border-border bg-background/70 p-2.5">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold">
              <span className="mk-live size-1.5 rounded-full bg-[var(--chart-pass)]" /> Search Console
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Synced 4 min ago</p>
          </div>
        </aside>

        {/* Main */}
        <div className="min-w-0 space-y-3 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: "Clicks (28d)", value: "18.4K", d: 12.6 },
              { label: "Impressions", value: "612K", d: 8.1 },
              { label: "Avg. position", value: "8.6", d: 1.4, unit: "" },
              { label: "Opportunities", value: "142", d: 23 },
            ].map((s) => (
              <Panel key={s.label} className="p-3">
                <p className="text-[10px] font-medium text-muted-foreground">{s.label}</p>
                <div className="mt-1 flex items-end justify-between gap-1">
                  <span className="font-heading text-xl font-semibold tabular-nums tracking-tight">{s.value}</span>
                  <span className="rounded-md bg-[var(--chart-pass)]/12 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--chart-pass)]">
                    +{s.d}{"unit" in s ? s.unit : "%"}
                  </span>
                </div>
              </Panel>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
            <Panel className="lg:col-span-3">
              <PanelTitle icon={LineChart} right={<span className="font-mono text-[10px] text-muted-foreground">Last 90 days</span>}>
                Organic clicks
              </PanelTitle>
              <div className="p-3">
                <svg viewBox={`0 0 ${w} ${h}`} className="h-36 w-full" preserveAspectRatio="none" aria-hidden>
                  <defs>
                    <linearGradient id="hd-fill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.28" />
                      <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="hd-line" x1="0" x2="1">
                      <stop offset="0%" stopColor="var(--brand)" />
                      <stop offset="100%" stopColor="var(--aqua)" />
                    </linearGradient>
                  </defs>
                  {[0.25, 0.5, 0.75].map((y) => (
                    <line key={y} x1="0" x2={w} y1={h * y} y2={h * y} stroke="var(--border)" strokeDasharray="3 5" />
                  ))}
                  <path d={`${line} L${w},${h} L0,${h} Z`} fill="url(#hd-fill)" />
                  <path d={line} fill="none" stroke="url(#hd-line)" strokeWidth="2.5" className="mk-draw" style={{ ["--len" as string]: 900 }} vectorEffect="non-scaling-stroke" />
                </svg>
              </div>
            </Panel>
            <Panel className="lg:col-span-2">
              <PanelTitle icon={Sparkles}>Top opportunities</PanelTitle>
              <ul className="divide-y divide-border">
                {[
                  { k: "seo audit checklist", p: 11, s: 92 },
                  { k: "keyword clustering tool", p: 14, s: 86 },
                  { k: "rank tracker free", p: 9, s: 81 },
                  { k: "serp features list", p: 17, s: 74 },
                ].map((r) => (
                  <li key={r.k} className="flex items-center gap-3 px-3.5 py-2">
                    <span className="min-w-0 flex-1 truncate text-[11px] font-medium">{r.k}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">#{r.p}</span>
                    <span className="w-8 rounded-md bg-brand/10 py-0.5 text-center font-mono text-[10px] font-bold text-brand">{r.s}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      </div>
    </MockWindow>
  )
}

/* ------------------------------------------------------------------ */
/* Keyword research                                                    */
/* ------------------------------------------------------------------ */

const keywordRows = [
  { k: "keyword research tool", i: "C", imp: "24.1K", pos: 12.4, kd: 48, opp: 91 },
  { k: "how to find keywords", i: "I", imp: "9.8K", pos: 8.2, kd: 31, opp: 88 },
  { k: "long tail keywords", i: "I", imp: "7.2K", pos: 15.1, kd: 27, opp: 84 },
  { k: "keyword clustering", i: "C", imp: "4.6K", pos: 6.7, kd: 36, opp: 79 },
  { k: "buy seo software", i: "T", imp: "2.9K", pos: 21.3, kd: 62, opp: 58 },
] as const

export function KeywordTableMock({ caption = true }: { caption?: boolean }) {
  return (
    <MockWindow title="Keyword research · first-party" caption={caption} bodyClassName="p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
        <span className="flex h-8 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 text-xs">
          <Search className="size-3.5 text-muted-foreground" />
          keyword research
        </span>
        {["Search Console", "Autocomplete", "Live SERP"].map((s) => (
          <span key={s} className="hidden rounded-md border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground sm:inline">
            {s}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-left text-[11px]">
          <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
            <tr className="border-b border-border">
              <th className="px-3.5 py-2 font-medium">Keyword</th>
              <th className="px-2 py-2 font-medium">Intent</th>
              <th className="px-2 py-2 text-right font-medium">Impr.</th>
              <th className="px-2 py-2 text-right font-medium">Pos.</th>
              <th className="px-2 py-2 font-medium">KD</th>
              <th className="px-3.5 py-2 text-right font-medium">Opp.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {keywordRows.map((r) => (
              <tr key={r.k}>
                <td className="px-3.5 py-2.5 font-medium">{r.k}</td>
                <td className="px-2 py-2.5"><Intent k={r.i} /></td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums text-muted-foreground">{r.imp}</td>
                <td className="px-2 py-2.5 text-right font-mono tabular-nums">{r.pos}</td>
                <td className="w-20 px-2 py-2.5">
                  <Bar
                    value={r.kd}
                    className={r.kd > 55 ? "bg-[var(--chart-fail)]" : r.kd > 40 ? "bg-[var(--chart-warn)]" : "bg-[var(--chart-pass)]"}
                  />
                </td>
                <td className="px-3.5 py-2.5 text-right">
                  <span className="inline-block w-9 rounded-md bg-brand/10 py-0.5 text-center font-mono text-[10px] font-bold text-brand">{r.opp}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MockWindow>
  )
}

export function SearchConsoleMock() {
  const bars = [30, 42, 38, 51, 47, 58, 55, 63, 60, 72, 69, 78]
  return (
    <MockWindow title="Source · Google Search Console">
      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Queries", v: "3,412" },
          { l: "Impressions", v: "612K" },
          { l: "Avg. CTR", v: "3.0%" },
        ].map((s) => (
          <Panel key={s.l} className="p-3">
            <p className="text-[10px] text-muted-foreground">{s.l}</p>
            <p className="mt-0.5 font-heading text-lg font-semibold tabular-nums">{s.v}</p>
          </Panel>
        ))}
      </div>
      <Panel className="mt-3 p-3">
        <div className="flex h-28 items-end gap-1.5">
          {bars.map((b, i) => (
            <span key={i} className="flex-1 rounded-t-sm" style={{ height: `${b}%`, backgroundImage: "var(--grad-brand)", opacity: 0.4 + i * 0.05 }} />
          ))}
        </div>
      </Panel>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {["Provenance: GSC", "Provenance: Autocomplete", "Trend: rising"].map((t) => (
          <span key={t} className="rounded-full border border-border bg-muted/40 px-2.5 py-1 font-mono text-[10px] text-muted-foreground">{t}</span>
        ))}
      </div>
    </MockWindow>
  )
}

export function OpportunityMock() {
  const parts = [
    { l: "Real demand (impressions)", v: 38, c: "bg-brand" },
    { l: "Striking-distance position", v: 29, c: "bg-[var(--aqua)]" },
    { l: "Difficulty (inverse)", v: 17, c: "bg-[var(--chart-pass)]" },
    { l: "Intent fit", v: 8, c: "bg-[var(--chart-warn)]" },
  ]
  return (
    <MockWindow title="Opportunity score · explained">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-muted-foreground">keyword research tool</p>
          <p className="mt-0.5 font-heading text-3xl font-bold tabular-nums">
            92<span className="text-base font-medium text-muted-foreground">/100</span>
          </p>
        </div>
        <span className="rounded-full bg-[var(--chart-pass)]/12 px-2.5 py-1 text-[10px] font-semibold text-[var(--chart-pass)]">High priority</span>
      </div>
      <div className="mt-4 flex h-2.5 overflow-hidden rounded-full">
        {parts.map((p) => (
          <span key={p.l} className={p.c} style={{ width: `${p.v}%` }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {parts.map((p) => (
          <li key={p.l} className="flex items-center gap-2.5 text-[11px]">
            <span className={cn("size-2 rounded-full", p.c)} />
            <span className="flex-1 text-muted-foreground">{p.l}</span>
            <span className="font-mono font-semibold tabular-nums">+{p.v}</span>
          </li>
        ))}
      </ul>
    </MockWindow>
  )
}

/* ------------------------------------------------------------------ */
/* Rank tracking                                                       */
/* ------------------------------------------------------------------ */

export function RankChartMock({ caption = true }: { caption?: boolean }) {
  const w = 520
  const h = 170
  const series = [
    { name: "seo audit tool", c: "var(--brand)", v: [18, 16, 17, 14, 12, 12, 10, 9, 8, 7, 6, 5] },
    { name: "site crawler", c: "var(--aqua)", v: [9, 10, 9, 9, 8, 9, 7, 7, 6, 6, 5, 4] },
    { name: "meta tag checker", c: "var(--chart-warn)", v: [24, 23, 25, 22, 21, 19, 20, 18, 17, 15, 14, 13] },
  ]
  return (
    <MockWindow title="Rank tracker · desktop · United States" caption={caption}>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="h-0.5 w-4 rounded-full" style={{ background: s.c }} />
            {s.name}
          </span>
        ))}
      </div>
      <Panel className="relative p-3 pl-8">
        <div className="absolute inset-y-3 left-2 flex flex-col justify-between font-mono text-[9px] text-muted-foreground">
          <span>1</span>
          <span>10</span>
          <span>20</span>
          <span>30</span>
        </div>
        <svg viewBox={`0 0 ${w} ${h}`} className="h-40 w-full" preserveAspectRatio="none" aria-hidden>
          <rect x="0" y="0" width={w} height={h / 3} fill="var(--chart-pass)" opacity="0.06" />
          {[1 / 3, 2 / 3].map((y) => (
            <line key={y} x1="0" x2={w} y1={h * y} y2={h * y} stroke="var(--border)" strokeDasharray="3 5" />
          ))}
          {series.map((s) => (
            <path key={s.name} d={linePath(s.v, w, h, 1, 30, true)} fill="none" stroke={s.c} strokeWidth="2.25" vectorEffect="non-scaling-stroke" className="mk-draw" style={{ ["--len" as string]: 800 }} />
          ))}
        </svg>
      </Panel>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { l: "Top 3", v: "38", d: 6 },
          { l: "Top 10", v: "214", d: 19 },
          { l: "Dropped", v: "11", d: -4 },
        ].map((s) => (
          <Panel key={s.l} className="p-2.5">
            <p className="text-[10px] text-muted-foreground">{s.l}</p>
            <p className="mt-0.5 flex items-baseline justify-between font-heading text-base font-semibold tabular-nums">
              {s.v} <Delta v={s.d} invert={s.l === "Dropped"} />
            </p>
          </Panel>
        ))}
      </div>
    </MockWindow>
  )
}

export function GainsLossesMock() {
  const rows = [
    { k: "technical seo guide", from: 14, to: 6, t: "+1.2K" },
    { k: "canonical tag", from: 9, to: 4, t: "+860" },
    { k: "robots.txt tester", from: 5, to: 3, t: "+410" },
    { k: "hreflang checker", from: 7, to: 12, t: "−380" },
    { k: "sitemap generator", from: 11, to: 15, t: "−150" },
  ]
  return (
    <MockWindow title="Gains & losses · last 28 days" bodyClassName="p-0">
      <div className="grid grid-cols-2 divide-x divide-border border-b border-border">
        <div className="p-4">
          <p className="text-[10px] text-muted-foreground">Est. traffic gained</p>
          <p className="mt-0.5 font-heading text-xl font-semibold text-[var(--chart-pass)]">+2,470</p>
        </div>
        <div className="p-4">
          <p className="text-[10px] text-muted-foreground">Est. traffic lost</p>
          <p className="mt-0.5 font-heading text-xl font-semibold text-[var(--chart-fail)]">−530</p>
        </div>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r) => (
          <li key={r.k} className="flex items-center gap-3 px-4 py-2.5 text-[11px]">
            <span className="min-w-0 flex-1 truncate font-medium">{r.k}</span>
            <span className="font-mono tabular-nums text-muted-foreground">
              {r.from} → <span className="text-foreground">{r.to}</span>
            </span>
            <Delta v={r.from - r.to} />
            <span className={cn("w-12 text-right font-mono tabular-nums", r.t.startsWith("+") ? "text-[var(--chart-pass)]" : "text-[var(--chart-fail)]")}>{r.t}</span>
          </li>
        ))}
      </ul>
    </MockWindow>
  )
}

/* ------------------------------------------------------------------ */
/* Content                                                             */
/* ------------------------------------------------------------------ */

function ScoreRing({ value, size = 96 }: { value: number; size?: number }) {
  const r = 40
  const c = 2 * Math.PI * r
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
        <defs>
          <linearGradient id="ring-grad" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--brand)" />
            <stop offset="100%" stopColor="var(--aqua)" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--muted)" strokeWidth="9" />
        <circle cx="50" cy="50" r={r} fill="none" stroke="url(#ring-grad)" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-2xl font-bold tabular-nums">{value}</span>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">score</span>
      </span>
    </div>
  )
}

export function ContentScoreMock({ caption = true }: { caption?: boolean }) {
  const checks = [
    { ok: true, t: "Primary keyword in title and H1" },
    { ok: true, t: "Answers 6 of 7 People Also Ask questions" },
    { ok: false, t: "Cover subtopic: “keyword difficulty”" },
    { ok: false, t: "Add comparison table (4 of top 5 have one)" },
    { ok: true, t: "Meta description within 155 characters" },
  ]
  return (
    <MockWindow title="Content optimizer · /blog/keyword-research" caption={caption}>
      <div className="flex items-center gap-4">
        <ScoreRing value={78} />
        <div className="min-w-0 flex-1 space-y-2.5">
          {[
            { l: "Topic coverage", v: 82 },
            { l: "Structure", v: 74 },
            { l: "Readability", v: 88 },
          ].map((m) => (
            <div key={m.l}>
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-muted-foreground">{m.l}</span>
                <span className="font-mono font-semibold tabular-nums">{m.v}</span>
              </div>
              <Bar value={m.v} />
            </div>
          ))}
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {checks.map((c) => (
          <li key={c.t} className="flex items-start gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2 text-[11px]">
            {c.ok ? (
              <Check className="mt-px size-3.5 shrink-0 text-[var(--chart-pass)]" />
            ) : (
              <CircleAlert className="mt-px size-3.5 shrink-0 text-[var(--chart-warn)]" />
            )}
            <span className={c.ok ? "text-muted-foreground" : "font-medium"}>{c.t}</span>
          </li>
        ))}
      </ul>
    </MockWindow>
  )
}

export function BriefMock() {
  return (
    <MockWindow title="Content brief · generated from SERP">
      <div className="flex flex-wrap gap-1.5">
        {["Informational", "~1,800 words", "7 questions", "12 entities"].map((t) => (
          <span key={t} className="rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold text-brand">{t}</span>
        ))}
      </div>
      <Panel className="mt-3 divide-y divide-border">
        {[
          { h: "H1", t: "Keyword research: a practical guide" },
          { h: "H2", t: "What makes a keyword worth targeting" },
          { h: "H3", t: "Search intent and why it matters" },
          { h: "H2", t: "Finding ideas in Search Console" },
          { h: "H2", t: "How to prioritize by opportunity" },
        ].map((r, i) => (
          <div key={i} className={cn("flex items-center gap-2.5 px-3 py-2 text-[11px]", r.h === "H3" && "pl-7")}>
            <span className="w-6 rounded bg-muted py-0.5 text-center font-mono text-[9px] font-bold text-muted-foreground">{r.h}</span>
            <span className="font-medium">{r.t}</span>
          </div>
        ))}
      </Panel>
      <div className="mt-3 flex items-start gap-2 rounded-lg border border-dashed border-brand/40 bg-brand/5 p-3 text-[11px]">
        <Sparkles className="mt-px size-3.5 shrink-0 text-brand" />
        <span className="text-muted-foreground">
          <span className="font-semibold text-foreground">Questions to answer:</span> How do I find low-competition keywords? What is a good keyword difficulty?
        </span>
      </div>
    </MockWindow>
  )
}

/* ------------------------------------------------------------------ */
/* Audit                                                               */
/* ------------------------------------------------------------------ */

export function AuditIssuesMock({ caption = true }: { caption?: boolean }) {
  const issues = [
    { sev: "high", t: "12 pages missing a canonical tag", n: "Impact 9.1" },
    { sev: "high", t: "Duplicate title on 8 category pages", n: "Impact 8.4" },
    { sev: "med", t: "34 images without alt text", n: "Impact 5.2" },
    { sev: "med", t: "H1 missing on 3 landing pages", n: "Impact 4.8" },
    { sev: "low", t: "Meta descriptions over 160 chars", n: "Impact 2.1" },
  ] as const
  const sevStyle = {
    high: "bg-[var(--chart-fail)]/12 text-[var(--chart-fail)]",
    med: "bg-[var(--chart-warn)]/15 text-[oklch(0.55_0.13_70)] dark:text-[var(--chart-warn)]",
    low: "bg-muted text-muted-foreground",
  }
  return (
    <MockWindow title="Site audit · prioritized fixes" caption={caption}>
      <div className="flex items-center gap-4">
        <ScoreRing value={71} size={84} />
        <div className="grid flex-1 grid-cols-3 gap-2">
          {[
            { l: "Critical", v: 20, c: "text-[var(--chart-fail)]" },
            { l: "Warnings", v: 37, c: "text-[var(--chart-warn)]" },
            { l: "Passed", v: 184, c: "text-[var(--chart-pass)]" },
          ].map((s) => (
            <Panel key={s.l} className="p-2.5 text-center">
              <p className={cn("font-heading text-lg font-semibold tabular-nums", s.c)}>{s.v}</p>
              <p className="text-[10px] text-muted-foreground">{s.l}</p>
            </Panel>
          ))}
        </div>
      </div>
      <ul className="mt-4 space-y-1.5">
        {issues.map((i) => (
          <li key={i.t} className="flex items-center gap-2.5 rounded-lg border border-border bg-background/60 px-3 py-2 text-[11px]">
            <span className={cn("w-11 rounded py-0.5 text-center font-mono text-[9px] font-bold uppercase", sevStyle[i.sev])}>{i.sev}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{i.t}</span>
            <span className="hidden font-mono text-[10px] text-muted-foreground sm:inline">{i.n}</span>
          </li>
        ))}
      </ul>
    </MockWindow>
  )
}

export function CrawlMock() {
  const checks = [
    { t: "robots.txt reachable", s: "pass", d: "200 · 14 rules" },
    { t: "XML sitemap discovered", s: "pass", d: "1,204 URLs" },
    { t: "Indexable pages", s: "pass", d: "1,146 / 1,204" },
    { t: "Blocked by robots", s: "warn", d: "41 URLs" },
    { t: "noindex on linked pages", s: "fail", d: "17 URLs" },
  ]
  return (
    <MockWindow title="Crawlability · robots & sitemaps">
      <ul className="space-y-1.5">
        {checks.map((c) => (
          <li key={c.t} className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-2.5 text-[11px]">
            {c.s === "pass" ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-[var(--chart-pass)]/12"><Check className="size-3 text-[var(--chart-pass)]" /></span>
            ) : c.s === "warn" ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-[var(--chart-warn)]/15"><AlertTriangle className="size-3 text-[var(--chart-warn)]" /></span>
            ) : (
              <span className="flex size-5 items-center justify-center rounded-full bg-[var(--chart-fail)]/12"><X className="size-3 text-[var(--chart-fail)]" /></span>
            )}
            <span className="flex-1 font-medium">{c.t}</span>
            <span className="font-mono text-[10px] text-muted-foreground">{c.d}</span>
          </li>
        ))}
      </ul>
      <Panel className="mt-3 p-3 font-mono text-[10px] leading-relaxed text-muted-foreground">
        <span className="text-brand">User-agent:</span> *<br />
        <span className="text-brand">Disallow:</span> /cart/<br />
        <span className="text-brand">Sitemap:</span> https://example.com/sitemap.xml
      </Panel>
    </MockWindow>
  )
}

/* ------------------------------------------------------------------ */
/* Competitors                                                         */
/* ------------------------------------------------------------------ */

export function CompetitorGapMock({ caption = true }: { caption?: boolean }) {
  return (
    <MockWindow title="Competitor gap · you vs 2 rivals" caption={caption}>
      <div className="grid items-center gap-4 sm:grid-cols-[150px_1fr]">
        <svg viewBox="0 0 150 130" className="mx-auto h-32 w-40" aria-hidden>
          <circle cx="55" cy="50" r="40" fill="var(--brand)" fillOpacity="0.22" stroke="var(--brand)" strokeOpacity="0.6" />
          <circle cx="95" cy="50" r="40" fill="var(--aqua)" fillOpacity="0.2" stroke="var(--aqua)" strokeOpacity="0.7" />
          <circle cx="75" cy="85" r="40" fill="var(--chart-warn)" fillOpacity="0.16" stroke="var(--chart-warn)" strokeOpacity="0.6" />
          <text x="38" y="42" fontSize="9" fill="currentColor" fontWeight="600">You</text>
          <text x="98" y="42" fontSize="9" fill="currentColor" fontWeight="600">A</text>
          <text x="72" y="112" fontSize="9" fill="currentColor" fontWeight="600">B</text>
        </svg>
        <div className="space-y-2">
          {[
            { l: "Shared keywords", v: 412, w: 62 },
            { l: "Only competitors rank", v: 268, w: 41 },
            { l: "Only you rank", v: 133, w: 20 },
          ].map((r) => (
            <div key={r.l}>
              <div className="mb-1 flex justify-between text-[10px]">
                <span className="text-muted-foreground">{r.l}</span>
                <span className="font-mono font-semibold tabular-nums">{r.v}</span>
              </div>
              <Bar value={r.w} />
            </div>
          ))}
        </div>
      </div>
      <Panel className="mt-4 divide-y divide-border">
        <div className="grid grid-cols-[1fr_repeat(3,2.5rem)] px-3 py-2 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Missing keyword</span>
          <span className="text-center">You</span>
          <span className="text-center">A</span>
          <span className="text-center">B</span>
        </div>
        {[
          { k: "technical seo checklist", a: 3, b: 7 },
          { k: "free site audit", a: 5, b: 2 },
          { k: "schema markup generator", a: 8, b: 11 },
        ].map((r) => (
          <div key={r.k} className="grid grid-cols-[1fr_repeat(3,2.5rem)] items-center px-3 py-2 text-[11px]">
            <span className="truncate font-medium">{r.k}</span>
            <span className="text-center font-mono text-muted-foreground">—</span>
            <span className="text-center font-mono tabular-nums">{r.a}</span>
            <span className="text-center font-mono tabular-nums">{r.b}</span>
          </div>
        ))}
      </Panel>
    </MockWindow>
  )
}

export function ShareOfVoiceMock() {
  const rows = [
    { d: "yoursite.com", v: 34, c: "var(--brand)" },
    { d: "competitor-a.com", v: 29, c: "var(--aqua)" },
    { d: "competitor-b.com", v: 21, c: "var(--chart-warn)" },
    { d: "others", v: 16, c: "var(--muted-foreground)" },
  ]
  return (
    <MockWindow title="Overlap & share of visibility">
      <div className="flex h-3 overflow-hidden rounded-full">
        {rows.map((r) => (
          <span key={r.d} style={{ width: `${r.v}%`, background: r.c, opacity: r.d === "others" ? 0.35 : 1 }} />
        ))}
      </div>
      <ul className="mt-4 space-y-2.5">
        {rows.map((r) => (
          <li key={r.d} className="flex items-center gap-2.5 text-[11px]">
            <span className="size-2.5 rounded-sm" style={{ background: r.c, opacity: r.d === "others" ? 0.35 : 1 }} />
            <span className="flex-1 font-medium">{r.d}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{r.v}%</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 rounded-lg border border-dashed border-brand/40 bg-brand/5 p-3 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">27 near-misses</span> — shared keywords where a rival sits 1–3 spots above you.
      </div>
    </MockWindow>
  )
}

/* ------------------------------------------------------------------ */
/* SERP                                                                */
/* ------------------------------------------------------------------ */

export function SerpMock({ caption = true }: { caption?: boolean }) {
  return (
    <MockWindow title="SERP · “best running shoes for flat feet”" caption={caption}>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          { i: Star, l: "Featured snippet" },
          { i: MessageCircleQuestion, l: "People also ask" },
          { i: PlayCircle, l: "Videos" },
          { i: ImageIcon, l: "Images" },
        ].map((f) => (
          <span key={f.l} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 text-[10px] font-medium">
            <f.i className="size-3 text-brand" />
            {f.l}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        <Panel className="border-brand/30 bg-brand/[0.04] p-3">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-brand">Featured snippet</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Look for stability shoes with firm midsoles and structured arch support…
          </p>
        </Panel>
        {[
          { u: "runnersguide.com › reviews", t: "11 Best Running Shoes for Flat Feet (Tested)", da: "Review" },
          { u: "shoeshop.com › flat-feet", t: "Running Shoes for Flat Feet | Free Shipping", da: "Category" },
        ].map((r) => (
          <div key={r.t} className="rounded-lg px-1 py-1.5">
            <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Globe className="size-3" />
              {r.u}
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-[oklch(0.5_0.18_265)] dark:text-[oklch(0.78_0.12_265)]">{r.t}</p>
            <span className="mt-1 inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{r.da}</span>
          </div>
        ))}
        <Panel className="divide-y divide-border">
          {["Are Hokas good for flat feet?", "Should flat feet run in neutral shoes?"].map((q) => (
            <p key={q} className="flex items-center justify-between px-3 py-2 text-[11px]">
              {q}
              <ArrowDown className="size-3 text-muted-foreground" />
            </p>
          ))}
        </Panel>
      </div>
    </MockWindow>
  )
}

export function IntentDifficultyMock() {
  return (
    <MockWindow title="Intent & difficulty read">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Intent mix of top 10</p>
      <div className="mt-2 flex h-3 overflow-hidden rounded-full">
        <span className="bg-violet-500" style={{ width: "60%" }} />
        <span className="bg-sky-500" style={{ width: "30%" }} />
        <span className="bg-emerald-500" style={{ width: "10%" }} />
      </div>
      <div className="mt-2 flex gap-4 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-violet-500" />Commercial 60%</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-sky-500" />Informational 30%</span>
        <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-emerald-500" />Transactional 10%</span>
      </div>
      <Panel className="mt-4 p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-[11px] font-semibold">Difficulty</span>
          <span className="font-heading text-xl font-bold tabular-nums">46</span>
        </div>
        <div className="relative mt-3 h-2 rounded-full" style={{ background: "linear-gradient(90deg, var(--chart-pass), var(--chart-warn), var(--chart-fail))" }}>
          <span className="absolute -top-1 size-4 -translate-x-1/2 rounded-full border-2 border-background bg-foreground shadow" style={{ left: "46%" }} />
        </div>
        <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
          <span>Easy</span>
          <span>Moderate</span>
          <span>Hard</span>
        </div>
      </Panel>
      <ul className="mt-3 space-y-1.5 text-[11px]">
        {[
          "Top results are listicles → format: comparison guide",
          "3 forum results in top 10 → weaker competition",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2 text-muted-foreground">
            <ListChecks className="mt-px size-3.5 shrink-0 text-brand" /> {t}
          </li>
        ))}
      </ul>
    </MockWindow>
  )
}

/* ------------------------------------------------------------------ */
/* Small tiles used in the home bento grid (no window chrome)          */
/* ------------------------------------------------------------------ */

export function MiniSpark({ values, className }: { values: number[]; className?: string }) {
  const w = 200
  const h = 60
  const d = linePath(values, w, h, Math.min(...values) - 2, Math.max(...values) + 2)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-16 w-full", className)} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="ms-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w},${h} L0,${h} Z`} fill="url(#ms-fill)" />
      <path d={d} fill="none" stroke="var(--brand)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}


/* ------------------------------------------------------------------ */
/* Per-feature visual sets                                             */
/* ------------------------------------------------------------------ */

export const featureVisuals: Record<string, { hero: React.ReactNode; splits: React.ReactNode[] }> = {
  "keyword-research": { hero: <KeywordTableMock caption={false} />, splits: [<SearchConsoleMock key="a" />, <OpportunityMock key="b" />] },
  "rank-tracker": { hero: <RankChartMock caption={false} />, splits: [<RankChartMock key="a" />, <GainsLossesMock key="b" />] },
  "content-optimizer": { hero: <ContentScoreMock caption={false} />, splits: [<SerpMock key="a" />, <BriefMock key="b" />] },
  "seo-audit": { hero: <AuditIssuesMock caption={false} />, splits: [<AuditIssuesMock key="a" />, <CrawlMock key="b" />] },
  "competitor-analysis": { hero: <CompetitorGapMock caption={false} />, splits: [<CompetitorGapMock key="a" />, <ShareOfVoiceMock key="b" />] },
  "serp-analysis": { hero: <SerpMock caption={false} />, splits: [<SerpMock key="a" />, <IntentDifficultyMock key="b" />] },
}
