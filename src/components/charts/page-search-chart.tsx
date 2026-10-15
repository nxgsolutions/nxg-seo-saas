"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export type PageSearchMetric = "clicks" | "impressions" | "position"

export interface PageSearchPoint {
  day: string // ISO yyyy-mm-dd
  clicks: number
  impressions: number
  position: number | null
}

const LABEL: Record<PageSearchMetric, string> = { clicks: "Clicks", impressions: "Impressions", position: "Avg. position" }

function fmtDay(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function fmt(metric: PageSearchMetric, v: number | null | undefined): string {
  if (v == null) return "—"
  return metric === "position" ? v.toFixed(1) : Math.round(v).toLocaleString()
}

/**
 * One page's daily search numbers for ONE metric (one axis), with a dashed
 * marker on each day the page changed. Position is drawn with an inverted
 * axis (1 = top of Google) so "up" always means better.
 */
export function PageSearchChart({ data, metric, changeDays }: {
  data: PageSearchPoint[]
  metric: PageSearchMetric
  /** ISO days a change was detected. */
  changeDays: string[]
}) {
  if (data.length < 2) {
    return (
      <div className="flex h-60 items-center justify-center text-sm text-muted-foreground">
        Not enough search data yet to plot a trend.
      </div>
    )
  }
  const days = new Set(data.map((d) => d.day))
  const markers = [...new Set(changeDays)].filter((d) => days.has(d))
  return (
    <div className="h-60 w-full" role="img" aria-label={`${LABEL[metric]} per day, with page changes marked`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="pageSearchFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="day" tickFormatter={fmtDay} tickLine={false} axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }} minTickGap={28} />
          <YAxis allowDecimals={metric === "position"} reversed={metric === "position"} tickLine={false} axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }} width={40}
            domain={metric === "position" ? [1, "auto"] : [0, "auto"]} />
          <Tooltip
            cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as PageSearchPoint
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium text-popover-foreground">{fmtDay(p.day)}{markers.includes(p.day) ? " · page changed" : ""}</p>
                  <p className="text-muted-foreground">
                    {fmt("clicks", p.clicks)} clicks · {fmt("impressions", p.impressions)} impressions · pos. {fmt("position", p.position)}
                  </p>
                </div>
              )
            }}
          />
          {markers.map((d) => (
            <ReferenceLine key={d} x={d} stroke="var(--primary)" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "Change", position: "insideTopLeft", fill: "var(--primary)", fontSize: 10 }} />
          ))}
          <Area type="monotone" dataKey={metric} connectNulls stroke="var(--chart-accent)" strokeWidth={2}
            fill={metric === "position" ? "transparent" : "url(#pageSearchFill)"}
            activeDot={{ r: 4, fill: "var(--chart-accent)", stroke: "var(--background)", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
