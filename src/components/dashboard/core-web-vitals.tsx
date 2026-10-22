"use client"

import * as React from "react"
import { motion } from "motion/react"
import { AlertTriangle, Gauge, Loader2, Zap } from "lucide-react"

import { toolsApi, type PsiFieldMetric, type PsiResult } from "@/lib/api/tools"
import { ApiError, NetworkError } from "@/lib/api/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

function perfColor(score: number): string {
  if (score >= 90) return "text-emerald-500"
  if (score >= 50) return "text-amber-500"
  return "text-destructive"
}

function catColor(cat: string | null | undefined): string {
  if (cat === "FAST") return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
  if (cat === "AVERAGE") return "text-amber-600 dark:text-amber-400 bg-amber-500/10"
  if (cat === "SLOW") return "text-destructive bg-destructive/10"
  return "text-muted-foreground bg-muted"
}

function fmtField(key: string, m: PsiFieldMetric | null): string {
  if (!m || m.percentile == null) return "—"
  const p = m.percentile
  if (key === "cls") return (p / 100).toFixed(2)
  if (key === "lcp" || key === "fcp") return `${(p / 1000).toFixed(1)} s`
  return `${p} ms` // inp
}

function FieldRow({ label, k, m }: { label: string; k: string; m: PsiFieldMetric | null }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums">{fmtField(k, m)}</span>
        {m?.category ? (
          <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", catColor(m.category))}>
            {m.category}
          </span>
        ) : null}
      </span>
    </div>
  )
}

function LabTile({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value ?? "—"}</p>
    </div>
  )
}

export function CoreWebVitals({
  url,
  strategy,
  initial = null,
}: {
  url: string
  strategy: "mobile" | "desktop"
  /** Core Web Vitals already captured by the audit; shown without a re-fetch. */
  initial?: PsiResult | null
}) {
  const [running, setRunning] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [result, setResult] = React.useState<PsiResult | null>(initial)
  // Reset to the audit's stored data when a different audit is opened.
  React.useEffect(() => {
    setResult(initial)
    setError(null)
  }, [initial])

  async function run() {
    setError(null)
    setRunning(true)
    try {
      setResult(await toolsApi.pageSpeed(url, strategy))
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else if (err instanceof NetworkError) setError(err.message)
      else setError("Could not run PageSpeed Insights.")
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="size-4 text-amber-500" /> Core Web Vitals
          </CardTitle>
          <CardDescription>
            Real performance from Google PageSpeed Insights ({strategy}).
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={run} disabled={running} className="shrink-0">
          {running ? <Loader2 className="size-4 animate-spin" /> : <Gauge className="size-4" />}
          {result ? "Re-run" : "Run test"}
        </Button>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertTitle>PageSpeed unavailable</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : running ? (
          <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="size-6 animate-spin" />
            Running Lighthouse in a real browser… this can take 10–30 seconds.
          </div>
        ) : result ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className={cn("text-4xl font-semibold tabular-nums", result.performance_score != null ? perfColor(result.performance_score) : "text-muted-foreground")}>
                  {result.performance_score ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">Perf score</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Lighthouse performance score (0–100). Below are lab metrics and,
                when Google has enough traffic data, real-user field metrics (CrUX).
              </p>
            </div>

            {result.field ? (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Field data (real users) · {result.field.overall ?? "—"}
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <FieldRow label="LCP" k="lcp" m={result.field.lcp} />
                  <FieldRow label="INP" k="inp" m={result.field.inp} />
                  <FieldRow label="CLS" k="cls" m={result.field.cls} />
                  <FieldRow label="FCP" k="fcp" m={result.field.fcp} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No real-user field data — this URL doesn&apos;t have enough Chrome UX traffic yet. Lab metrics below.
              </p>
            )}

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Lab data (Lighthouse)
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <LabTile label="LCP" value={result.lab.lcp.display} />
                <LabTile label="CLS" value={result.lab.cls.display} />
                <LabTile label="Total blocking" value={result.lab.tbt.display} />
                <LabTile label="FCP" value={result.lab.fcp.display} />
                <LabTile label="Speed index" value={result.lab.si.display} />
                <LabTile label="Time to interactive" value={result.lab.tti.display} />
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Zap className="size-5" />
            </div>
            <p className="text-sm font-medium">Measure real performance</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Run Google PageSpeed Insights to get the Lighthouse score and Core
              Web Vitals (LCP, CLS, INP) for this page.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
