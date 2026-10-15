"use client"

import type { CheckStatus, ContentCheck } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react"
import * as React from "react"
import { STATUS_STYLE } from "../_lib/content-optimization-helpers"

const ICON: Record<CheckStatus, typeof CheckCircle2> = { pass: CheckCircle2, warn: AlertTriangle, fail: XCircle }
const ORDER: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 }

/** The rule-based checklist, grouped, issues first. */
export function ChecklistPanel({ checks }: { checks: ContentCheck[] }) {
  const [issuesOnly, setIssuesOnly] = React.useState(false)
  const groups = React.useMemo(() => {
    const map = new Map<string, ContentCheck[]>()
    for (const c of checks) map.set(c.group, [...(map.get(c.group) ?? []), c])
    return [...map.entries()].map(([group, items]) => ({
      group,
      items: [...items].sort((a, b) => ORDER[a.status] - ORDER[b.status] || b.weight - a.weight),
      passed: items.filter((i) => i.status === "pass").length,
    }))
  }, [checks])
  const issues = checks.filter((c) => c.status !== "pass").length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {issues ? `${issues} of ${checks.length} checks need attention. Fix the red ones first — they weigh the most.` : "Every check passes."}
        </p>
        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium">
          <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)}
            className="size-3.5 cursor-pointer accent-[var(--primary)]" />
          Show issues only
        </label>
      </div>

      <div className="grid gap-4 2xl:grid-cols-2">
        {groups.map(({ group, items, passed }) => {
          const shown = issuesOnly ? items.filter((i) => i.status !== "pass") : items
          if (issuesOnly && shown.length === 0) return null
          return (
            <section key={group} className="rounded-xl border bg-card" aria-label={group}>
              <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
                <h3 className="text-sm font-semibold">{group}</h3>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(passed / items.length) * 100}%` }} />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{passed}/{items.length}</span>
                </div>
              </header>
              <ul className="divide-y">
                {shown.map((c) => {
                  const Icon = ICON[c.status]
                  const st = STATUS_STYLE[c.status]
                  return (
                    <li key={c.id} className="flex gap-3 px-4 py-2.5">
                      <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full", st.bg, st.text)}>
                        <Icon className="size-3.5" aria-label={st.label} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                          <span className="text-sm font-medium">{c.label}</span>
                          <span className="text-xs tabular-nums text-muted-foreground">{c.value}</span>
                        </div>
                        {c.tip && <p className="mt-0.5 text-xs text-muted-foreground">{c.tip}</p>}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
