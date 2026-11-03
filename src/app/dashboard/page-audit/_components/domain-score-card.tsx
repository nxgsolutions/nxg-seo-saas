"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, daysUntil } from "@/lib/utils"
import { FormattedDate } from "@/components/ui/formatted-date"
import {
  ArrowRight,
  Gauge,
  Globe,
  Loader2,
  RefreshCw,
  ScanSearch,
} from "lucide-react"
import Link from "next/link"
import { useSiteScoreScreen } from "@/app/dashboard/site-score/_hooks/use-site-score-screen"
import {
  band,
  scoreBg,
} from "@/app/dashboard/site-score/_lib/site-score-helpers"

const DETAILS_HREF = "/dashboard/site-score"

/**
 * Slim SEO Score banner for the Page Audit page: just the total score
 * (click it for the full breakdown) plus the full-site run button and live
 * progress. The detailed breakdown lives on the Site Score page.
 */
export function DomainScoreCard() {
  const s = useSiteScoreScreen()
  const { latest, running, job, jobError, error, canRefetch, nextRefetchAt } = s
  const b = latest ? band(latest.overall) : null
  const waitDays = daysUntil(nextRefetchAt)

  const RunButton = (
    <Button
      onClick={s.start}
      disabled={running || !s.domainId || (Boolean(latest) && !canRefetch)}
    >
      {running ? (
        <>
          <Loader2 className="size-4 animate-spin" /> Scoring…
        </>
      ) : !latest ? (
        <>
          <Gauge className="size-4" /> Score every page
        </>
      ) : canRefetch ? (
        <>
          <RefreshCw className="size-4" /> Re-score site
        </>
      ) : (
        <>
          <RefreshCw className="size-4" />{" "}
          {waitDays
            ? `Next refresh in ${waitDays} day${waitDays > 1 ? "s" : ""}`
            : "Up to date"}
        </>
      )}
    </Button>
  )

  // Live progress while a run is in flight.
  if (running) {
    const total = job?.pages_total ?? null
    const done = job?.pages_scored ?? 0
    const failed = job?.pages_failed ?? 0
    const pct = total ? Math.min(100, Math.round((done / total) * 100)) : null
    return (
      <Card>
        <CardContent className="space-y-3 py-5" role="status" aria-busy="true">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span className="font-medium">
              {job?.step_label ?? "Starting…"}
            </span>
            {total != null && (
              <span className="text-muted-foreground tabular-nums">
                · {done.toLocaleString()} / {total.toLocaleString()} pages
                {failed > 0 ? ` · ${failed.toLocaleString()} skipped` : ""}
              </span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${pct ?? 8}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Checking your pages one at a time to stay within your site&apos;s
            limits — this can take a while on large sites. You can leave this
            page; progress is saved.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (s.loading) {
    return (
      <Card>
        <CardContent className="py-5">
          <Skeleton className="h-16 rounded-xl" />
        </CardContent>
      </Card>
    )
  }

  // A score exists → slim summary; the whole score is a link to the breakdown.
  if (latest) {
    return (
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-5">
          <Link
            href={DETAILS_HREF}
            className="group flex min-w-0 items-center gap-4"
          >
            <span
              className={cn(
                "flex size-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold tabular-nums",
                scoreBg(latest.overall),
              )}
            >
              {latest.overall}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Globe className="size-4 text-primary" /> SEO Score
                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {b && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      b.cls,
                    )}
                  >
                    {b.label}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  Scored {latest.pages_scored.toLocaleString()} of{" "}
                  {latest.pages_total.toLocaleString()} pages · updated{" "}
                  <FormattedDate value={latest.created_at} />
                </span>
              </div>
            </div>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href={DETAILS_HREF}
              className="hidden text-sm font-medium text-primary hover:underline sm:inline"
            >
              View full breakdown
            </Link>
            {RunButton}
          </div>
        </CardContent>
      </Card>
    )
  }

  // No score yet (or the last run errored) → prompt.
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 py-5">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Globe className="size-6" />
          </span>
          <div>
            <p className="text-sm font-semibold">Score your whole site</p>
            <p className="text-xs text-muted-foreground">
              One overall number from every page on your site, plus site-wide
              checks.
            </p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href="/dashboard/page-discovery" />}
          >
            <ScanSearch className="size-4" /> Find pages
          </Button>
          {RunButton}
        </div>
        {(error || jobError) && (
          <p
            role="alert"
            className="w-full rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700 dark:text-amber-400"
          >
            {error || jobError}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
