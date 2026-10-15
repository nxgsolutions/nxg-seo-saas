"use client"

import * as React from "react"
import { ArrowDown, ArrowUp, TrendingDown, TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Skeleton } from "@/components/ui/skeleton"
import { opportunityApi, type OppVolumeMover } from "@/lib/api/opportunity"
import { queryKeys } from "@/lib/query/keys"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function compact(n: number): string {
  const v = Math.abs(n)
  if (v >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return `${Math.round(n)}`
}

function MoverList({ title, rows, positive }: { title: string; rows: OppVolumeMover[]; positive: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {positive ? <ArrowUp className="size-4 text-emerald-500" /> : <ArrowDown className="size-4 text-red-500" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 py-4 text-sm text-muted-foreground">No change this month.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.keyword} className="flex items-center justify-between gap-3 px-6 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{r.keyword}</span>
                  <span className="block text-xs text-muted-foreground tabular-nums">
                    {compact(r.prev)} → {compact(r.curr)} vol
                  </span>
                </span>
                <span className={cn("shrink-0 text-sm font-semibold tabular-nums",
                  positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                  {r.delta > 0 ? "+" : ""}{compact(r.delta)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function OpportunityChangeCharts() {
  // The domain picked in the top bar.
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? ""
  const domainId = activeDomain?.id ?? ""
  // Month-over-month volume change (TanStack Query, cached per website).
  const query = useQuery({
    queryKey: [...queryKeys.opportunity(workspaceId, domainId), "change"],
    queryFn: () => opportunityApi.change(workspaceId, domainId),
    enabled: Boolean(workspaceId && domainId),
  })
  const data = query.data ?? null
  const loading = query.isPending && Boolean(workspaceId && domainId)

  const momData = data
    ? [
        { name: data.prev_label, volume: data.prev_volume, fill: "var(--chart-2)" },
        { name: data.curr_label, volume: data.curr_volume, fill: data.delta >= 0 ? "var(--chart-1)" : "var(--chart-fail)" },
      ]
    : []
  const up = (data?.delta ?? 0) >= 0

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Month-over-month <span className="font-medium text-foreground">search-volume</span> change.
          Rank and traffic changes come from your search data.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2" role="status" aria-busy="true">
          <span className="sr-only">Loading volume history…</span>
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      ) : !data || data.series.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
          No search-volume history for this website yet.
        </CardContent></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Month over month */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Month over month</CardTitle>
                <CardDescription>Total search volume, {data.prev_label} vs {data.curr_label}.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={momData} margin={{ top: 8, right: 8, bottom: 0, left: -4 }}>
                      <XAxis dataKey="name" tick={{ fill: "var(--foreground)", fontSize: 12 }} stroke="var(--chart-grid)" />
                      <YAxis tick={{ fill: "var(--foreground)", fontSize: 11 }} stroke="var(--chart-grid)" tickFormatter={compact} width={44} />
                      <Tooltip cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                        content={({ active, payload, label }) =>
                          active && payload?.length ? (
                            <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                              <p className="font-medium text-popover-foreground">{label}</p>
                              <p className="text-muted-foreground tabular-nums">{compact(Number(payload[0].value))}</p>
                            </div>
                          ) : null}
                      />
                      <Bar isAnimationActive={false} dataKey="volume" radius={[6, 6, 0, 0]} maxBarSize={90}>
                        {momData.map((d) => <Cell key={d.name} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 12-month trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Search-volume trend</CardTitle>
                <CardDescription>Total monthly demand across tracked keywords (12 months).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold tabular-nums">{compact(data.curr_volume)}</span>
                  <span className={cn("flex items-center gap-0.5 text-sm font-medium tabular-nums",
                    up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                    {up ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />}
                    {data.delta_pct > 0 ? "+" : ""}{data.delta_pct}%
                  </span>
                </div>
                <div className="mt-2 h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.series} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                      <defs>
                        <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: "var(--foreground)", fontSize: 10 }} stroke="var(--chart-grid)" interval={1} />
                      <YAxis tick={{ fill: "var(--foreground)", fontSize: 10 }} stroke="var(--chart-grid)" tickFormatter={compact} width={40} />
                      <Tooltip content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
                            <p className="font-medium text-popover-foreground">{label}</p>
                            <p className="text-muted-foreground tabular-nums">{compact(Number(payload[0].value))} vol</p>
                          </div>
                        ) : null}
                      />
                      <Area type="monotone" dataKey="volume" stroke="var(--chart-1)" strokeWidth={2}
                        fill="url(#volGrad)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gainers / losers by volume */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <MoverList title="Rising demand" rows={data.gainers} positive />
            <MoverList title="Falling demand" rows={data.losers} positive={false} />
          </div>
        </>
      )}
    </div>
  )
}
