"use client"

import { ScoreTrendChart } from "@/components/charts/lazy"
import { toTrendPoints } from "@/components/charts/trend-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { useOverviewScreen } from "../_hooks/use-overview-screen"

type Props = Pick<ReturnType<typeof useOverviewScreen>, "activeWorkspace" | "audits" | "loading">

export function AuditTrendPanel({ activeWorkspace, audits, loading }: Props) {
  return (<Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle className="text-base">Audit score trend</CardTitle>
      <CardDescription>
        Recent page-audit scores across {activeWorkspace?.name ?? "this workspace"}.
      </CardDescription>
    </CardHeader>
    <CardContent>
      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <ScoreTrendChart data={toTrendPoints(audits)} />
      )}
    </CardContent>
  </Card>)
}
