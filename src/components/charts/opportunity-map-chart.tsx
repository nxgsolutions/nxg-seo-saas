"use client"

import {
  CartesianGrid, ReferenceArea, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from "recharts"
import { logTicks } from "./trend-utils"

export interface OpportunityPoint {
  id: string
  keyword: string
  volume: number
  difficulty: number
  cpc: number | null
}

const SWEET_MAX_KD = 30
const SWEET_MIN_VOLUME = 100

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K` : String(n)

export const isSweetSpot = (p: OpportunityPoint) => p.difficulty <= SWEET_MAX_KD && p.volume >= SWEET_MIN_VOLUME

interface DotProps { cx?: number; cy?: number; payload?: OpportunityPoint }

function renderDot({ cx, cy, payload }: DotProps, selectedId?: string | null, onSelect?: (id: string) => void) {
  if (cx == null || cy == null || !payload) return <g />
  const hot = isSweetSpot(payload)
  const selected = payload.id === selectedId
  return (
    <g style={{ cursor: onSelect ? "pointer" : undefined }} onClick={() => onSelect?.(payload.id)}>
      {/* 24px transparent hit target around a 10px mark */}
      <circle cx={cx} cy={cy} r={12} fill="transparent" />
      <circle cx={cx} cy={cy} r={selected ? 7 : 5}
        fill={hot ? "var(--viz-accent)" : "var(--viz-muted)"}
        stroke="var(--card)" strokeWidth={2} />
      {selected && <circle cx={cx} cy={cy} r={10} fill="none" stroke="var(--viz-accent)" strokeWidth={1.5} />}
    </g>
  )
}

/**
 * Opportunity map — search volume (log x) vs estimated difficulty (y).
 * Emphasis form: the "sweet spot" (easy + real demand) in the accent, the rest
 * in the de-emphasis gray. Click a dot to select that keyword.
 */
export function OpportunityMapChart({ points, skipped, selectedId, onSelect }: {
  points: OpportunityPoint[]
  /** keywords without volume/difficulty (not plottable on a log axis) */
  skipped: number
  selectedId?: string | null
  onSelect?: (id: string) => void
}) {
  const maxVolume = Math.max(...points.map((p) => p.volume), SWEET_MIN_VOLUME * 10)
  const xTicks = logTicks(10, maxVolume)
  const sweet = points.filter(isSweetSpot).length

  return (
    <figure className="space-y-2">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted-foreground">
        <span>
          <span className="mr-1.5 inline-block size-2.5 rounded-full align-middle" style={{ background: "var(--viz-accent)" }} />
          <strong className="text-foreground">{sweet}</strong> in the sweet spot — difficulty ≤ {SWEET_MAX_KD}, volume ≥ {SWEET_MIN_VOLUME}
        </span>
        <span>{points.length} plotted{skipped ? ` · ${skipped} without volume data not shown` : ""} · click a dot to open it</span>
      </figcaption>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, bottom: 18, left: 0 }}>
            <CartesianGrid stroke="var(--chart-grid)" strokeWidth={1} />
            <ReferenceArea x1={SWEET_MIN_VOLUME} x2={maxVolume} y1={0} y2={SWEET_MAX_KD}
              fill="var(--viz-zone)" stroke="none" ifOverflow="extendDomain" />
            <XAxis type="number" dataKey="volume" name="Volume" scale="log" domain={[10, xTicks[xTicks.length - 1]]} ticks={xTicks} allowDataOverflow
              tickFormatter={compact} tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--chart-grid)"
              label={{ value: "Monthly search volume (log)", position: "insideBottom", offset: -12, fontSize: 11, fill: "var(--foreground)" }} />
            <YAxis type="number" dataKey="difficulty" name="Difficulty" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--chart-grid)" width={40}
              label={{ value: "Est. difficulty", angle: -90, position: "insideLeft", offset: 12, fontSize: 11, fill: "var(--foreground)" }} />
            <Tooltip cursor={false} content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as OpportunityPoint | undefined) : undefined
              if (!p) return null
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="max-w-[220px] truncate font-medium text-popover-foreground">{p.keyword}</p>
                  <p className="tabular-nums"><strong>{p.volume.toLocaleString()}</strong> <span className="text-muted-foreground">searches / mo</span></p>
                  <p className="tabular-nums"><strong>{Math.round(p.difficulty)}</strong> <span className="text-muted-foreground">est. difficulty</span></p>
                  {p.cpc != null && <p className="tabular-nums"><strong>{p.cpc.toFixed(2)}</strong> <span className="text-muted-foreground">CPC</span></p>}
                  {isSweetSpot(p) && <p className="mt-1 font-medium text-primary">Sweet spot</p>}
                </div>
              )
            }} />
            <Scatter data={points} shape={(props: DotProps) => renderDot(props, selectedId, onSelect)} isAnimationActive={false} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
