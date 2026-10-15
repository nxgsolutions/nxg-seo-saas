"use client"

/**
 * Multi-competitor rank-over-time chart. Y is average SERP position (reversed —
 * lower is better), X is the snapshot date. One line per competitor.
 */
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { CompetitorHistoryResponse } from "@/lib/api/competitors"

const COLORS = [
  "#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#6250d6",
  "#e34948", "#008380",
]

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function CompetitorRankChart({ data }: { data: CompetitorHistoryResponse }) {
  const competitors = data.competitors
  if (competitors.length === 0 || data.dates.length < 2) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        Refresh on different days to build up a rank-change trend over time.
      </div>
    )
  }

  // Pivot series -> one row per date with each competitor's avg_position.
  const rows = data.dates.map((date) => {
    const row: Record<string, string | number | null> = { date: fmtDate(date) }
    for (const c of competitors) {
      const p = c.points.find((pt) => pt.captured_on === date)
      row[c.competitor] = p ? p.avg_position : null
    }
    return row
  })

  const allPos = competitors.flatMap((c) => c.points.map((p) => p.avg_position))
  const maxPos = Math.max(10, ...allPos)

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            minTickGap={20}
          />
          <YAxis
            reversed
            domain={[1, Math.ceil(maxPos)]}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            width={32}
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
              const v = value as number | null | undefined
              return [v == null ? "—" : `#${v}`, name as string]
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
          {competitors.map((c, i) => (
            <Line
              key={c.competitor}
              type="monotone"
              dataKey={c.competitor}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              connectNulls
              dot={{ r: 2.5, strokeWidth: 0, fill: COLORS[i % COLORS.length] }}
              activeDot={{ r: 4.5, stroke: "var(--background)", strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
