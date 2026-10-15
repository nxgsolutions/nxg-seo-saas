"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { TrendPoint } from "./trend-utils"

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: TrendPoint }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">Score {p.score}</p>
      <p className="mt-0.5 max-w-48 truncate text-muted-foreground">
        {p.url.replace(/^https?:\/\//, "")}
      </p>
      <p className="text-muted-foreground">
        {new Date(p.t).toLocaleString()}
      </p>
    </div>
  )
}

export function ScoreTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        Run at least two audits to see a trend.
      </div>
    )
  }

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="var(--chart-grid)"
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            width={36}
          />
          <Tooltip
            content={<TrendTooltip />}
            cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="var(--chart-accent)"
            strokeWidth={2}
            fill="url(#scoreFill)"
            dot={{ r: 3, fill: "var(--chart-accent)", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--chart-accent)", stroke: "var(--background)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
