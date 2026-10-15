"use client"

import type { ContentOptResult } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { Lightbulb, ListTree, PenLine, Sparkles, Type } from "lucide-react"
import type { ReactNode } from "react"
import { AREA_LABEL, lengthOk, priorityStyle } from "../_lib/content-optimization-helpers"
import { CopyButton } from "./copy-button"

function Block({ icon: Icon, title, hint, action, children }: {
  icon: typeof Type; title: string; hint?: string; action?: ReactNode; children: ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card" aria-label={title}>
      <header className="flex items-start justify-between gap-2 border-b px-4 py-2.5">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-primary" /> {title}</h3>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Options({ items, kind, current }: { items: string[]; kind: "title" | "meta"; current: string }) {
  return (
    <div className="space-y-2">
      {current && (
        <div className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Now:</span> {current}
        </div>
      )}
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 rounded-lg border px-3 py-2">
            <p className="min-w-0 flex-1 text-sm">{t}</p>
            <span className={cn("mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
              lengthOk(kind, t.length) ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/12 text-amber-700 dark:text-amber-400")}>
              {t.length} chars
            </span>
            <CopyButton text={t} iconOnly label={`Copy ${kind}`} className="-my-1" />
          </li>
        ))}
      </ul>
    </div>
  )
}

/** AI writing suggestions (OpenAI). Copy-ready, never applied automatically. */
export function AiWritingPanel({ result }: { result: ContentOptResult }) {
  const ai = result.ai
  if (!ai) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
        <Sparkles className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No AI suggestions for this run</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {result.ai_error ?? "AI writing was skipped."} The score, checklist and comparison above don&apos;t need AI — re-check to try again.
        </p>
      </div>
    )
  }
  const outlineText = ai.outline.map((o) => `${o.level === 3 ? "  " : ""}H${o.level}: ${o.heading}`).join("\n")

  return (
    <div className="grid gap-4 2xl:grid-cols-2">
      <div className="space-y-4">
        {ai.recommendations.length > 0 && (
          <Block icon={Lightbulb} title="What to change" hint="Most impactful first.">
            <ol className="space-y-2.5">
              {ai.recommendations.map((s, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold tabular-nums text-primary">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5">
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase", priorityStyle(s.priority))}>{s.priority}</span>
                      <span className="text-[11px] text-muted-foreground">{AREA_LABEL[s.area] ?? s.area}</span>
                    </div>
                    <p className="text-sm">{s.recommendation}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Block>
        )}
        {ai.title_options.length > 0 && (
          <Block icon={Type} title="Title options" hint="30–60 characters, keyword near the start.">
            <Options items={ai.title_options} kind="title" current={result.page?.title ?? ""} />
          </Block>
        )}
        {ai.meta_options.length > 0 && (
          <Block icon={PenLine} title="Meta description options" hint="120–160 characters with a clear benefit.">
            <Options items={ai.meta_options} kind="meta" current={result.page?.meta ?? ""} />
          </Block>
        )}
      </div>

      <div className="space-y-4">
        {ai.outline.length > 0 && (
          <Block icon={ListTree} title="Suggested outline" hint="Keeps your useful sections and adds what top pages cover."
            action={<CopyButton text={outlineText} label="Copy" />}>
            <ol className="space-y-1.5">
              {ai.outline.map((o, i) => (
                <li key={i} className={cn("rounded-lg px-2 py-1.5", o.level === 3 && "ml-6", o.is_new && "bg-primary/5")}>
                  <div className="flex items-center gap-2">
                    <span className={cn("w-6 shrink-0 rounded px-1 text-center text-[10px] font-semibold",
                      o.level === 3 ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>H{o.level}</span>
                    <span className="min-w-0 flex-1 text-sm font-medium">{o.heading}</span>
                    {o.is_new && <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">New</span>}
                  </div>
                  {o.note && <p className="ml-8 text-xs text-muted-foreground">{o.note}</p>}
                </li>
              ))}
            </ol>
          </Block>
        )}
        {ai.intro && (
          <Block icon={Sparkles} title="Rewritten intro" action={<CopyButton text={ai.intro} label="Copy" />}>
            <p className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">{ai.intro}</p>
          </Block>
        )}
      </div>
    </div>
  )
}
