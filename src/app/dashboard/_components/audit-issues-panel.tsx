"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertTriangle,
  XCircle
} from "lucide-react"
import type { useOverviewScreen } from "../_hooks/use-overview-screen"
import { auditHost } from "../_lib/overview-helpers"

type Props = Pick<ReturnType<typeof useOverviewScreen>, "latest" | "issues">

export function AuditIssuesPanel({ latest, issues }: Props) {
  return (<Card className="lg:col-span-2">
    <CardHeader>
      <CardTitle className="text-base">Top issues to fix</CardTitle>
      <CardDescription>
        {latest ? `From the latest audit of ${auditHost(latest.url)}.` : "Run an audit to see prioritized fixes."}
      </CardDescription>
    </CardHeader>
    <CardContent className="p-0">
      {issues.length === 0 ? (
        <p className="px-6 py-6 text-sm text-muted-foreground">
          {latest ? "No issues — every check passed. 🎉" : "No audits yet."}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {issues.slice(0, 6).map((c) => (
            <li key={c.id} className="flex items-start gap-3 px-6 py-3">
              {c.status === "fail" ? (
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
              ) : (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.label}</p>
                <p className="text-sm text-muted-foreground">{c.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>)
}
