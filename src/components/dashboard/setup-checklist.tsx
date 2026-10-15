"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Circle, Loader2, Rocket } from "lucide-react"

import { useGscStatus } from "@/hooks/api/use-gsc"
import { useRecentKeywordSearches } from "@/hooks/api/use-keyword-search"
import { useCompetitorList } from "@/hooks/api/use-competitors"
import type { Domain } from "@/lib/api/workspaces"
import type { AuditSummary } from "@/lib/api/audits"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ConnectGscDialog } from "@/components/dashboard/connect-gsc-dialog"
import { cn } from "@/lib/utils"

interface Step {
  key: string
  label: string
  desc: string
  done: boolean
  href: string
  cta: string
}

export function SetupChecklist({
  workspaceId,
  domains,
  audits,
}: {
  workspaceId: string | null
  domains: Domain[]
  audits: AuditSummary[]
}) {
  // Shared cached GSC status (same query as Search Performance / the snapshot).
  const gsc = useGscStatus(workspaceId)
  const gscConnected = gsc.isError ? false : gsc.data?.connected ?? null
  const [dismissed, setDismissed] = React.useState(false)
  const [gscOpen, setGscOpen] = React.useState(false)

  // Remember dismissal per browser.
  const [checkedStore, setCheckedStore] = React.useState(false)
  if (!checkedStore && typeof window !== "undefined") {
    setCheckedStore(true)
    try {
      if (localStorage.getItem("setup-checklist-dismissed") === "1") setDismissed(true)
    } catch {
      /* storage blocked — ignore */
    }
  }

  const gscLoading = !!workspaceId && gsc.isPending

  // First-run progress: keyword research + competitors (shared cached queries).
  const did = domains[0]?.id ?? null
  const recent = useRecentKeywordSearches(workspaceId)
  const competitors = useCompetitorList(workspaceId, did)

  const steps: Step[] = [
    {
      key: "domain",
      label: "Add your first domain",
      desc: "The website you'll audit, track and research.",
      done: domains.length > 0,
      href: "/dashboard/domains",
      cta: "Add domain",
    },
    {
      key: "gsc",
      label: "Connect Google Search Console",
      desc: "Powers real rankings, clicks and competitor tracking.",
      done: gscConnected === true,
      href: "/dashboard/settings",
      cta: "Connect",
    },
    {
      key: "keyword",
      label: "Research a keyword",
      desc: "Find what people search for — volume, difficulty and ideas.",
      done: (recent.data?.length ?? 0) > 0,
      href: "/dashboard/keyword-analysis",
      cta: "Search",
    },
    {
      key: "audit",
      label: "Run a page audit",
      desc: "Score a page on 16 SEO & performance checks.",
      done: audits.length > 0,
      href: "/dashboard/page-audit",
      cta: "Run audit",
    },
    {
      key: "competitors",
      label: "Find your competitors",
      desc: "See who you're up against — no setup needed.",
      done: (competitors.data?.rows?.length ?? 0) > 0,
      href: "/dashboard/competitors",
      cta: "Find",
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  const allDone = doneCount === steps.length && !gscLoading

  if (dismissed || allDone) return null

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem("setup-checklist-dismissed", "1")
    } catch {
      /* ignore */
    }
  }

  const next = steps.find((s) => !s.done)

  return (
    <>
    <Card className="dashboard-setup">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <Rocket className="size-4" />
            </span>
            <div>
              <CardTitle>Build your SEO foundation</CardTitle>
              <CardDescription>{doneCount} of {steps.length} steps complete</CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={dismiss}
          >
            Dismiss
          </Button>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>

      </CardHeader>
      <CardContent>
        <ul className="grid gap-3 xl:grid-cols-3">
          {steps.map((s) => {
            const loading = s.key === "gsc" && gscLoading
            const isNext = next?.key === s.key
            return (
              <li
                key={s.key}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-xl border border-border p-3",
                  isNext && "bg-primary/5"
                )}
              >
                {loading ? (
                  <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
                ) : s.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="size-5 shrink-0 text-muted-foreground/50" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", s.done && "text-muted-foreground line-through")}>
                    {s.label}
                  </p>
                  {!s.done ? <p className="text-xs text-muted-foreground">{s.desc}</p> : null}
                </div>
                {!s.done && !loading ? (
                  s.key === "gsc" ? (
                    <Button
                      size="sm"
                      variant={isNext ? "default" : "outline"}
                      className="shrink-0"
                      onClick={() => setGscOpen(true)}
                    >
                      {s.cta} <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      render={<Link href={s.href} />}
                      size="sm"
                      variant={isNext ? "default" : "outline"}
                      className="shrink-0"
                    >
                      {s.cta} <ArrowRight className="size-4" />
                    </Button>
                  )
                ) : null}
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
    <ConnectGscDialog workspaceId={workspaceId} open={gscOpen} onOpenChange={setGscOpen} returnPath="/dashboard" />
    </>
  )
}
