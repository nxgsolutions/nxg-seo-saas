"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  AlertTriangle,
  BarChart3,
  Loader2,
  MousePointerClick,
  Search,
  TrendingUp,
} from "lucide-react"

import { useConnectGsc, useGscPage, useGscStatus } from "@/hooks/api/use-gsc"
import { ApiError, errorMessage } from "@/lib/api/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Search
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function GscSearchPerformance({
  workspaceId,
  domainId,
  domain,
  pageUrl,
}: {
  workspaceId: string | null
  domainId: string | null
  domain: string | null
  pageUrl: string
}) {
  // Shared cached GSC status + this page's performance (TanStack Query).
  const statusQuery = useGscStatus(workspaceId)
  const status = statusQuery.data ?? null
  const statusLoading = statusQuery.isPending && Boolean(workspaceId)
  const connected = Boolean(status?.connected)
  const pageQuery = useGscPage(workspaceId, domainId, pageUrl, 28, connected)
  const data = pageQuery.data ?? null
  const dataLoading = connected && Boolean(domainId) && pageQuery.isPending
  const connectMutation = useConnectGsc(workspaceId)
  const connecting = connectMutation.isPending
  const dataError = pageQuery.isError
    ? { message: errorMessage(pageQuery.error, "Could not load Search Console data."), status: pageQuery.error instanceof ApiError ? pageQuery.error.status : 0 }
    : connectMutation.isError ? { message: errorMessage(connectMutation.error, "Could not start the Google connection."), status: 0 } : null

  function connect() {
    if (!workspaceId) return
    const returnPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/dashboard/page-audit"
    connectMutation.mutate(returnPath)
  }


  const header = (
    <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
      <div>
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-4 text-primary" /> Search performance
        </CardTitle>
        <CardDescription>
          Real clicks &amp; rankings from Google Search Console (last 28 days).
        </CardDescription>
      </div>
      {status?.connected && status.google_email ? (
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
          {status.google_email}
        </span>
      ) : null}
    </CardHeader>
  )

  // --- Render states --------------------------------------------------------
  let body: React.ReactNode

  if (statusLoading) {
    body = (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Checking Search Console…
      </div>
    )
  } else if (!status?.configured) {
    body = (
      <Alert>
        <AlertTriangle />
        <AlertTitle>Search Console isn&apos;t set up yet</AlertTitle>
        <AlertDescription>
          Add Google OAuth credentials on the server to enable live search data.
          Once configured, you&apos;ll be able to connect your account here.
        </AlertDescription>
      </Alert>
    )
  } else if (!status.connected) {
    body = (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Search className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium">Connect Google Search Console</p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Pull real impressions, clicks, CTR and average position for this page
            straight from your verified property.
          </p>
        </div>
        <Button onClick={connect} disabled={connecting}>
          {connecting ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Connect Search Console
        </Button>
      </div>
    )
  } else if (!domainId) {
    body = (
      <p className="py-4 text-sm text-muted-foreground">
        This URL isn&apos;t one of your workspace&apos;s domains, so there&apos;s
        no Search Console property to match. Add{" "}
        <span className="font-medium">{domain ?? "the domain"}</span> as a domain
        to see its data.
      </p>
    )
  } else if (dataLoading) {
    body = (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Loading search data…
      </div>
    )
  } else if (dataError) {
    body =
      dataError.status === 404 ? (
        <Alert>
          <AlertTriangle />
          <AlertTitle>No matching property</AlertTitle>
          <AlertDescription>{dataError.message}</AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Couldn&apos;t load data</AlertTitle>
          <AlertDescription>{dataError.message}</AlertDescription>
        </Alert>
      )
  } else if (data && !data.has_data) {
    body = (
      <p className="py-4 text-sm text-muted-foreground">
        No Search Console impressions recorded for this exact URL in the last 28
        days. Try the site&apos;s canonical URL, or check back once it accrues
        traffic.
      </p>
    )
  } else if (data) {
    body = (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat icon={MousePointerClick} label="Clicks" value={Math.round(data.clicks).toLocaleString()} />
          <Stat icon={Search} label="Impressions" value={Math.round(data.impressions).toLocaleString()} />
          <Stat icon={TrendingUp} label="Avg CTR" value={pct(data.ctr)} />
          <Stat icon={BarChart3} label="Avg position" value={data.position.toFixed(1)} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Top queries driving this page
          </p>
          {data.queries.length === 0 ? (
            <p className="text-sm text-muted-foreground">No individual queries in range.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Query</th>
                    <th className="px-3 py-2 text-right font-medium">Clicks</th>
                    <th className="px-3 py-2 text-right font-medium">Impr.</th>
                    <th className="px-3 py-2 text-right font-medium">CTR</th>
                    <th className="px-3 py-2 text-right font-medium">Pos.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.queries.slice(0, 10).map((q) => (
                    <tr key={q.query} className="hover:bg-muted/30">
                      <td className="max-w-[220px] truncate px-3 py-2 font-medium" title={q.query}>
                        {q.query}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{Math.round(q.clicks).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{Math.round(q.impressions).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{pct(q.ctr)}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", q.position <= 10 ? "text-emerald-600 dark:text-emerald-400" : "")}>
                        {q.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <Card>
      {header}
      <CardContent>{body}</CardContent>
    </Card>
  )
}
