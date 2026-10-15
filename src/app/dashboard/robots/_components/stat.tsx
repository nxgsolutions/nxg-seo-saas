"use client"

import { cn } from "@/lib/utils";

export function Stat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium", mono && "truncate font-mono text-xs")}>{value}</span>
    </div>
  )
}
