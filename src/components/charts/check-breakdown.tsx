"use client"

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"

interface Segment {
  key: string
  name: string
  value: number
  color: string
  icon: typeof CheckCircle2
  className: string
}

export function CheckBreakdown({
  pass,
  warn,
  fail,
}: {
  pass: number
  warn: number
  fail: number
}) {
  const total = pass + warn + fail
  const segments: Segment[] = [
    { key: "pass", name: "Passed", value: pass, color: "var(--chart-pass)", icon: CheckCircle2, className: "text-emerald-500" },
    { key: "warn", name: "Warnings", value: warn, color: "var(--chart-warn)", icon: AlertTriangle, className: "text-amber-500" },
    { key: "fail", name: "Failed", value: fail, color: "var(--chart-fail)", icon: XCircle, className: "text-destructive" },
  ]
  const data = segments.filter((s) => s.value > 0)

  return (
    <div className="flex min-w-0 flex-wrap items-center justify-center gap-4">
      <div className="relative size-32 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={42}
              outerRadius={62}
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
              startAngle={90}
              endAngle={-270}
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.key} fill={s.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            checks
          </span>
        </div>
      </div>

      <ul className="min-w-[9.5rem] flex-1 space-y-2">
        {segments.map((s) => {
          const Icon = s.icon
          const pct = total ? Math.round((s.value / total) * 100) : 0
          return (
            <li key={s.key} className="flex items-center gap-2 text-sm">
              <Icon className={`size-4 shrink-0 ${s.className}`} />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{s.name}</span>
              <span className="shrink-0 font-medium tabular-nums">{s.value}</span>
              <span className="w-8 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                {pct}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
