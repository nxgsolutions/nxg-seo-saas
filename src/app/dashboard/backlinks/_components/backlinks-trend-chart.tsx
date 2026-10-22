"use client"

import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"

import type { TrendPoint } from "@/lib/api/backlinks"

const fmtDate = (s: string) => new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric" })

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: TrendPoint }> }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{fmtDate(p.fetched_at)}</p>
      <p className="mt-0.5 text-muted-foreground">Referring domains: {p.referring_domains?.toLocaleString() ?? "—"}</p>
      <p className="text-muted-foreground">Authority: {p.rank ?? "—"}</p>
    </div>
  )
}

/** Referring domains (left axis) and authority 0–100 (right axis) over stored fetches. */
export function BacklinksTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length < 2) {
    return (
      <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">
        Refresh again later to see how your backlinks grow over time.
      </div>
    )
  }
  const rows = data.map((p) => ({ ...p, label: fmtDate(p.fetched_at) }))
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--foreground)", fontSize: 11 }} minTickGap={24} />
          <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: "var(--foreground)", fontSize: 11 }} width={44} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} ticks={[0, 50, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={28} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }} />
          <Line yAxisId="left" type="monotone" dataKey="referring_domains" name="Referring domains" stroke="var(--chart-accent)" strokeWidth={2} dot={{ r: 3, fill: "var(--chart-accent)", strokeWidth: 0 }} />
          <Line yAxisId="right" type="monotone" dataKey="rank" name="Authority" stroke="var(--muted-foreground)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
