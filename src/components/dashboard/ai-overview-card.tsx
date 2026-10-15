"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/lib/api/client"
import type { AiOverview } from "@/lib/api/ai-overview"
import { queryKeys } from "@/lib/query/keys"
import { cn } from "@/lib/utils"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowRight, ChevronDown, Loader2, RefreshCw, Sparkles } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

/** Bullets shown before the user expands (keeps the card ~2 lines tall). */
const COLLAPSED_BULLETS = 2

const message = (err: unknown) => errorMessage(err, "Could not write the overview.")

/** "Updated today" / "Updated yesterday" / "Updated 3 days ago" / "Updated 12 Aug". */
function updatedLabel(iso: string): string {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return ""
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const days = Math.round((startOf(new Date()) - startOf(then)) / 86_400_000)
  if (days <= 0) return "Updated today"
  if (days === 1) return "Updated yesterday"
  if (days < 7) return `Updated ${days} days ago`
  return `Updated ${then.toLocaleDateString(undefined, { day: "numeric", month: "short" })}`
}

/**
 * A short "AI overview" (3-4 sentences) for a page or section. `requestKey`
 * identifies what is summarised (cached per workspace via TanStack Query);
 * `load` does the call (`refresh` = regenerate). Summaries come from stored
 * data only and are also cached server-side, so repeat views are instant.
 */
export function AiOverviewCard({ requestKey, load, className, title = "AI overview", action }: {
  requestKey: string
  load: (refresh: boolean) => Promise<AiOverview>
  className?: string
  title?: string
  /** "Take action" link shown under the bullets — where to go to act on this. */
  action?: { label: string; href: string } | null
}) {
  const { activeWorkspace } = useDashboard()
  const qc = useQueryClient()
  const key = queryKeys.aiOverview(activeWorkspace?.id ?? "", requestKey)
  const query = useQuery({ queryKey: key, queryFn: () => load(false), staleTime: 5 * 60_000 })
  const regen = useMutation({
    mutationFn: () => load(true),
    onSuccess: (data: AiOverview) => qc.setQueryData(key, data),
  })

  const [expanded, setExpanded] = useState(false)
  const current = query.data ?? null
  const busy = regen.isPending
  const error = regen.isError ? message(regen.error) : query.isError ? message(query.error) : null
  const loading = query.isPending
  const regenerate = () => regen.mutate()

  const bullets = current?.bullets ?? []
  const canExpand = bullets.length > COLLAPSED_BULLETS
  const visibleBullets = expanded || !canExpand ? bullets : bullets.slice(0, COLLAPSED_BULLETS)
  // The action link + "written by" line are hidden while collapsed to keep it short.
  const showExtras = !canExpand || expanded

  return (
    <section aria-label={title} aria-busy={loading || busy}
      className={cn("ai-overview rounded-xl border px-4 py-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="size-4 text-primary" aria-hidden="true" /> {title}
        </h4>
        {current && (
          <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={regenerate}
            disabled={busy} title="Write it again from the latest data">
            {busy ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />} Regenerate
          </Button>
        )}
      </div>
      {loading ? (
        <div className="mt-2 space-y-2" role="status">
          <span className="sr-only">Writing the overview…</span>
          <div className="h-3 w-full animate-pulse rounded bg-primary/10" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-primary/10" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-primary/10" />
          <p className="ds-meta">Writing a summary from your data… the first time takes a few seconds.</p>
        </div>
      ) : error && !current ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
      ) : current ? (
        <>
          {bullets.length > 0 ? (
            <ul className={cn("mt-2 space-y-1.5 text-sm leading-relaxed", busy && "opacity-60")}>
              {visibleBullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={cn("mt-1.5 text-sm leading-relaxed", busy && "opacity-60")}>{current.summary}</p>
          )}

          {canExpand && (
            <button type="button" onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="mt-1.5 flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ChevronDown className={cn("size-3.5 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
              {expanded ? "Show less" : `Show ${bullets.length - COLLAPSED_BULLETS} more`}
            </button>
          )}

          {showExtras && action && (
            <Link href={action.href}
              className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              {action.label} <ArrowRight className="size-3.5" />
            </Link>
          )}
          {showExtras && (
            <p className="ds-meta mt-2">
              {/* "ai" = rewritten by gpt-4o-mini (numbers checked against the data); "rules" = plain draft:
                  no data yet, or the AI was unavailable / failed the number check. */}
              {current.source === "ai" ? "Written by AI from your latest data" : "Quick summary of your latest data"}
              {" · "}<span title={new Date(current.generated_at).toLocaleString()}>{updatedLabel(current.generated_at)}</span>
            </p>
          )}
        </>
      ) : null}
    </section>
  )
}
