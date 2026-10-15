"use client"

import { cn } from "@/lib/utils";
import {
  Minus,
  TrendingDown,
  TrendingUp
} from "lucide-react";

export function PositionDelta({ latest, previous }: { latest: number | null; previous: number | null }) {
  if (latest === null || previous === null) return null
  const change = previous - latest // positive = moved up (better)
  if (change === 0) return <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground"><Minus className="size-3" /></span>
  const up = change > 0
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums", up ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")} title="Change vs previous entry">
      {up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      {Math.abs(change)}
    </span>
  )
}
