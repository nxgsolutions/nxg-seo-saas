"use client"

import { cn } from "@/lib/utils";

export function SummaryTile({ label, value, className }: { label: string; value: number; className?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-center">
      <p className={cn("text-2xl font-semibold tabular-nums", className)}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}
