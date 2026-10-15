"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export interface BenchmarkRow {
  domain: string
  is_you: boolean
  organic_traffic: number
  ranking_keywords: number
  top3_keywords: number
  top10_keywords: number
  top20_keywords: number
}

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(Math.round(n))

// Ordered buckets, strongest first -> the validated 4-step ordinal ramp.
const BUCKETS = [
  { key: "b1", label: "Top 3", color: "var(--viz-seq-1)" },
  { key: "b2", label: "4–10", color: "var(--viz-seq-2)" },
  { key: "b3", label: "11–20", color: "var(--viz-seq-3)" },
  { key: "b4", label: "21+", color: "var(--viz-seq-4)" },
] as const

const rowHeight = (n: number) => Math.max(160, n * 34 + 40)

/**
 * Competitor benchmark — (1) estimated monthly organic traffic, you highlighted
 * (emphasis form); (2) ranking quality: share of each site's ranking keywords by
 * position bucket (100% stacked, ordinal ramp). The table below holds every value.
 */
export function CompetitorBenchmarkCharts({ rows }: { rows: BenchmarkRow[] }) {
  const traffic = [...rows].sort((a, b) => b.organic_traffic - a.organic_traffic)
  const quality = traffic.map((r) => {
    const total = Math.max(r.ranking_keywords, r.top20_keywords, 1)
    const counts = {
      b1: r.top3_keywords,
      b2: Math.max(0, r.top10_keywords - r.top3_keywords),
      b3: Math.max(0, r.top20_keywords - r.top10_keywords),
      b4: Math.max(0, total - r.top20_keywords),
    }
    return {
      domain: r.domain, is_you: r.is_you, total, counts,
      b1: (counts.b1 / total) * 100, b2: (counts.b2 / total) * 100,
      b3: (counts.b3 / total) * 100, b4: (counts.b4 / total) * 100,
    }
  })
  const yTick = (d: string, isYou: boolean) => (isYou ? `${d} (you)` : d)
  const youDomains = new Set(rows.filter((r) => r.is_you).map((r) => r.domain))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* 1. Traffic benchmark */}
      <figure className="min-w-0 space-y-2">
        <figcaption>
          <p className="text-sm font-semibold">Estimated monthly organic traffic</p>
          <p className="text-xs text-muted-foreground">
            <span className="mr-1.5 inline-block size-2.5 rounded-sm align-middle" style={{ background: "var(--viz-accent)" }} />
            You · <span className="mr-1.5 ml-1 inline-block size-2.5 rounded-sm align-middle" style={{ background: "var(--viz-muted)" }} />
            Competitors
          </p>
        </figcaption>
        <div className="w-full" style={{ height: rowHeight(traffic.length) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={traffic} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
              <XAxis type="number" tickFormatter={compact} tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--chart-grid)" />
              <YAxis type="category" dataKey="domain" width={150} tick={{ fontSize: 11, fill: "var(--foreground)" }}
                tickFormatter={(d: string) => yTick(d, youDomains.has(d))} stroke="var(--chart-grid)" />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={({ active, payload }) => {
                const r = active ? (payload?.[0]?.payload as BenchmarkRow | undefined) : undefined
                if (!r) return null
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                    <p className="font-medium text-popover-foreground">{yTick(r.domain, r.is_you)}</p>
                    <p className="tabular-nums"><strong>{Math.round(r.organic_traffic).toLocaleString()}</strong> <span className="text-muted-foreground">est. visits / mo</span></p>
                    <p className="tabular-nums"><strong>{r.ranking_keywords.toLocaleString()}</strong> <span className="text-muted-foreground">ranking keywords</span></p>
                  </div>
                )
              }} />
              <Bar dataKey="organic_traffic" maxBarSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {traffic.map((r) => <Cell key={r.domain} fill={r.is_you ? "var(--viz-accent)" : "var(--viz-muted)"} />)}
                <LabelList dataKey="organic_traffic" position="right" formatter={(v: unknown) => compact(Number(v))}
                  style={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>

      {/* 2. Ranking quality */}
      <figure className="min-w-0 space-y-2">
        <figcaption>
          <p className="text-sm font-semibold">Ranking quality — where their keywords sit</p>
          <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {BUCKETS.map((b) => (
              <span key={b.key} className="inline-flex items-center gap-1.5">
                <span className="inline-block size-2.5 rounded-sm" style={{ background: b.color }} />{b.label}
              </span>
            ))}
            <span>· share of all ranking keywords</span>
          </p>
        </figcaption>
        <div className="w-full" style={{ height: rowHeight(quality.length) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quality} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 4 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`}
                tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--chart-grid)" />
              <YAxis type="category" dataKey="domain" width={150} tick={{ fontSize: 11, fill: "var(--foreground)" }}
                tickFormatter={(d: string) => yTick(d, youDomains.has(d))} stroke="var(--chart-grid)" />
              <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={({ active, payload }) => {
                const r = active ? (payload?.[0]?.payload as (typeof quality)[number] | undefined) : undefined
                if (!r) return null
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                    <p className="mb-1 font-medium text-popover-foreground">{yTick(r.domain, r.is_you)}</p>
                    {BUCKETS.map((b) => (
                      <p key={b.key} className="flex items-center gap-2 tabular-nums">
                        <span className="inline-block h-0.5 w-3 rounded" style={{ background: b.color }} />
                        <strong>{r[b.key].toFixed(1)}%</strong>
                        <span className="text-muted-foreground">{b.label} · {r.counts[b.key].toLocaleString()} kw</span>
                      </p>
                    ))}
                  </div>
                )
              }} />
              {BUCKETS.map((b, i) => (
                <Bar key={b.key} dataKey={b.key} stackId="q" fill={b.color} maxBarSize={20}
                  stroke="var(--card)" strokeWidth={2} isAnimationActive={false}
                  radius={i === BUCKETS.length - 1 ? [0, 4, 4, 0] : 0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
    </div>
  )
}
