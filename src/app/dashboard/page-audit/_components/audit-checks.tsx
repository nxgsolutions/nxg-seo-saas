"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { usePageAuditScreen } from "../_hooks/use-page-audit-screen"
import { categorize, STATUS_META } from "../_lib/page-audit-helpers"

type Props = Pick<ReturnType<typeof usePageAuditScreen>, "result">

export function AuditChecks({ result }: Props) {
  if (!result) return null
  return (<Card>
    <CardHeader>
      <CardTitle className="text-base">SEO &amp; performance checks</CardTitle>
    </CardHeader>
    <CardContent className="space-y-5 p-4 pt-0 sm:p-6 sm:pt-0">
      {categorize(result.checks).map((group) => (
        <div key={group.category}>
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2">
            <p className="text-sm font-semibold">{group.category}</p>
            <span className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums">
              {group.pass > 0 ? <span className="text-emerald-600 dark:text-emerald-400">{group.pass} pass</span> : null}
              {group.warn > 0 ? <span className="text-amber-600 dark:text-amber-400">{group.warn} warn</span> : null}
              {group.fail > 0 ? <span className="text-destructive">{group.fail} fail</span> : null}
            </span>
          </div>
          <div className="divide-y divide-border">
            {group.items.map((check) => {
              const meta = STATUS_META[check.status]
              const Icon = meta.icon
              return (
                <div key={check.id} className="flex items-start gap-3 py-3">
                  <span className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full", meta.ring)}>
                    <Icon className={cn("size-4", meta.className)} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-sm text-muted-foreground">{check.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </CardContent>
  </Card>)
}
