"use client"

import type { ContentOptSession } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { Info } from "lucide-react"
import { AREA_LABEL, hostOf, priorityStyle, scoreColor } from "../_lib/content-optimization-helpers"
import { CopyButton } from "./copy-button"

/** Older runs (before keyword scoring): AI-only score and suggestions. */
export function LegacyResult({ session }: { session: ContentOptSession }) {
  const r = session.result
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        This is an older run made before keyword scoring and competitor comparison. Analyze the page again for the full report.
      </div>
      <section className="flex items-center gap-4 rounded-2xl border bg-card p-5">
        <span className={cn("text-4xl font-semibold tabular-nums", scoreColor(r.content_score))}>{r.content_score}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{session.title || hostOf(session.url)}</p>
          <p className="text-sm text-muted-foreground">{r.summary}</p>
        </div>
      </section>
      {r.suggestions.length > 0 && (
        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold">Recommendations</h3>
          <ul className="space-y-2">
            {r.suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className={cn("mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", priorityStyle(s.priority))}>{s.priority}</span>
                <span className="text-xs text-muted-foreground">{AREA_LABEL[s.area] ?? s.area}</span>
                <span className="flex-1">{s.recommendation}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {r.rewritten_intro && (
        <section className="rounded-xl border bg-card p-4">
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">Rewritten intro</h3><CopyButton text={r.rewritten_intro} /></div>
          <p className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">{r.rewritten_intro}</p>
        </section>
      )}
    </div>
  )
}
