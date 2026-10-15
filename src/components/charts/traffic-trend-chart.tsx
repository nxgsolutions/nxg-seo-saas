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

export interface TrafficPoint {
  date: string // ISO yyyy-mm-dd
  clicks: number
  impressions: number
}

function fmtDay(iso: string): string {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function TrafficTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: TrafficPoint }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{fmtDay(p.date)}</p>
      <p className="text-muted-foreground">
        {Math.round(p.clicks).toLocaleString()} clicks ·{" "}
        {Math.round(p.impressions).toLocaleString()} impressions
      </p>
    </div>
  )
}

export function TrafficTrendChart({ data }: { data: TrafficPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Not enough data yet to plot a trend.
      </div>
    )
  }
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={fmtDay}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            minTickGap={28}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            width={36}
          />
          <Tooltip content={<TrafficTooltip />} cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="clicks"
            stroke="var(--chart-accent)"
            strokeWidth={2}
            fill="url(#trafficFill)"
            activeDot={{ r: 4, fill: "var(--chart-accent)", stroke: "var(--background)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
