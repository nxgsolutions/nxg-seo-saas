"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { UrlCombobox } from "@/components/ui/url-combobox"
import type { KeywordOption } from "@/lib/api/content-opt"
import { cn } from "@/lib/utils"
import { AlertTriangle, ChevronDown, Loader2, ScanSearch, Sparkles, Target, X } from "lucide-react"
import type { ContentOptimizationScreen } from "../_hooks/use-content-optimization-screen"

const SOURCE_LABEL: Record<KeywordOption["source"], string> = {
  page: "Ranks", tracked: "Tracked", site: "Website",
}

/** Page URL + target keyword (+ optional pages to compare with) → Analyze. */
export function AnalyzeForm({ screen }: { screen: ContentOptimizationScreen }) {
  const { form, pages, keywordOptions, keywordOptionsLoading, aiAvailable, running, submit } = screen
  const kw = form.keyword.trim().toLowerCase()

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-4 shadow-xs sm:p-6" aria-busy={running}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] lg:items-end">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Page URL</span>
          <UrlCombobox value={form.url} onValueChange={(v) => { form.setUrl(v); if (form.error) form.clearError() }}
            items={pages} placeholder="https://yoursite.com/blog/post" disabled={running}
            invalid={Boolean(form.error)} aria-label="Page URL" />
        </label>

        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Target keyword <span className="font-normal text-muted-foreground">(recommended)</span></span>
          <div className="relative">
            <Target aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={form.keyword} onValueChange={form.setKeyword} placeholder="e.g. upsc study plan"
              disabled={running} className="h-11 pl-9 pr-8" maxLength={200} />
            {form.keyword && !running && (
              <button type="button" onClick={() => form.setKeyword("")} aria-label="Clear keyword"
                className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </label>

        <Button type="submit" size="lg" disabled={running} className="h-11 lg:w-44">
          {running ? <><Loader2 className="size-4 animate-spin" /> Analyzing…</> : <><ScanSearch className="size-4" /> Analyze page</>}
        </Button>
      </div>
      <div className="mt-1.5 hidden gap-3 text-xs text-muted-foreground lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_11rem]">
        <span>Enter the full URL of the page you want to optimize.</span>
        <span>The main keyword you want this page to rank for.</span>
      </div>

      {/* Keyword suggestions for this website / page (fixed height: no jump while loading). */}
      <div className="mt-3 flex min-h-7 flex-wrap items-center gap-1.5">
        <span className="mr-1 text-sm font-medium">Suggested keywords:</span>
        {keywordOptionsLoading ? (
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-7 w-28 rounded-full" />)
        ) : keywordOptions.length === 0 ? (
          <span className="text-xs text-muted-foreground">Track keywords or connect your search data to get suggestions.</span>
        ) : keywordOptions.slice(0, 10).map((o) => {
          const active = o.keyword.toLowerCase() === kw
          return (
            <button key={o.keyword} type="button" disabled={running} onClick={() => form.setKeyword(o.keyword)}
              aria-pressed={active}
              title={o.has_serp ? "Top Google results are ready for this keyword" : "Top Google results not loaded yet for this keyword"}
              className={cn(
                "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                active ? "border-primary bg-primary/10 text-primary" : "bg-background hover:border-primary/40 hover:bg-primary/5",
              )}>
              {o.has_serp && <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />}
              <span className="max-w-48 truncate font-medium">{o.keyword}</span>
              <span className="text-[10px] text-muted-foreground">
                {o.source === "page" && o.position ? `#${o.position}` : SOURCE_LABEL[o.source]}
              </span>
            </button>
          )
        })}
      </div>

      {/* Optional: pages to compare with. */}
      <div className="mt-3 border-t pt-3">
        <button type="button" onClick={() => form.setShowCompare(!form.showCompare)} aria-expanded={form.showCompare}
          className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ChevronDown className={cn("size-3.5 transition-transform", form.showCompare && "rotate-180")} />
          Compare with specific pages (optional)
        </button>
        {form.showCompare && (
          <div className="mt-2 grid gap-1.5">
            <textarea value={form.compareText} onChange={(e) => form.setCompareText(e.target.value)} disabled={running}
              rows={3} placeholder={"https://competitor.com/article\nhttps://another.com/guide"}
              aria-label="Competitor page URLs, one per line"
              className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30" />
            <p className="text-xs text-muted-foreground">Up to 5 URLs, one per line. They&apos;re used first; top Google results fill the rest.</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" />
          {aiAvailable ? "Includes AI writing suggestions" : "AI writing is unavailable right now — you still get the score, checklist and comparison"}
        </span>
      </div>

      {form.error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 flex-1">{form.error}</span>
          <button type="button" onClick={form.clearError} aria-label="Dismiss" className="cursor-pointer rounded p-0.5 hover:bg-destructive/10">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </form>
  )
}
