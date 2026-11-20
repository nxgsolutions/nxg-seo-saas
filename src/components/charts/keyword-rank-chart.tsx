"use client"

/**
 * Per-keyword rank timeline: one line for our site + one line per competitor
 * domain that ranks for the keyword, from stored Google SERP snapshots.
 *
 * Google position 1 is best, so the Y axis is REVERSED (1 at the top, larger
 * numbers lower). A date with no measured position is a gap (connectNulls=false)
 * and reads as "Not Ranking" in the tooltip — never a fabricated 0.
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

import type { RankSeries } from "@/lib/api/rankings"
import { RANK_LINE_COLORS as COLORS } from "./chart-colors"

/** Minimal shape both rank-history and the aggregated timeline satisfy. */
export interface RankChartData {
  dates: string[]
  you_host: string
  you: RankSeries
  competitors: RankSeries[]
}

const YOU_KEY = "__you__"
const YOU_COLOR = "var(--chart-accent)"

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

type Row = Record<string, string | number | null>

function RankTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number | null; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  // Best (lowest) position first.
  const rows = [...payload].sort((a, b) => (a.value ?? 999) - (b.value ?? 999))
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {rows.map((r) => (
        <p key={r.name} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block size-2 rounded-full" style={{ background: r.color }} />
          <span className="text-popover-foreground">{r.name}</span>
          <span className="ml-auto tabular-nums">{r.value == null ? "Not ranking" : `#${r.value}`}</span>
        </p>
      ))}
    </div>
  )
}

export function KeywordRankChart({
  data,
  hidden,
}: {
  data: RankChartData
  /** Competitor hosts the user toggled off. */
  hidden?: Set<string>
}) {
  const competitors = hidden
    ? data.competitors.filter((c) => !hidden.has(c.host))
    : data.competitors
  // Colour by each competitor's index in the FULL list so hiding one never
  // recolours the others.
  const colorByHost = new Map(data.competitors.map((c, i) => [c.host, COLORS[i % COLORS.length]]))

  const rows: Row[] = data.dates.map((date, i) => {
    const row: Row = { date: fmtDate(date), [YOU_KEY]: data.you.points[i]?.position ?? null }
    for (const c of competitors) row[c.host] = c.points[i]?.position ?? null
    return row
  })

  const allPositions: number[] = [
    ...data.you.points.map((p) => p.position),
    ...competitors.flatMap((c) => c.points.map((p) => p.position)),
  ].filter((p): p is number => p != null)

  const measured = data.you.points.filter((p) => p.position != null).length
  if (data.dates.length === 0 || (measured === 0 && allPositions.length === 0)) {
    return (
      <div className="flex h-72 items-center justify-center text-center text-sm text-muted-foreground">
        No tracked positions yet. Use “Track now” (or wait for the next scheduled
        check) to record this keyword’s rankings.
      </div>
    )
  }
  const maxPos = Math.max(10, ...allPositions)

  return (
    <div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 12, right: 16, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
              minTickGap={24}
            />
            <YAxis
              reversed
              domain={[1, maxPos]}
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
              tickFormatter={(v) => `#${v}`}
              width={40}
            />
            <Tooltip content={<RankTooltip />} cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />
            <Line
              type="monotone"
              dataKey={YOU_KEY}
              name={`${data.you_host} (you)`}
              stroke={YOU_COLOR}
              strokeWidth={2.75}
              connectNulls={false}
              dot={{ r: 3, fill: YOU_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: "var(--background)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
            {competitors.map((c) => {
              const color = colorByHost.get(c.host) ?? COLORS[0]
              return (
                <Line
                  key={c.host}
                  type="monotone"
                  dataKey={c.host}
                  name={c.host}
                  stroke={color}
                  strokeWidth={1.75}
                  connectNulls={false}
                  dot={{ r: 2.5, strokeWidth: 0, fill: color }}
                  activeDot={{ r: 4.5, stroke: "var(--background)", strokeWidth: 2 }}
                  isAnimationActive={false}
                />
              )
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Google organic position over time · position 1 is at the top · a gap means
        not ranking in the top {maxPos}.
      </p>
    </div>
  )
}
