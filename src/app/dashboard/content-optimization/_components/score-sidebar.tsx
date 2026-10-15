"use client"

import type { ContentOptResult } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { BarChart3, BookOpen, FileText, Image as ImageIcon, KeyRound, Layers, Lightbulb, Link2, ListTree, PieChart, Tags } from "lucide-react"
import { barTone, categoryScores } from "../_lib/insights"

const ICON: Record<string, typeof FileText> = {
  structure: FileText, keyword: KeyRound, topics: Layers, readability: BookOpen, links: Link2, meta: Tags,
}

/** Per-area scores (same rules as the overall score). */
export function ScoreBreakdown({ result }: { result: ContentOptResult }) {
  const rows = categoryScores(result)
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-xs" aria-label="Score breakdown">
      <h2 className="flex items-center gap-2 text-base font-semibold"><PieChart className="size-4 text-primary" /> Score breakdown</h2>
      <ul className="mt-4 space-y-3.5">
        {rows.map((r) => {
          const Icon = ICON[r.key] ?? FileText
          return (
            <li key={r.key} className="grid grid-cols-[1.75rem_minmax(0,1fr)_6rem_2rem] items-center gap-2" title={r.hint}>
              <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground"><Icon className="size-3.5" /></span>
              <span className="truncate text-sm">{r.label}</span>
              <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                {r.score != null && <span className={cn("block h-full rounded-full", barTone(r.score))} style={{ width: `${Math.max(3, r.score)}%` }} />}
              </span>
              <span className="text-right text-sm font-semibold tabular-nums">{r.score ?? "—"}</span>
            </li>
          )
        })}
      </ul>
      {!result.keyword && <p className="mt-3 text-xs text-muted-foreground">Add a target keyword to score keyword usage.</p>}
    </section>
  )
}

/** Your page vs the median of the top-ranking pages, plus a tip. */
export function TopPagesCompare({ result }: { result: ContentOptResult }) {
  const b = result.benchmark
  const p = result.page
  const covered = result.terms.filter((t) => t.status !== "missing").length
  const h2 = p ? p.headings.filter((h) => h.level === 2).length : null
  const rows: { icon: typeof FileText; label: string; you: number | null | undefined; them: number | null | undefined; unit?: string }[] = [
    { icon: FileText, label: "Content length", you: p?.word_count, them: b?.word_count, unit: "words" },
    { icon: Layers, label: "Topics covered", you: result.terms.length ? covered : null, them: result.terms.length || null },
    { icon: Link2, label: "Internal links", you: p?.internal_links, them: b?.internal_links },
    { icon: ListTree, label: "H2 sections", you: h2, them: b?.h2 },
    { icon: ImageIcon, label: "Images", you: p?.images, them: b?.images },
  ]
  const fmt = (v: number | null | undefined, unit?: string) =>
    v == null ? "—" : `${Math.round(v).toLocaleString()}${unit ? ` ${unit}` : ""}`
  const newSections = result.ai?.outline.filter((o) => o.is_new).map((o) => o.heading).slice(0, 3) ?? []
  const missing = result.terms.filter((t) => t.status === "missing").map((t) => t.term).slice(0, 4)

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-xs" aria-label="Top-ranking pages comparison">
      <h2 className="flex items-center gap-2 text-base font-semibold"><BarChart3 className="size-4 text-primary" /> You vs top-ranking pages</h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        {b ? `Your page compared with the average of the top ${b.pages} pages.` : "Add a target keyword or competitor URLs to compare with top pages."}
      </p>
      {b && (
        <>
        <p className="mt-2 flex gap-3 text-[11px] text-muted-foreground">
          <span><span className="font-medium text-emerald-700 dark:text-emerald-400">Green</span> = you match or beat them</span>
          <span><span className="font-medium text-amber-700 dark:text-amber-400">Amber</span> = clearly behind</span>
        </p>
        <div className="mt-2 overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-xs text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Metric</th>
              <th className="px-3 py-2 text-right font-medium">Your page</th>
              <th className="px-3 py-2 text-right font-medium">Top avg.</th>
            </tr></thead>
            <tbody className="divide-y">
              {rows.map(({ icon: Icon, label, you, them, unit }) => {
                const behind = you != null && them != null && you < them * 0.8
                const ahead = you != null && them != null && you >= them
                return (
                  <tr key={label}>
                    <td className="px-3 py-2"><span className="flex items-center gap-2"><Icon className="size-3.5 text-muted-foreground" /> {label}</span></td>
                    <td className={cn("px-3 py-2 text-right tabular-nums", behind && "font-medium text-amber-700 dark:text-amber-400",
                      ahead && "font-medium text-emerald-700 dark:text-emerald-400")}>{fmt(you, unit)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(them, unit)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
      {(newSections.length > 0 || missing.length > 0) && (
        <div className="mt-3 flex gap-2.5 rounded-xl bg-amber-500/[0.06] p-3 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
          <p className="text-muted-foreground">
            {newSections.length > 0
              ? <>Top-ranking pages also cover <span className="font-medium text-foreground">{newSections.join(", ")}</span>. Consider adding these sections.</>
              : <>Most top pages mention <span className="font-medium text-foreground">{missing.join(", ")}</span> — your page doesn&apos;t yet.</>}
          </p>
        </div>
      )}
    </section>
  )
}
