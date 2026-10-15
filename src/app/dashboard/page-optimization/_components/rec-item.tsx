"use client"

import { type OptimizationItem } from "@/lib/api/optimization"
import { cn } from "@/lib/utils"
import {
  Sparkles,
  Wrench
} from "lucide-react"
import { effortLabel, impactStyle } from "../_lib/page-optimization-helpers"

export function RecItem({ item }: { item: OptimizationItem }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", impactStyle(item.impact))}>
          {item.impact} impact
        </span>
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          {item.category}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <Wrench className="size-3" /> {effortLabel(item.effort)}
        </span>
      </div>
      <p className="mt-2 text-sm font-medium">{item.title}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">{item.current}</p>
      <div className="mt-2 flex items-start gap-2 rounded-md bg-primary/5 p-2.5 text-sm">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>{item.fix}</span>
      </div>
    </div>
  )
}
