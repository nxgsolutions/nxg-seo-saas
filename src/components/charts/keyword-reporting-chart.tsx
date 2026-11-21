"use client"

/**
 * Keyword Reporting — "Total Ranked Keywords" stacked bar chart. Each bar is a
 * reporting period; the three stacked segments are how many tracked keywords rank
 * on Page 1 (pos 1-10), Page 2 (11-20) and Page 3 (21-30). Derived from stored
 * SERP snapshots (no API calls). Missing periods render as empty bars.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import type { KeywordReporting } from "@/lib/api/rankings"

const BANDS = [
  { key: "page1", label: "Page 1 (1–10)", color: "#1baf7a" },
  { key: "page2", label: "Page 2 (11–20)", color: "#2a78d6" },
  { key: "page3", label: "Page 3 (21–30)", color: "#eda100" },
  { key: "page4plus", label: "Page 4+ (31–100)", color: "#6250d6" },
] as const

type BandKey = (typeof BANDS)[number]["key"]

function fmtDate(iso: string, freq: KeywordReporting["freq"]): string {
  const d = new Date(iso + "T00:00:00")
  if (freq === "monthly") return d.toLocaleDateString(undefined, { month: "short", year: "numeric" })
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

type Row = { date: string; page1: number; page2: number; page3: number; page4plus: number; total: number; not_ranked: number }

function ReportTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ payload: Row }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      {BANDS.map((b) => (
        <p key={b.key} className="flex items-center gap-1.5 text-muted-foreground">
          <span className="inline-block size-2 rounded-sm" style={{ background: b.color }} />
          <span className="text-popover-foreground">{b.label}</span>
          <span className="ml-auto tabular-nums">{r[b.key as BandKey]}</span>
        </p>
      ))}
      <p className="mt-1 flex items-center gap-1.5 border-t border-border pt-1 font-medium text-popover-foreground">
        Total ranked<span className="ml-auto tabular-nums">{r.total}</span>
      </p>
      {r.not_ranked > 0 ? (
        <p className="flex items-center gap-1.5 text-muted-foreground">
          Not in top 100<span className="ml-auto tabular-nums">{r.not_ranked}</span>
        </p>
      ) : null}
    </div>
  )
}

export function KeywordReportingChart({ data }: { data: KeywordReporting }) {
  const rows: Row[] = data.periods.map((p) => ({
    date: fmtDate(p.date, data.freq),
    page1: p.page1, page2: p.page2, page3: p.page3, page4plus: p.page4plus,
    total: p.total, not_ranked: p.not_ranked,
  }))
  const hasAny = data.periods.some((p) => p.total > 0 || p.not_ranked > 0)

  if (!hasAny) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-1 px-6 text-center">
        <p className="text-sm font-medium">No ranked-keyword history yet</p>
        <p className="text-sm text-muted-foreground">
          Counts appear here as this site&apos;s keywords are tracked over time.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} margin={{ top: 12, right: 12, bottom: 0, left: -8 }}>
            <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
              minTickGap={16}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--foreground)", fontSize: 11 }}
              width={34}
            />
            <Tooltip content={<ReportTooltip />} cursor={{ fill: "var(--chart-grid)", opacity: 0.25 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {BANDS.map((b) => (
              <Bar
                key={b.key}
                dataKey={b.key}
                name={b.label}
                stackId="pages"
                fill={b.color}
                maxBarSize={48}
                isAnimationActive={false}
                radius={b.key === "page4plus" ? [3, 3, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Tracked keywords by Google result page over time · bar height = keywords ranking in the top 100.
      </p>
    </div>
  )
}
