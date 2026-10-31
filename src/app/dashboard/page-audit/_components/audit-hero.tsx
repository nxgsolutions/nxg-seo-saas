"use client"

import { Button } from "@/components/ui/button"
import type { AuditDetail } from "@/lib/api/audits"
import { downloadAuditReport } from "@/lib/report/audit-report"
import { cn, timeAgo } from "@/lib/utils"
import { AlertTriangle, CheckCircle2, Clock, Download, ExternalLink, FileText, Gauge, Link2, XCircle } from "lucide-react"
import { ScoreGauge } from "./score-gauge"

function band(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: "Good", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" }
  if (score >= 50) return { label: "Needs work", cls: "bg-amber-500/12 text-amber-700 dark:text-amber-400" }
  return { label: "Poor", cls: "bg-destructive/10 text-destructive" }
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-background/60 px-3 py-2.5">
      <Icon className="size-4 shrink-0 text-primary" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  )
}

/** Score, verdict, key numbers, and what changed since the page's last check. */
export function AuditHero({ result }: { result: AuditDetail }) {
  const pass = result.checks.filter((c) => c.status === "pass").length
  const warn = result.checks.filter((c) => c.status === "warn").length
  const fail = result.checks.filter((c) => c.status === "fail").length
  // The headline is the genuine overall SEO score (falls back to the technical
  // score on pre-0051 audits that don't carry one).
  const score = result.overall ?? result.score
  const b = band(score)
  const m = result.metrics

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5" aria-label="Audit result">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <ScoreGauge score={score} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", b.cls)}>{b.label}</span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(result.created_at)} · HTTP {result.status_code}{m.device ? ` · ${m.device === "mobile" ? "Mobile" : "Desktop"}` : ""}
            </span>
          </div>
          <h2 className="truncate text-base font-semibold" title={m.title}>{m.title || result.url}</h2>
          <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <span className="truncate">{result.url.replace(/^https?:\/\//, "")}</span> <ExternalLink className="size-3 shrink-0" />
          </a>
          <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 font-medium text-destructive"><XCircle className="size-3.5" /> {fail} to fix</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/12 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400"><AlertTriangle className="size-3.5" /> {warn} to improve</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="size-3.5" /> {pass} passed</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
          <Button variant="outline" size="sm" onClick={() => downloadAuditReport(result)}>
            <Download className="size-4" /> Export report
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat icon={Clock} label="Server response" value={`${result.load_time_ms.toLocaleString()} ms`} />
        <Stat icon={FileText} label="Words" value={(m.word_count ?? 0).toLocaleString()} />
        <Stat icon={Link2} label="Links (internal / external)" value={`${m.internal_links ?? 0} / ${m.external_links ?? 0}`} />
        <Stat icon={Gauge} label="HTML size" value={`${Math.round(result.page_size_bytes / 1024)} KB`} />
      </div>
    </section>
  )
}
