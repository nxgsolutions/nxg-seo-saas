"use client"

import { cn } from "@/lib/utils"

export function Counter({
  label,
  value,
  min,
  max,
}: {
  label: string
  value: number
  min: number
  max: number
}) {
  const status =
    value === 0
      ? "muted"
      : value > max
        ? "over"
        : value < min
          ? "under"
          : "ok"
  const color =
    status === "ok"
      ? "text-emerald-600 dark:text-emerald-400"
      : status === "over"
        ? "text-destructive"
        : status === "under"
          ? "text-amber-600 dark:text-amber-400"
          : "text-muted-foreground"
  return (
    <span className={cn("text-xs tabular-nums", color)}>
      {label}: {value} {status === "over" ? "· too long" : status === "under" && value > 0 ? "· short" : status === "ok" ? "· good" : ""}
    </span>
  )
}
