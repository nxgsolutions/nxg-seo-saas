"use client"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { cn, timeAgo } from "@/lib/utils"
import {
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import type { useOverviewScreen } from "../_hooks/use-overview-screen"
import { auditHost, scoreBg } from "../_lib/overview-helpers"

type Props = Pick<ReturnType<typeof useOverviewScreen>, "audits">

export function RecentAuditsPanel({ audits }: Props) {
  return (<Card>
    <CardHeader>
      <CardTitle className="text-base">Recent audits</CardTitle>
    </CardHeader>
    <CardContent className="p-0">
      <ul className="divide-y divide-border sm:grid sm:grid-cols-2 sm:divide-y-0">
        {audits.slice(0, 6).map((a) => (
          <li key={a.id}>
            <Link href="/dashboard/page-audit" className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-muted/50">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums", scoreBg(a.score))}>
                {a.score}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{auditHost(a.url)}</span>
                <span className="block text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
              </span>
              <CheckCircle2 className="size-4 shrink-0 text-muted-foreground/40" />
            </Link>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>)
}
