"use client"

import { type RankedPage } from "@/lib/api/opportunity"
import { cn } from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import { compact, posColor } from "../_lib/competitive-strategy-helpers"
import { HeaderWithHelp } from "@/components/ui/column-help"
import { COLUMN_HELP } from "@/lib/column-help"
import { KeywordActionsMenu } from "@/components/keywords/keyword-actions-menu"

interface Props {
  pages: RankedPage[]
  workspaceId: string
  domainId: string
  /** Show only this page's keywords in the Keywords view. */
  onShowKeywords: (url: string) => void
}

/** A competitor's ranking pages — which URLs win traffic and for how many keywords. */
export function RankedPagesTable({ pages, workspaceId, domainId, onShowKeywords }: Props) {
  if (pages.length === 0) {
    return <p className="border-t border-border px-6 py-6 text-sm text-muted-foreground">No ranking pages stored.</p>
  }
  const maxEtv = Math.max(...pages.map((p) => p.etv), 1)
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-6 py-2 font-medium"><HeaderWithHelp help={COLUMN_HELP.rankingPage}>Ranking page</HeaderWithHelp></th>
            <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.pageKeywords}>Keywords</HeaderWithHelp></th>
            <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.bestPosition}>Best pos.</HeaderWithHelp></th>
            <th className="px-3 py-2 text-right font-medium"><HeaderWithHelp help={COLUMN_HELP.pageTraffic}>Est. traffic</HeaderWithHelp></th>
            <th className="px-6 py-2 font-medium"><HeaderWithHelp help={COLUMN_HELP.topKeyword}>Top keyword</HeaderWithHelp></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {pages.map((p) => (
            <tr key={p.url} className="hover:bg-muted/40">
              <td className="max-w-[440px] px-6 py-2">
                {p.title && <p className="truncate font-medium">{p.title}</p>}
                <a href={p.url} target="_blank" rel="noopener noreferrer" title={p.url}
                  className="flex items-center gap-1 truncate text-xs text-primary hover:underline">
                  <span className="truncate">{p.url}</span><ExternalLink className="size-3 shrink-0" />
                </a>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                <button type="button" onClick={() => onShowKeywords(p.url)}
                  className="rounded border border-primary/40 px-1.5 text-xs text-primary hover:bg-primary/10"
                  title="Show this page's keywords">
                  {p.keywords}
                </button>
              </td>
              <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", p.best_position != null && posColor(p.best_position))}>
                {p.best_position ?? "—"}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">
                <span className="inline-flex items-center justify-end gap-2">
                  <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round((p.etv / maxEtv) * 100)}%` }} />
                  </span>
                  {compact(p.etv)}
                </span>
              </td>
              <td className="max-w-[260px] px-6 py-2 text-muted-foreground">
                {p.top_keyword ? (
                  <span className="flex min-w-0 items-center gap-2">
                    <KeywordActionsMenu keyword={p.top_keyword} workspaceId={workspaceId} domainId={domainId} />
                    <span className="truncate">{p.top_keyword}</span>
                  </span>
                ) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
