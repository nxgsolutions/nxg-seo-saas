"use client"

import type { ChangeKind, PageChange } from "@/lib/api/pages"
import { cn } from "@/lib/utils"
import { ArrowRight } from "lucide-react"

/** Shared by Page history and Page Audit: one detected page change, "before → after". */

export const KIND_LABEL: Record<ChangeKind, string> = {
  meta: "Title & meta",
  content: "Content",
  media: "Images",
  links: "Links",
  technical: "Technical",
  checks: "Audit checks",
}

/** "before → after" text for a change value. */
export function valueText(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "boolean") return v ? "Yes" : "No"
  if (typeof v === "number") return v.toLocaleString()
  if (Array.isArray(v)) return v.join(" · ")
  return String(v)
}

/** A one-line description for changes that aren't simple before → after values. */
export function changeSummary(c: PageChange): string | null {
  if (c.field === "body_text") return `About ${c.after}% of the page text changed`
  if (c.field === "headings_added" || c.field === "fixed" || c.field === "regressed") return valueText(c.after)
  if (c.field === "headings_removed") return valueText(c.before)
  return null
}

export function ChangeRow({ c }: { c: PageChange }) {
  const summary = changeSummary(c)
  const tone = c.field === "fixed" ? "text-emerald-700 dark:text-emerald-400" : c.field === "regressed" ? "text-destructive" : ""
  return (
    <li className="grid gap-0.5 py-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-3">
      <div className="flex items-center gap-1.5">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{KIND_LABEL[c.kind] ?? c.kind}</span>
      </div>
      <div className="min-w-0 text-sm">
        <p className={cn("font-medium", tone)}>{c.label}</p>
        {summary !== null ? (
          <p className="break-words text-xs text-muted-foreground">{summary}</p>
        ) : (
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="max-w-full break-words rounded bg-destructive/5 px-1.5 py-0.5 text-muted-foreground line-through decoration-destructive/40">{valueText(c.before)}</span>
            <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
            <span className="max-w-full break-words rounded bg-emerald-500/10 px-1.5 py-0.5 text-foreground">{valueText(c.after)}</span>
          </div>
        )}
      </div>
    </li>
  )
}


/** A compact list of changes (e.g. "since the last check" on an audit). */
export function ChangeList({ changes, className }: { changes: PageChange[]; className?: string }) {
  return <ul className={cn("divide-y", className)}>{changes.map((c, i) => <ChangeRow key={`${c.field}-${i}`} c={c} />)}</ul>
}
