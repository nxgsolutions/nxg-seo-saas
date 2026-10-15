"use client"

import type { AuditDetail } from "@/lib/api/audits"
import { cn } from "@/lib/utils"
import { CheckCircle2, Wrench } from "lucide-react"

/** What to fix, most important first, each with the evidence and how to fix it. */
export function PrioritizedFixes({ result }: { result: AuditDetail }) {
  const findings = [...(result.metrics.findings ?? [])].sort((a, b) => (a.priority === "High" ? 0 : 1) - (b.priority === "High" ? 0 : 1))
  if (findings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
        <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
        <p className="text-sm font-medium">Nothing to fix in the page&apos;s HTML</p>
        <p className="max-w-md text-sm text-muted-foreground">Review the images and speed tabs, which are measured separately.</p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {result.metrics.page_type ? `${result.metrics.page_type} · ` : ""}Make the changes in your CMS or page template, then run the audit again — Page history will show what changed.
      </p>
      <ol className="space-y-2.5">
        {findings.map((f, i) => (
          <li key={`${f.id}-${i}`} className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold tabular-nums text-primary">{i + 1}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                f.priority === "High" ? "bg-destructive/10 text-destructive" : "bg-amber-500/12 text-amber-700 dark:text-amber-400")}>
                {f.priority}
              </span>
              <h3 className="text-sm font-semibold">{f.label}</h3>
            </div>
            <p className="mt-1.5 break-words text-sm text-muted-foreground">{f.evidence}</p>
            <p className="mt-2 flex gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <Wrench className="mt-0.5 size-4 shrink-0 text-primary" />
              <span><span className="font-medium">How to fix: </span>{f.fix}</span>
            </p>
          </li>
        ))}
      </ol>
    </div>
  )
}
