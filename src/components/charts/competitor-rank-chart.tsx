"use client"

/**
 * Multi-competitor analytics-over-time chart. One line per competitor for the
 * selected whole-site metric (traffic share / est. traffic / ranking keywords /
 * domain rank), from the saved competitor analytics snapshots. Higher is better
 * for every metric, so the Y axis runs normally. The series is continuous across
 * the range at the chosen frequency: a period with no fetch shows 0 (a display
 * baseline, never a fabricated record).
 */
import {
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type {
  CompetitorHistoryResponse,
  RankTrendFreq,
  RankTrendMetric,
} from "@/lib/api/competitors"
import { RANK_LINE_COLORS as COLORS } from "./chart-colors"

function fmtDate(iso: string, freq: RankTrendFreq): string {
  const d = new Date(iso + "T00:00:00")
  return freq === "monthly"
    ? d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const compact = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
      : String(Math.round(n))

const METRICS: Record<
  RankTrendMetric,
  { label: string; fmt: (n: number) => string; axis: (n: number) => string }
> = {
  traffic_share: { label: "Traffic share", fmt: (n) => `${n}%`, axis: (n) => `${n}%` },
  est_traffic: { label: "Est. traffic", fmt: compact, axis: compact },
  ranking_keywords: { label: "Ranking keywords", fmt: compact, axis: compact },
  domain_rank: { label: "Domain rank", fmt: (n) => `${n}`, axis: (n) => `${n}` },
}

export function CompetitorRankChart({
  data,
  metric,
  hidden,
}: {
  data: CompetitorHistoryResponse
  metric: RankTrendMetric
  /** Competitor hosts to hide (user toggled them off). */
  hidden?: Set<string>
}) {
  const conf = METRICS[metric]
  // Colour tied to each competitor's position in the FULL series, so hiding one
  // never recolours the others.
  const colorByComp = new Map(data.competitors.map((c, i) => [c.competitor, COLORS[i % COLORS.length]]))
  const competitors = hidden
    ? data.competitors.filter((c) => !hidden.has(c.competitor))
    : data.competitors
  const hasCompetitors = competitors.length > 0

  // One row per period; a competitor without that period gets null (bridged).
  const rows = data.dates.map((date) => {
    const row: Record<string, string | number> = { date: fmtDate(date, data.freq) }
    for (const c of competitors) {
      const p = c.points.find((pt) => pt.captured_on === date)
      // Continuous series: a period with no fetch is 0 (display baseline).
      row[c.competitor] = p ? p[metric] : 0
    }
    return row
  })

  // Last index with real (non-zero) data per competitor — for the end value label.
  const lastIdx: Record<string, number> = {}
  for (const c of competitors) {
    let idx = -1
    rows.forEach((r, i) => {
      if ((r[c.competitor] as number) > 0) idx = i
    })
    lastIdx[c.competitor] = idx
  }

  const allVals = competitors.flatMap((c) => c.points.map((p) => p[metric]))
  const maxVal = Math.max(1, ...allVals)

  if (!hasCompetitors || data.dates.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground">
        No competitor analytics in this range yet. Fetch competitor data (or widen
        the range) to build the trend.
      </div>
    )
  }

  return (
    <div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 12, right: 26, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              domain={[0, Math.ceil(maxVal)]}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
              tickFormatter={conf.axis}
              width={48}
              label={{
                value: conf.label,
                angle: -90,
                position: "insideLeft",
                style: { fill: "var(--muted-foreground)", fontSize: 11, textAnchor: "middle" },
              }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: "var(--popover-foreground)" }}
              formatter={(value, name) => {
                const v = value as number
                return [v === 0 ? "no data" : conf.fmt(v), name as string]
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
            {competitors.map((c) => {
              const color = colorByComp.get(c.competitor) ?? COLORS[0]
              return (
                <Line
                  key={c.competitor}
                  type="monotone"
                  dataKey={c.competitor}
                  name={c.is_you ? `${c.competitor} (you)` : c.competitor}
                  stroke={color}
                  strokeWidth={2}
                  dot={data.freq === "daily" ? false : { r: 2.5, strokeWidth: 0, fill: color }}
                  activeDot={{ r: 4.5, stroke: "var(--background)", strokeWidth: 2 }}
                  isAnimationActive={false}
                >
                  <LabelList
                    dataKey={c.competitor}
                    content={(props) => {
                      const { x, y, value, index } = props as {
                        x?: number; y?: number; value?: number; index?: number
                      }
                      if (
                        index !== lastIdx[c.competitor] ||
                        typeof value !== "number" ||
                        x == null ||
                        y == null
                      )
                        return null
                      return (
                        <text x={x} y={y} dy={-8} textAnchor="middle" fontSize={10} fontWeight={600} fill={color}>
                          {conf.fmt(value)}
                        </text>
                      )
                    }}
                  />
                </Line>
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {conf.label} per competitor over time · higher is better · 0 = no fetch
        that period
      </p>
    </div>
  )
}
