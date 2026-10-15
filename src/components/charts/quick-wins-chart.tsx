"use client"

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts"
import { logTicks } from "./trend-utils"

export interface QuickWinPoint {
  keyword: string
  position: number
  impressions: number
  volume: number | null
  opportunity: number
}

const TOP_N = 5
const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n)
const short = (s: string) => (s.length > 24 ? `${s.slice(0, 23)}…` : s)

interface DotProps { cx?: number; cy?: number; payload?: QuickWinPoint }

function renderDot({ cx, cy, payload }: DotProps, top: Set<string>) {
  if (cx == null || cy == null || !payload) return <g />
  const hot = top.has(payload.keyword)
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      <circle cx={cx} cy={cy} r={hot ? 6 : 4.5} fill={hot ? "var(--viz-accent)" : "var(--viz-muted)"}
        stroke="var(--card)" strokeWidth={2} />
      {/* Selective direct labels: only the top opportunities, in a text token. */}
      {hot && (
        <text x={cx + 9} y={cy + 4} fontSize={11} fill="var(--muted-foreground)">{short(payload.keyword)}</text>
      )}
    </g>
  )
}

/**
 * Quick wins map — your position (#4-20) vs Search Console impressions (log).
 * Emphasis: the top opportunities in the accent (direct-labelled), the rest gray.
 */
export function QuickWinsChart({ points }: { points: QuickWinPoint[] }) {
  const top = new Set([...points].sort((a, b) => b.opportunity - a.opportunity).slice(0, TOP_N).map((p) => p.keyword))
  const plotted = points.filter((p) => p.impressions > 0)
  const yTicks = logTicks(1, Math.max(10, ...plotted.map((p) => p.impressions)))

  return (
    <figure className="space-y-2">
      <figcaption className="text-xs text-muted-foreground">
        <span className="mr-1.5 inline-block size-2.5 rounded-full align-middle" style={{ background: "var(--viz-accent)" }} />
        Top {Math.min(TOP_N, plotted.length)} by opportunity (labelled) · further left = closer to the top · higher = more people already see you
      </figcaption>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 120, bottom: 18, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeWidth={1} />
            <XAxis type="number" dataKey="position" name="Position" domain={[3.5, 20.5]} ticks={[4, 6, 8, 10, 12, 14, 16, 18, 20]}
              tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--chart-grid)"
              label={{ value: "Your average position", position: "insideBottom", offset: -12, fontSize: 11, fill: "var(--foreground)" }} />
            <YAxis type="number" dataKey="impressions" name="Impressions" scale="log" domain={[1, yTicks[yTicks.length - 1]]} ticks={yTicks} allowDataOverflow
              tickFormatter={compact} tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--chart-grid)" width={44}
              label={{ value: "Impressions (log)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "var(--foreground)" }} />
            <Tooltip cursor={false} content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as QuickWinPoint | undefined) : undefined
              if (!p) return null
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="max-w-[240px] truncate font-medium text-popover-foreground">{p.keyword}</p>
                  <p className="tabular-nums"><strong>#{p.position.toFixed(1)}</strong> <span className="text-muted-foreground">avg position</span></p>
                  <p className="tabular-nums"><strong>{p.impressions.toLocaleString()}</strong> <span className="text-muted-foreground">impressions</span></p>
                  {p.volume != null && <p className="tabular-nums"><strong>{p.volume.toLocaleString()}</strong> <span className="text-muted-foreground">searches / mo</span></p>}
                  <p className="tabular-nums"><strong>{Math.round(p.opportunity).toLocaleString()}</strong> <span className="text-muted-foreground">opportunity</span></p>
                </div>
              )
            }} />
            <Scatter data={plotted} shape={(props: DotProps) => renderDot(props, top)} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
