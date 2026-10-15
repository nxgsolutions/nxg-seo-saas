"use client"

/**
 * Single-metric area trend (organic traffic / ranking keywords / SERP
 * opportunities) for the Opportunity Research page.
 */
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface OppTrendPoint {
  label: string
  value: number
}

function compact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return `${Math.round(n)}`
}

export function OpportunityTrendChart({
  data,
  label = "Value",
}: {
  data: OppTrendPoint[]
  label?: string
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -6 }}>
          <defs>
            <linearGradient id="oppFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--chart-accent)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            minTickGap={20}
          />
          <YAxis
            tickFormatter={compact}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            width={44}
          />
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--popover-foreground)" }}
            formatter={(v) => [Number(v).toLocaleString(), label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-accent)"
            strokeWidth={2}
            fill="url(#oppFill)"
            dot={false}
            activeDot={{ r: 4, stroke: "var(--background)", strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
