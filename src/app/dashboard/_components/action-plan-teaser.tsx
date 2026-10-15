"use client"

import Link from "next/link"
import { ArrowRight, Sparkles, Swords, Target, TrendingUp } from "lucide-react"

import { useActionPlan } from "@/hooks/api/use-action-plan"
import type { ActionType } from "@/lib/api/opportunity"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const num = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString())

const TYPE_META: Record<ActionType, { label: string; icon: typeof TrendingUp; className: string }> = {
  improve: { label: "Improve", icon: TrendingUp, className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
  gap: { label: "Competitor gap", icon: Swords, className: "bg-primary/10 text-primary" },
  target: { label: "New target", icon: Sparkles, className: "bg-sky-500/10 text-sky-700 dark:text-sky-400" },
}

/**
 * Home-page teaser for the Action Plan: the prioritised keyword actions and the
 * traffic they can bring, with the top three surfaced inline. DB-only data; it
 * self-hides when there is no workspace/domain or nothing to act on yet.
 */
export function ActionPlanTeaser({ wid, did }: { wid: string | null; did: string | null }) {
  const plan = useActionPlan(wid ?? "", did ?? "")

  if (!wid || !did) return null
  if (plan.isPending) {
    return (
      <Card className="lg:col-span-3">
        <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
        <CardContent className="space-y-2">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </CardContent>
      </Card>
    )
  }

  const data = plan.data
  const total = data ? data.counts.improve + data.counts.gaps + data.counts.targets : 0
  // Nothing to show yet — the setup checklist already guides first steps.
  if (!data || total === 0 || data.top.length === 0) return null

  const top = data.top.slice(0, 3)

  return (
    <Card className="lg:col-span-3">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Target className="size-5" />
            </span>
            <div>
              <CardTitle className="text-base">Your top priorities</CardTitle>
              <CardDescription>
                {num(total)} prioritised actions worth ~{num(data.total_gain)} extra visits/mo
              </CardDescription>
            </div>
          </div>
          <Button render={<Link href="/dashboard/opportunity-research" />} variant="outline" size="sm" className="shrink-0">
            View action plan <ArrowRight className="size-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-2 lg:grid-cols-3">
          {top.map((i, n) => {
            const m = TYPE_META[i.type]
            return (
              <li key={`${i.type}:${i.keyword}`}
                className="flex items-start gap-3 rounded-xl border border-border p-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold tabular-nums text-muted-foreground">
                  {n + 1}
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className={cn("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium", m.className)}>
                    <m.icon className="size-3" aria-hidden="true" />{m.label}
                  </span>
                  <p className="truncate text-sm font-medium" title={i.keyword}>{i.keyword}</p>
                  <p className="text-xs font-semibold tabular-nums text-primary">
                    +{num(i.gain)}<span className="font-normal text-muted-foreground">/mo potential</span>
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
