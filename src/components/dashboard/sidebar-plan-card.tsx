"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight, Crown, Sparkles } from "lucide-react"

import { useSubscription } from "@/hooks/api/use-billing"
import { type Subscription } from "@/lib/api/billing"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function statusLabel(sub: Subscription): string {
  switch (sub.status) {
    case "trialing":
      return "Free trial"
    case "active":
      return "Active"
    case "past_due":
      return "Payment due"
    case "canceled":
      return "Canceled"
    default:
      return "Free plan"
  }
}

export function SidebarPlanCard({ onNavigate }: { onNavigate?: () => void }) {
  const { activeWorkspace } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null

  // Shared cached subscription (same query as the Billing page).
  const query = useSubscription(workspaceId)
  const sub = query.data ?? null

  // Skeleton while first loading.
  if (workspaceId && query.isPending) {
    return <Skeleton className="h-[92px] w-full rounded-xl" />
  }
  if (!sub) return null

  const isFree = sub.plan.code === "free"

  if (isFree) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Sparkles className="size-3.5" />
          </span>
          <p className="text-sm font-medium">Free plan</p>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Unlock AI Search, competitor data, rank tracking &amp; more.
        </p>
        <Button
          render={<Link href="/dashboard/billing" onClick={onNavigate} />}
          size="sm"
          className="mt-2.5 w-full"
        >
          Upgrade plan <ArrowUpRight className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <Crown className="size-3.5 text-amber-500" />
          <p className="text-sm font-medium">{sub.plan.name} plan</p>
        </span>
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            sub.status === "past_due"
              ? "bg-destructive/10 text-destructive"
              : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          )}
        >
          {statusLabel(sub)}
        </span>
      </div>
      <Link
        href="/dashboard/billing"
        onClick={onNavigate}
        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        Manage subscription <ArrowUpRight className="size-3" />
      </Link>
    </div>
  )
}
