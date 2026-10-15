"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  Globe
} from "lucide-react"
import Link from "next/link"
import type { useOverviewScreen } from "../_hooks/use-overview-screen"
import { scoreBg } from "../_lib/overview-helpers"

type Props = Pick<ReturnType<typeof useOverviewScreen>, "domains" | "loading" | "siteScores">

export function DomainHealthPanel({ domains, loading, siteScores }: Props) {
  return (<Card className="lg:col-span-1">
    <CardHeader>
      <CardTitle className="text-base">Domains</CardTitle>
      <CardDescription>Latest audit score per site.</CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      {loading ? (
        <p className="px-6 py-6 text-sm text-muted-foreground">Loading…</p>
      ) : domains.length === 0 ? (
        <div className="flex flex-col items-start gap-3 px-6 py-4">
          <p className="text-sm text-muted-foreground">No domains yet.</p>
          <Button render={<Link href="/dashboard/domains" />} size="sm">Add a domain</Button>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {siteScores.map(({ domain, score }) => (
            <li key={domain.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <Globe className="size-4 shrink-0 text-muted-foreground" />
                <span className="truncate text-sm font-medium">{domain.domain}</span>
              </span>
              {score === null ? (
                <Button
                  render={<Link href={`/dashboard/page-audit?url=${encodeURIComponent(domain.domain)}`} />}
                  variant="ghost"
                  size="sm"
                >
                  Audit
                </Button>
              ) : (
                <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums", scoreBg(score))}>
                  {score}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>)
}
