"use client"

import * as React from "react"
import { KeyRound, Link2, MousePointer2 } from "lucide-react"

import { cn } from "@/lib/utils"

export interface FlowNode {
  name: string
  group: "master" | "keyword"
  cols: number
  note: string
  example: string
}
export interface FlowRelation {
  from: string // "child_table.col"
  to: string // "parent_table.col"
}

// Left→right dependency layers (parents left, children right).
const LAYERS: string[][] = [
  ["users", "workspaces"],
  ["workspace_members", "gsc_connections", "domains"],
  ["keyword_researches", "keywords", "keyword_clusters"],
  [
    "keyword_research_results",
    "keyword_metrics",
    "keyword_sources",
    "keyword_relations",
    "keyword_cluster_members",
  ],
]

const NODE_W = 190
const NODE_H = 52
const V_GAP = 20
const COL_GAP = 250
const MARGIN_X = 30
const MARGIN_Y = 36

interface Pos {
  x: number
  y: number
  cy: number
}

export function SchemaFlow({
  nodes,
  relations,
}: {
  nodes: FlowNode[]
  relations: FlowRelation[]
}) {
  const [hover, setHover] = React.useState<string | null>(null) // highlight (clears on leave)
  const [detail, setDetail] = React.useState<string | null>(null) // panel (persists)

  const meta = React.useMemo(() => {
    const m: Record<string, FlowNode> = {}
    nodes.forEach((n) => (m[n.name] = n))
    return m
  }, [nodes])

  const { pos, canvasW, canvasH } = React.useMemo(() => {
    const colHeights = LAYERS.map((l) => l.length * NODE_H + (l.length - 1) * V_GAP)
    const maxColH = Math.max(...colHeights)
    const p: Record<string, Pos> = {}
    LAYERS.forEach((layer, li) => {
      const colH = colHeights[li]
      const y0 = MARGIN_Y + (maxColH - colH) / 2
      layer.forEach((name, ni) => {
        const y = y0 + ni * (NODE_H + V_GAP)
        p[name] = { x: MARGIN_X + li * COL_GAP, y, cy: y + NODE_H / 2 }
      })
    })
    return {
      pos: p,
      canvasW: MARGIN_X * 2 + (LAYERS.length - 1) * COL_GAP + NODE_W,
      canvasH: MARGIN_Y * 2 + maxColH,
    }
  }, [])

  const edges = React.useMemo(() => {
    const seen = new Set<string>()
    const out: { from: string; to: string; self: boolean }[] = []
    for (const r of relations) {
      const from = r.from.split(".")[0]
      const to = r.to.split(".")[0]
      const key = `${from}->${to}`
      if (seen.has(key)) continue
      seen.add(key)
      if (pos[from] && pos[to]) out.push({ from, to, self: from === to })
    }
    return out
  }, [relations, pos])

  function path(from: string, to: string, self: boolean): string {
    const s = pos[from]
    const t = pos[to]
    if (self) {
      const x = s.x + NODE_W
      return `M ${x} ${s.cy - 10} C ${x + 46} ${s.cy - 26}, ${x + 46} ${s.cy + 26}, ${x} ${s.cy + 10}`
    }
    const x1 = s.x
    const y1 = s.cy
    const x2 = t.x + NODE_W
    const y2 = t.cy
    const dx = Math.max(40, Math.abs(x1 - x2) * 0.45)
    return `M ${x1} ${y1} C ${x1 - dx} ${y1}, ${x2 + dx} ${y2}, ${x2} ${y2}`
  }

  const enter = (name: string) => {
    setHover(name)
    setDetail(name)
  }
  const isLit = (from: string, to: string) => hover === null || hover === from || hover === to

  const active = detail ? meta[detail] : null

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* Diagram */}
      <div className="min-w-0 flex-1 overflow-x-auto rounded-xl border border-border bg-card p-2">
        <svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          className="min-w-[720px]"
          role="img"
          aria-label="Entity relationship flow diagram"
        >
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="var(--muted-foreground)" />
            </marker>
            <marker id="arrowLit" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" className="fill-violet-500" />
            </marker>
          </defs>

          {edges.map((e) => {
            const lit = isLit(e.from, e.to)
            const on = hover !== null && (hover === e.from || hover === e.to)
            return (
              <path
                key={`${e.from}-${e.to}`}
                d={path(e.from, e.to, e.self)}
                fill="none"
                className={cn(on && "stroke-violet-500")}
                stroke={on ? undefined : "var(--muted-foreground)"}
                strokeWidth={on ? 2 : 1.25}
                strokeOpacity={lit ? (on ? 0.9 : 0.35) : 0.06}
                markerEnd={on ? "url(#arrowLit)" : "url(#arrow)"}
              />
            )
          })}

          {LAYERS.flat().map((name) => {
            const p = pos[name]
            const n = meta[name]
            if (!p || !n) return null
            const kw = n.group === "keyword"
            const dim =
              hover !== null &&
              hover !== name &&
              !edges.some(
                (e) => (e.from === name && e.to === hover) || (e.to === name && e.from === hover),
              )
            return (
              <g
                key={name}
                transform={`translate(${p.x}, ${p.y})`}
                className="cursor-pointer"
                onMouseEnter={() => enter(name)}
                onMouseLeave={() => setHover(null)}
                opacity={dim ? 0.3 : 1}
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={10}
                  className={cn(
                    "transition-colors",
                    kw ? "fill-violet-500/10 stroke-violet-500/60" : "fill-muted stroke-border",
                  )}
                  strokeWidth={detail === name ? 2 : 1}
                />
                <rect width={4} height={NODE_H} rx={2} className={kw ? "fill-violet-500" : "fill-slate-400"} />
                <text x={16} y={21} className="fill-foreground" fontSize={13} fontWeight={600} fontFamily="monospace">
                  {name}
                </text>
                <text x={16} y={38} className="fill-muted-foreground" fontSize={11}>
                  {n.cols} columns
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Detail panel */}
      <aside className="w-full shrink-0 rounded-xl border border-border bg-card p-4 lg:w-72">
        {active ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {active.group === "keyword" ? (
                <KeyRound className="size-4 text-violet-500" />
              ) : (
                <Link2 className="size-4 text-slate-400" />
              )}
              <h3 className="font-mono text-sm font-semibold">{active.name}</h3>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Usage</p>
              <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{active.note}</p>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Example row</p>
              <pre className="mt-1 overflow-x-auto rounded-lg bg-muted/50 p-2.5 text-[11px] leading-relaxed">
                <code className="font-mono">{active.example}</code>
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-start justify-center gap-2 py-6 text-sm text-muted-foreground">
            <MousePointer2 className="size-5 text-muted-foreground/60" />
            <p>Hover any table to see what it&apos;s for and an example row.</p>
          </div>
        )}
      </aside>
    </div>
  )
}
