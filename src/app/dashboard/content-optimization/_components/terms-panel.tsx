"use client"

import type { TermRow } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { Tags } from "lucide-react"
import { CopyButton } from "./copy-button"

const GROUPS: { status: TermRow["status"]; title: string; hint: string; chip: string; dot: string }[] = [
  { status: "missing", title: "Missing", hint: "Most top pages use these — your page doesn't.", chip: "border-destructive/25 bg-destructive/5", dot: "bg-destructive" },
  { status: "low", title: "Underused", hint: "You mention these far less than the top pages.", chip: "border-amber-500/30 bg-amber-500/5", dot: "bg-amber-500" },
  { status: "ok", title: "Covered", hint: "You use these about as much as the top pages.", chip: "border-emerald-500/25 bg-emerald-500/5", dot: "bg-emerald-500" },
]

/** Terms most top-ranking pages use, and how your page covers them. */
export function TermsPanel({ terms, pages }: { terms: TermRow[]; pages: number }) {
  if (terms.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
        <Tags className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No term comparison yet</p>
        <p className="max-w-md text-sm text-muted-foreground">Terms come from the top-ranking pages — add a target keyword or competitor URLs.</p>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Words and phrases used by at least 40% of the {pages} top pages. Work the missing ones in naturally where they fit the topic.
      </p>
      {GROUPS.map((g) => {
        const items = terms.filter((t) => t.status === g.status)
        if (!items.length) return null
        return (
          <section key={g.status} className="rounded-xl border bg-card p-4" aria-label={g.title}>
            <header className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <span className={cn("size-2 rounded-full", g.dot)} aria-hidden="true" /> {g.title}
                  <span className="text-xs font-normal tabular-nums text-muted-foreground">{items.length}</span>
                </h3>
                <p className="text-xs text-muted-foreground">{g.hint}</p>
              </div>
              {g.status !== "ok" && <CopyButton text={items.map((t) => t.term).join(", ")} label="Copy all" />}
            </header>
            <ul className="flex flex-wrap gap-1.5">
              {items.map((t) => (
                <li key={t.term} title={`Used by ${t.competitors} of ${pages} top pages · about ${t.avg_count}× each · ${t.your_count}× on your page`}
                  className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs", g.chip)}>
                  <span className="font-medium">{t.term}</span>
                  <span className="tabular-nums text-muted-foreground">{t.competitors}/{pages}</span>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
