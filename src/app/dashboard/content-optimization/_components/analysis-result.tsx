"use client"

import { Button } from "@/components/ui/button"
import type { ContentOptSession } from "@/lib/api/content-opt"
import { cn, timeAgo } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, ExternalLink, ListChecks, Loader2, RotateCw, Sparkles, Target } from "lucide-react"
import { hostOf, scoreBand, scoreColor, scoreStroke } from "../_lib/content-optimization-helpers"
import { headline } from "../_lib/insights"

function Gauge({ score }: { score: number }) {
  const r = 52
  const c = 2 * Math.PI * r
  return (
    <div className="relative size-40 shrink-0" role="img" aria-label={`Content score ${score} out of 100`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-muted" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={scoreStroke(score)} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-5xl font-bold tabular-nums leading-none", scoreColor(score))}>{score}</span>
        <span className="mt-1 text-sm text-muted-foreground">of 100</span>
      </div>
    </div>
  )
}

/** Google-style snippet of the page (stands in for a screenshot). */
function SnippetPreview({ session }: { session: ContentOptSession }) {
  const p = session.result.page
  return (
    <div className="hidden w-64 shrink-0 rounded-xl border bg-white p-3 shadow-xs 2xl:block" style={{ fontFamily: "Arial, sans-serif" }}
      aria-label="How the page appears in Google">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[#5f6368]">Google preview</p>
      <p className="mt-1.5 truncate text-[11px] text-[#4d5156]">{hostOf(session.url)}</p>
      <p className="mt-0.5 line-clamp-2 text-[14px] leading-snug text-[#1a0dab]">{p?.title || session.title || "No title"}</p>
      <p className="mt-1 line-clamp-3 text-[11px] leading-snug text-[#4d5156]">{p?.meta || "No meta description — Google will pick text from the page."}</p>
    </div>
  )
}

export function AnalysisResult({ session, openCount, onViewRecommendations, onRerun, rerunning }: {
  session: ContentOptSession
  openCount: number
  onViewRecommendations: () => void
  onRerun: () => void
  rerunning: boolean
}) {
  const r = session.result
  const score = r.content_score
  const band = scoreBand(score)
  const prev = session.history.length > 1 ? session.history[session.history.length - 2]?.content_score : null
  const delta = prev != null ? score - prev : null
  const h = headline(score, openCount)

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-xs" aria-label="Analysis result">
      <h2 className="text-lg font-semibold">Analysis result</h2>
      <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center">
        <Gauge score={score} />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold",
              band.tone === "good" ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                : band.tone === "ok" ? "bg-amber-500/12 text-amber-700 dark:text-amber-400" : "bg-destructive/10 text-destructive")}>
              <Sparkles className="size-3.5" /> {band.label}
            </span>
            {delta != null && delta !== 0 && (
              <span className={cn("inline-flex items-center gap-0.5 text-sm font-medium", delta > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-destructive")}>
                {delta > 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                {delta > 0 ? "+" : ""}{delta} points <span className="font-normal text-muted-foreground">since last analysis</span>
              </span>
            )}
            <span className="text-xs text-muted-foreground">{timeAgo(session.created_at)}</span>
          </div>
          <div>
            <p className="text-xl font-semibold">{h.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{h.text}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={onViewRecommendations}><ListChecks className="size-4" /> View recommendations</Button>
            <Button variant="outline" onClick={onRerun} disabled={rerunning}>
              {rerunning ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />} Analyze again
            </Button>
          </div>
        </div>
        <SnippetPreview session={session} />
      </div>

      <div className="mt-5 space-y-1.5 border-t pt-4">
        <p className="truncate font-semibold" title={session.title}>{session.title || hostOf(session.url)}</p>
        <a href={session.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <span className="truncate">{session.url.replace(/^https?:\/\//, "")}</span> <ExternalLink className="size-3.5 shrink-0" />
        </a>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs">
            <Target className="size-3.5 text-primary" /> Target keyword: <span className="font-medium">{r.keyword ?? "none"}</span>
          </span>
          {r.ai ? (
            <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs">
              <Sparkles className="size-3.5 text-primary" /> Includes AI suggestions
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs text-muted-foreground">
              AI suggestions unavailable for this analysis
            </span>
          )}
        </div>
      </div>
    </section>
  )
}
