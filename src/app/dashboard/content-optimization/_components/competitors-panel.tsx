"use client"

import type { ContentOptResult, ContentOptSession } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { Check, ExternalLink, Info, Minus, SearchX } from "lucide-react"
import Link from "next/link"
import { fmt, hostOf } from "../_lib/content-optimization-helpers"

/** You vs the top pages' median on one measure (one axis, shared scale). */
function CompareBar({ label, you, them, unit }: { label: string; you: number | null; them: number | null; unit: string }) {
  const max = Math.max(you ?? 0, them ?? 0, 1)
  return (
    <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:items-center">
      <p className="text-xs font-medium sm:row-span-2">{label}</p>
      {[{ name: "You", v: you, cls: "bg-primary" }, { name: "Top pages", v: them, cls: "bg-muted-foreground/40" }].map((b) => (
        <div key={b.name} className="flex items-center gap-2 sm:col-start-2">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">{b.name}</span>
          <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-[width] duration-500", b.cls)}
              style={{ width: `${Math.max(2, ((b.v ?? 0) / max) * 100)}%` }} />
          </div>
          <span className="w-24 shrink-0 text-right text-xs tabular-nums">{fmt(b.v)}{unit && ` ${unit}`}</span>
        </div>
      ))}
    </div>
  )
}

function YesNo({ v }: { v: boolean | null }) {
  if (v == null) return <span className="text-muted-foreground">—</span>
  return v
    ? <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" aria-label="Yes" />
    : <Minus className="mx-auto size-4 text-muted-foreground" aria-label="No" />
}

const SOURCE_TEXT: Record<ContentOptResult["competitor_source"], string> = {
  serp: "Top organic results on Google for your keyword",
  manual: "The pages you entered",
  "serp+manual": "The pages you entered + top Google results",
  none: "",
}

export function CompetitorsPanel({ session }: { session: ContentOptSession }) {
  const r = session.result
  const page = r.page
  const ok = r.competitors.filter((c) => !c.error)

  if (r.competitors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
        <SearchX className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">No pages to compare with</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {r.keyword
            ? <>No Google results are stored for “{r.keyword}”. Fetch them from <Link href="/dashboard/keyword-analysis" className="font-medium text-primary hover:underline">Keyword Analysis</Link> (keyword “+” menu → Search results), or add competitor URLs under “Compare with specific pages”, then re-check.</>
            : <>Add a target keyword (or competitor URLs) to compare your page with the pages that rank.</>}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        <span>
          {SOURCE_TEXT[r.competitor_source]}
          {r.serp_captured_at && ` · results from ${new Date(r.serp_captured_at).toLocaleDateString()}`}
          {` · ${ok.length} of ${r.competitors.length} pages could be read`}
        </span>
      </div>
      {(r.skipped_competitors?.length ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          Left out (your own website): {r.skipped_competitors!.map(hostOf).join(", ")}
        </p>
      )}

      {r.benchmark && page && (
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <CompareBar label="Content length" you={page.word_count} them={r.benchmark.word_count} unit="words" />
          <CompareBar label="Subheadings" you={page.headings.length} them={r.benchmark.headings} unit="" />
          <CompareBar label="Images" you={page.images} them={r.benchmark.images} unit="" />
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[720px] table-fixed text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="w-14 px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">Page</th>
              <th className="w-24 px-3 py-2 text-right font-medium">Words</th>
              <th className="w-28 px-3 py-2 text-right font-medium">Subheadings</th>
              <th className="w-28 px-3 py-2 text-right font-medium">Readability</th>
              <th className="w-24 px-3 py-2 text-center font-medium">Keyword<br />in title</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {page && (
              <tr className="bg-primary/5">
                <td className="px-3 py-2.5"><span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">You</span></td>
                <td className="px-3 py-2.5">
                  <p className="truncate font-medium">{page.title || hostOf(session.url)}</p>
                  <p className="truncate text-xs text-muted-foreground">{hostOf(session.url)}</p>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(page.word_count)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{page.headings.length}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(page.reading_ease)}</td>
                <td className="px-3 py-2.5 text-center">
                  <YesNo v={r.keyword ? r.checks.find((c) => c.id === "kw_title")?.status === "pass" : null} />
                </td>
              </tr>
            )}
            {r.competitors.map((c) => (
              <tr key={c.url} className="align-top">
                <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{c.position ?? "—"}</td>
                <td className="px-3 py-2.5">
                  <a href={c.url} target="_blank" rel="noreferrer" className="group flex items-center gap-1 font-medium hover:text-primary">
                    <span className="truncate">{c.title || c.host}</span>
                    <ExternalLink className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                  </a>
                  <p className="truncate text-xs text-muted-foreground">{c.host}</p>
                  {c.error ? (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">{c.error}</p>
                  ) : c.top_headings.length > 0 && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground" title={c.top_headings.join(" · ")}>
                      {c.top_headings.slice(0, 5).join(" · ")}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(c.word_count)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(c.headings)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{fmt(c.reading_ease)}</td>
                <td className="px-3 py-2.5 text-center"><YesNo v={c.keyword_in_title} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
