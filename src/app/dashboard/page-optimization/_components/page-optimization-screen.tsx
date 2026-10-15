"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { ScoreResultSkeleton } from "@/components/dashboard/skeletons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Loader2,
  Monitor,
  Search,
  Smartphone,
  Zap
} from "lucide-react"
import { motion } from "motion/react"
import { usePageOptimizationScreen } from "../_hooks/use-page-optimization-screen"
import { scoreColor } from "../_lib/page-optimization-helpers"
import { RecItem } from "./rec-item"
import { SummaryTile } from "./summary-tile"

export default function PageOptimizationPage() {
  const { url, setUrl, device, setDevice, running, error, setError, result, filter, setFilter, run, filtered, filters } = usePageOptimizationScreen()

  return (
    <div className="space-y-6">
      <PageHeader title={<> <Zap className="size-5 text-primary" /> Fix Plan </>} description={<> Get a prioritized, actionable plan to raise a page&apos;s SEO score — the
        biggest wins first, each with a specific fix. </>} />

      <form onSubmit={run} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={url}
            onValueChange={(v) => {
              setUrl(v)
              if (error) setError(null)
            }}
            placeholder="example.com or https://example.com/page"
            disabled={running}
            className="h-10 pl-9"
            aria-invalid={!!error}
          />
        </div>
        <div className="inline-flex h-10 rounded-lg border border-border p-0.5">
          <button type="button" onClick={() => setDevice("desktop")} disabled={running}
            className={cn("inline-flex items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              device === "desktop" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Monitor className="size-4" /> Desktop
          </button>
          <button type="button" onClick={() => setDevice("mobile")} disabled={running}
            className={cn("inline-flex items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors",
              device === "mobile" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Smartphone className="size-4" /> Mobile
          </button>
        </div>
        <Button type="submit" size="lg" disabled={running} className="sm:w-36">
          {running ? <><Loader2 className="size-4 animate-spin" /> Analyzing…</> : <><Gauge className="size-4" /> Optimize</>}
        </Button>
      </form>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Optimization failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {running && !result ? (
        <ScoreResultSkeleton />
      ) : result ? (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
          <Card>
            <CardContent className="flex flex-col gap-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center">
                  <span className={cn("text-4xl font-semibold tabular-nums", scoreColor(result.score))}>{result.score}</span>
                  <span className="text-xs text-muted-foreground">SEO score</span>
                </div>
                <p className="max-w-xs text-sm text-muted-foreground">
                  {result.summary.total_issues === 0
                    ? "No issues found — this page is well optimized."
                    : `${result.summary.total_issues} improvement${result.summary.total_issues === 1 ? "" : "s"} found. Start with the high-impact items.`}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:w-80">
                <SummaryTile label="High" value={result.summary.high} className="text-destructive" />
                <SummaryTile label="Medium" value={result.summary.medium} className="text-amber-500" />
                <SummaryTile label="Low" value={result.summary.low} className="text-sky-500" />
                <SummaryTile label="Passed" value={result.summary.passed} className="text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          {result.recommendations.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {filters.map((f) => (
                  <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                    className={cn("rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                      filter === f.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                    {f.label} <span className="tabular-nums">({f.count})</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {filtered.map((item) => (
                  <RecItem key={item.id} item={item} />
                ))}
              </div>
            </>
          ) : null}

          {result.wins.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="size-4 text-emerald-500" /> Already good ({result.wins.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {result.wins.map((w) => (
                  <span key={w.id} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" /> {w.title}
                  </span>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </motion.div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Zap className="size-6" />
            </div>
            <p className="text-sm font-medium">Build an optimization plan</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Enter a URL to get a prioritized list of fixes — ranked by impact, each
              with specific guidance on how to implement it.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
