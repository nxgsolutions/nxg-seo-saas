"use client"

import { ChangeList } from "@/components/dashboard/page-changes"
import { buttonVariants } from "@/components/ui/button"
import type { PageScoreDetail } from "@/lib/api/page-score"
import { cn } from "@/lib/utils"
import { Clock, ExternalLink, FileText, Gauge, History, Link2 } from "lucide-react"
import Link from "next/link"
import { band } from "../_lib/page-score-helpers"
import { ScoreGauge } from "./score-gauge"

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

/** Overall score, verdict, key numbers, and what changed since the last check. */
export function ScoreHero({ result }: { result: PageScoreDetail }) {
  const b = band(result.overall)
  const m = result.metrics
  const changes = result.changes ?? []

  return (
    <section className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5" aria-label="Overall score">
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <ScoreGauge score={result.overall} />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", b.cls)}>{b.label}</span>
            <span className="text-xs text-muted-foreground">
              Overall SEO score · HTTP {result.status_code}{m.device ? ` · ${m.device === "mobile" ? "Mobile" : "Desktop"}` : ""}
              {result.keyword ? ` · “${result.keyword}”` : ""}
            </span>
          </div>
          <h2 className="truncate text-base font-semibold" title={m.title}>{m.title || result.url}</h2>
          <a href={result.url} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-primary">
            <span className="truncate">{result.url.replace(/^https?:\/\//, "")}</span> <ExternalLink className="size-3 shrink-0" />
          </a>
          <p className="pt-1 text-xs text-muted-foreground">
            A weighted blend of technical, on-page, content, performance, links &amp; images and structured data — the fixable quality of this page.
          </p>
        </div>
        {result.page_id && (
          <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
            <Link href={`/dashboard/page-history?page=${result.page_id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              <History className="size-4" /> Score history
            </Link>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat icon={Clock} label="Server response" value={`${result.load_time_ms.toLocaleString()} ms`} />
        <Stat icon={FileText} label="Words" value={(m.word_count ?? 0).toLocaleString()} />
        <Stat icon={Link2} label="Links (internal / external)" value={`${m.internal_links ?? 0} / ${m.external_links ?? 0}`} />
        <Stat icon={Gauge} label="HTML size" value={`${Math.round(result.page_size_bytes / 1024)} KB`} />
      </div>

      {changes.length > 0 && (
        <div className="mt-4 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><History className="size-4 text-primary" /> Changed since the last check</p>
          <ChangeList changes={changes} className="mt-1" />
        </div>
      )}
    </section>
  )
}
