"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn, timeAgo } from "@/lib/utils"
import { History } from "lucide-react"
import Link from "next/link"
import type { usePageAuditScreen } from "../_hooks/use-page-audit-screen"
import { scoreBg } from "../_lib/page-audit-helpers"
import { DeltaBadge } from "./delta-badge"

type Props = Pick<ReturnType<typeof usePageAuditScreen>, "workspaceId" | "result" | "history" | "historyForId" | "openHistory" | "deltas">

/** The workspace's recent audits (newest 25); the full per-page record is in Page history. */
export function AuditHistory({ workspaceId, result, history, historyForId, openHistory, deltas }: Props) {
  return (
    <section className="rounded-2xl border bg-card shadow-xs" aria-label="Recent audits">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><History className="size-4 text-primary" /> Recent audits</h2>
        <Link href="/dashboard/page-history" className="text-xs font-medium text-primary hover:underline">All pages →</Link>
      </header>
      {historyForId !== workspaceId ? (
        <ul className="divide-y" role="status" aria-busy="true" aria-label="Loading audits">
          {[0, 1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center gap-3 px-4 py-2.5">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-3/4" /><Skeleton className="h-3 w-1/3" /></div>
            </li>
          ))}
        </ul>
      ) : history.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">No audits yet. Run your first one above.</p>
      ) : (
        <ul className="max-h-[36rem] divide-y overflow-y-auto">
          {history.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => openHistory(a.id)} aria-current={result?.id === a.id || undefined}
                className={cn("flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50",
                  result?.id === a.id && "bg-primary/5 shadow-[inset_3px_0_0_var(--primary)]")}>
                <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tabular-nums", scoreBg(a.score))}>
                  {a.score}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{a.url.replace(/^https?:\/\//, "")}</span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {timeAgo(a.created_at)}
                    <DeltaBadge delta={deltas[a.id]} />
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
