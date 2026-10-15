"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { usePageInsight } from "@/hooks/api/use-action-plan"
import { errorMessage } from "@/lib/api/client"
import { type ActionItem } from "@/lib/api/opportunity"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowUpRight, CheckCircle2, CircleHelp, ExternalLink, Lightbulb, XCircle } from "lucide-react"
import * as React from "react"

const PRIORITY: Record<"high" | "medium" | "low", { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-500/10 text-red-700 dark:text-red-400" },
  medium: { label: "Medium", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
  low: { label: "Low", className: "bg-muted text-muted-foreground" },
}

/**
 * Your page details + content suggestions for one action: on-page checks for
 * the keyword, how the competitor pages compare, and prioritized fixes.
 * Fetches pages live (free) — can take a few seconds.
 */
export function InsightPanel({ wid, did, item }: { wid: string; did: string; item: ActionItem }) {
  // Cached per keyword/page (TanStack Query) — reopening Details is instant.
  const query = usePageInsight(wid, did, item)

  if (query.isPending) {
    return (
      <div className="grid gap-4 py-3 lg:grid-cols-2" role="status" aria-busy="true">
        <span className="sr-only">Checking your page and the competitor pages…</span>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-4 w-5/6" />)}
          <p className="ds-meta">Checking your page and the competitor pages… (a few seconds)</p>
        </div>
      </div>
    )
  }
  if (query.isError) {
    return <p className="py-3 text-sm text-destructive">{errorMessage(query.error, "Could not analyse the pages.")}</p>
  }
  const d = query.data
  const yours = d.your_page
  const passed = d.checks.filter((c) => c.ok).length

  return (
    <div className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      {/* Suggestions first — the "what to do" */}
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary"><Lightbulb className="size-3.5" /></span>
          <h4 className="text-sm font-semibold">How to win this keyword</h4>
        </div>
        {d.suggestions.length === 0 ? (
          <p className="ds-meta mt-3">No gaps found — this page already covers the basics for “{d.keyword}”.</p>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {d.suggestions.map((s, n) => (
              <li key={n} className="flex items-start gap-2.5 text-sm">
                <span className={cn("mt-0.5 inline-flex min-w-[52px] shrink-0 justify-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold", PRIORITY[s.priority].className)}>
                  {PRIORITY[s.priority].label}
                </span>
                <span className="min-w-0"><span className="font-medium">{s.area}:</span> <span className="text-muted-foreground">{s.text}</span></span>
              </li>
            ))}
          </ul>
        )}
        {d.questions.length > 0 && (
          <div className="mt-4 border-t border-border pt-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground"><CircleHelp className="size-3.5 text-primary" /> Questions people ask</p>
            <ul className="mt-2 space-y-1.5">
              {d.questions.map((q) => (
                <li key={q} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/50" />{q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3">
        {/* Your page */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold">Your page</h4>
            {yours?.ok && d.checks.length > 0 && (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                passed === d.checks.length ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                {passed}/{d.checks.length} checks pass
              </span>
            )}
          </div>
          {!yours ? (
            <p className="ds-meta mt-2">No existing page matches this keyword — create a new one.</p>
          ) : !yours.ok ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-amber-700 dark:text-amber-400">
              <AlertTriangle className="size-4" /> Couldn&apos;t load {yours.url} right now — try again shortly.
            </p>
          ) : (
            <>
              <a href={yours.url} target="_blank" rel="noopener noreferrer"
                className="mt-1 flex items-center gap-1 truncate text-xs text-primary hover:underline">
                <span className="truncate">{yours.url}</span><ExternalLink className="size-3 shrink-0" />
              </a>
              <ul className="mt-3 space-y-2">
                {d.checks.map((c) => (
                  <li key={c.label} className="flex items-start gap-2 text-sm">
                    {c.ok
                      ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-label="Pass" />
                      : <XCircle className="mt-0.5 size-4 shrink-0 text-red-500" aria-label="Fix" />}
                    <span className="min-w-0"><span className="font-medium">{c.label}</span>
                      <span className="block truncate text-xs text-muted-foreground" title={c.value}>{c.value}</span></span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Competitor pages */}
        {d.competitor_pages.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <h4 className="text-sm font-semibold">Competitor pages ranking for this</h4>
            <ul className="mt-2.5 space-y-2.5">
              {d.competitor_pages.map((c) => (
                <li key={c.url} className="text-sm">
                  <a href={c.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 truncate font-medium text-primary hover:underline">
                    <span className="truncate">{c.ok && c.title ? c.title : c.url}</span><ArrowUpRight className="size-3.5 shrink-0" />
                  </a>
                  <span className="ds-meta">
                    {c.ok ? `${(c.word_count ?? 0).toLocaleString()} words · ${c.headings.length} sections` : "couldn't load"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
