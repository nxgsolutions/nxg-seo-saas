"use client"

import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"

import { type Domain } from "@/lib/api/workspaces"
import {
  GSC_FIRST_PAGE,
  useGscKeywords,
  useGscStatus,
} from "@/hooks/api/use-gsc"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrafficTrendChart } from "@/components/charts/lazy"

/** Clicks-over-time trend chart for the dashboard overview. The headline totals
 *  live in the KPI hero; this panel focuses on the shape of the trend. Real data
 *  only: until Search Console is connected it shows a connect prompt. */
export function SearchSnapshot({
  workspaceId,
  domain,
}: {
  workspaceId: string | null
  domain: Domain | null
}) {
  const status = useGscStatus(workspaceId)
  const connected = Boolean(status.data?.connected)
  const perf = useGscKeywords(
    workspaceId,
    domain?.id ?? null,
    28,
    GSC_FIRST_PAGE,
    connected,
  )
  const data = perf.data ?? null
  const loading =
    status.isPending || (connected && Boolean(domain) && perf.isPending)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-primary" /> Search performance
        </CardTitle>
        <CardDescription>Clicks over the last 28 days.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div role="status" aria-busy="true">
            <span className="sr-only">Loading search performance…</span>
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ) : data ? (
          <TrafficTrendChart data={data.trend} />
        ) : (
          <div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            {connected
              ? "Couldn't load Search Console data for this website right now."
              : "Connect Google Search Console to see your clicks, impressions and positions here."}
          </div>
        )}
        <Button
          render={<Link href="/dashboard/search-performance" />}
          variant="outline"
          size="sm"
          className="w-full"
        >
          {connected ? "Open Search Performance" : "Connect Search Console"}{" "}
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}
