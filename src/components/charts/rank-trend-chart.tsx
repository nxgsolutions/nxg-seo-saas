"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface RankPoint {
  label: string
  position: number | null
}

function RankTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: RankPoint }>
}) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">
        {p.position === null ? "Not ranking" : `Position ${p.position}`}
      </p>
      <p className="text-muted-foreground">{p.label}</p>
    </div>
  )
}

export function RankTrendChart({ data }: { data: RankPoint[] }) {
  const positions = data.map((d) => d.position).filter((p): p is number => p !== null)
  if (positions.length < 2) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
        Record at least two positions to see the trend.
      </div>
    )
  }
  const maxPos = Math.max(...positions)

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis
            reversed
            domain={[1, Math.max(10, maxPos)]}
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            width={32}
          />
          <Tooltip content={<RankTooltip />} cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }} />
          <Line
            type="monotone"
            dataKey="position"
            stroke="var(--chart-accent)"
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 3, fill: "var(--chart-accent)", strokeWidth: 0 }}
            activeDot={{ r: 5, fill: "var(--chart-accent)", stroke: "var(--background)", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
