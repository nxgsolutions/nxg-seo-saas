"use client"

/**
 * Static competitor comparison visuals for the Competitive Strategy page.
 *
 * Two charts, both driven by hardcoded demo data (see competitive-strategy-static.tsx):
 *  - CompetitorTrafficChart: estimated organic traffic over time, one area per domain.
 *  - CompetitorShareDonut: each domain's share of total estimated traffic.
 *
 * Colors come from the dashboard chart tokens so both themes stay on-brand.
 */
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface TrafficSeries {
  /** Data key on each row (no dots — recharts reads dotted keys as nested paths). */
  key: string
  /** Domain shown in the tooltip, e.g. "competitor1.com". */
  label: string
  color: string
}

export interface TrafficRow {
  /** X-axis label, e.g. "Mar 26". */
  month: string
  [domain: string]: string | number
}

export interface ShareSlice {
  name: string
  /** Percentage (0–100); already computed for the demo. */
  value: number
  color: string
}

/** 12.3M / 840K / 0 — compact, tabular-friendly. */
function fmtTraffic(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`
  return `${n}`
}

function TrafficTooltip({
  active,
  label,
  payload,
  series,
}: {
  active?: boolean
  label?: string
  payload?: Array<{ dataKey: string; value: number }>
  series: TrafficSeries[]
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[11rem] rounded-lg border border-border bg-popover px-3 py-2.5 text-xs shadow-md">
      <p className="mb-1.5 font-semibold text-popover-foreground">{label}</p>
      <ul className="space-y-1">
        {series.map((s) => {
          const row = payload.find((p) => p.dataKey === s.key)
          return (
            <li key={s.key} className="flex items-center justify-between gap-6">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="size-2 rounded-full" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-semibold tabular-nums text-popover-foreground">
                {fmtTraffic(row ? Number(row.value) : 0)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function CompetitorTrafficChart({
  rows,
  series,
  highlightMonth,
}: {
  rows: TrafficRow[]
  series: TrafficSeries[]
  /** Optional month label to mark with a dashed reference line. */
  highlightMonth?: string
}) {
  return (
    <div className="h-[20rem] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 10, right: 12, bottom: 0, left: -8 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.01} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            minTickGap={8}
          />
          <YAxis
            tickFormatter={(v) => fmtTraffic(Number(v))}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            width={48}
          />
          {highlightMonth && (
            <ReferenceLine
              x={highlightMonth}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
          )}
          <Tooltip
            content={<TrafficTooltip series={series} />}
            cursor={{ stroke: "var(--chart-grid)", strokeWidth: 1 }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#fill-${s.key})`}
              connectNulls
              dot={{ r: 2.5, strokeWidth: 0, fill: s.color }}
              activeDot={{ r: 4.5, fill: s.color, stroke: "var(--background)", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export function CompetitorShareDonut({
  data,
  centerLabel,
}: {
  data: ShareSlice[]
  centerLabel: string
}) {
  const total = data.reduce((s, x) => s + x.value, 0)
  return (
    <div className="relative mx-auto h-52 w-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={62}
            outerRadius={92}
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {data.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const s = payload[0].payload as ShareSlice
              const pct = total ? (s.value / total) * 100 : 0
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium text-popover-foreground">{s.name}</p>
                  <p className="text-muted-foreground">{pct.toFixed(2)}% share</p>
                </div>
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-base font-semibold text-foreground">{centerLabel}</span>
      </div>
    </div>
  )
}
