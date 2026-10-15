"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export interface DonutSlice {
  name: string
  value: number
  color: string
}

function DonutTooltip({ active, payload, total }: {
  active?: boolean
  payload?: Array<{ payload: DonutSlice }>
  total: number
}) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  const pct = total ? Math.round((s.value / total) * 100) : 0
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{s.name}</p>
      <p className="text-muted-foreground">{s.value.toLocaleString()} pages · {pct}%</p>
    </div>
  )
}

/** Ring chart for the discovered-pages breakdown, with a centered total. */
export function PageTypeDonut({ data, centerLabel = "Pages" }: { data: DonutSlice[]; centerLabel?: string }) {
  const total = data.reduce((s, x) => s + x.value, 0)
  return (
    <div className="relative h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84}
            paddingAngle={2} stroke="var(--card)" strokeWidth={2} isAnimationActive={false}>
            {data.map((s) => <Cell key={s.name} fill={s.color} />)}
          </Pie>
          <Tooltip content={<DonutTooltip total={total} />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{total.toLocaleString()}</span>
        <span className="text-xs text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  )
}
