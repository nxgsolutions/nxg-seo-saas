"use client"

import { CheckBreakdown } from "@/components/charts/lazy"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ArrowRight,
  Gauge
} from "lucide-react"
import Link from "next/link"
import type { useOverviewScreen } from "../_hooks/use-overview-screen"
import { auditHost } from "../_lib/overview-helpers"

type Props = Pick<ReturnType<typeof useOverviewScreen>, "latest" | "health">

export function AuditHealthPanel({ latest, health }: Props) {
  return (<Card className="lg:col-span-1">
    <CardHeader>
      <CardTitle className="text-base">Latest audit health</CardTitle>
      <CardDescription className="truncate">
        {latest ? auditHost(latest.url) : "No audits yet"}
      </CardDescription>
    </CardHeader>
    <CardContent>
      {health ? (
        <>
          <CheckBreakdown pass={health.pass} warn={health.warn} fail={health.fail} />
          <Button
            render={<Link href="/dashboard/page-audit" />}
            variant="outline"
            size="sm"
            className="mt-4 w-full"
          >
            Open Page Audit <ArrowRight className="size-4" />
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-start gap-3 py-4">
          <p className="text-sm text-muted-foreground">Run an audit to see its health breakdown.</p>
          <Button render={<Link href="/dashboard/page-audit" />} size="sm">
            <Gauge className="size-4" /> Run one
          </Button>
        </div>
      )}
    </CardContent>
  </Card>)
}
