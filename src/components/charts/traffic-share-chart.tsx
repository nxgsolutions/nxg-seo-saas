"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export interface ShareSlice {
  name: string
  value: number
  color: string
}

function ShareTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: Array<{ payload: ShareSlice }>
  total: number
}) {
  if (!active || !payload?.length) return null
  const s = payload[0].payload
  const pct = total ? Math.round((s.value / total) * 100) : 0
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{s.name}</p>
      <p className="text-muted-foreground">
        {Math.round(s.value).toLocaleString()} est. visits · {pct}%
      </p>
    </div>
  )
}

export function TrafficShareChart({ data }: { data: ShareSlice[] }) {
  const total = data.reduce((s, x) => s + x.value, 0)
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={52}
            outerRadius={82}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            isAnimationActive={false}
          >
            {data.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
          <Tooltip content={<ShareTooltip total={total} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
