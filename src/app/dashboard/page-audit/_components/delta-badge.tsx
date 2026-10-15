"use client"

import {
  Minus,
  TrendingDown,
  TrendingUp
} from "lucide-react"

export function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
        <Minus className="size-3" /> 0
      </span>
    )
  }
  const up = delta > 0
  return (
    <span
      className={
        "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums " +
        (up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")
      }
      title="Change vs previous audit of this URL"
    >
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {up ? "+" : ""}
      {delta}
    </span>
  )
}
