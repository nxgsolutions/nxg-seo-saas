"use client"

import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import type { ContentOptSession } from "@/lib/api/content-opt"
import { ListChecks, Sparkles, Tags, Users } from "lucide-react"
import * as React from "react"
import { recommendations } from "../_lib/insights"
import { AiWritingPanel } from "./ai-writing-panel"
import { AnalysisResult } from "./analysis-result"
import { ChecklistPanel } from "./checklist-panel"
import { CompetitorsPanel } from "./competitors-panel"
import { LegacyResult } from "./legacy-result"
import { Recommendations } from "./recommendations"
import { StatCards } from "./stat-cards"
import { TermsPanel } from "./terms-panel"

type Tab = "checks" | "competitors" | "terms" | "ai"

/**
 * A saved run (main column): result + key numbers + prioritized
 * recommendations, then the full details (checks, top pages, terms, AI writing).
 * The score breakdown / comparison sidebar is rendered by the screen.
 */
export function ResultView({ session, onRerun, rerunning }: {
  session: ContentOptSession
  onRerun: () => void
  rerunning: boolean
}) {
  const [tab, setTab] = React.useState<Tab>("checks")
  const recsRef = React.useRef<HTMLElement>(null)
  const detailsRef = React.useRef<HTMLElement>(null)
  const r = session.result
  const open = React.useMemo(() => recommendations(r).filter((x) => x.priority !== "good").length, [r])
  if (r.version < 2) return <LegacyResult session={session} />

  const issues = r.checks.filter((c) => c.status !== "pass").length
  const missing = r.terms.filter((t) => t.status === "missing").length

  return (
    <div className="space-y-4">
      <AnalysisResult session={session} openCount={open} rerunning={rerunning} onRerun={onRerun}
        onViewRecommendations={() => recsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} />

      <StatCards result={r} onViewChecks={() => {
        setTab("checks")
        detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }} />

      <section className="ai-overview rounded-2xl border px-5 py-4" aria-label="Summary">
        <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold"><Sparkles className="size-4 text-primary" /> Summary</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{r.summary}</p>
      </section>

      <Recommendations ref={recsRef} result={r} />

      <section ref={detailsRef} className="scroll-mt-4 space-y-3" aria-label="Details">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Details</h2>
          <SegmentedTabs<Tab> value={tab} onChange={setTab} label="Detail sections" items={[
            { value: "checks", label: "All checks", icon: ListChecks, count: issues },
            { value: "competitors", label: "Top pages", icon: Users, count: r.competitors.length },
            { value: "terms", label: "Terms", icon: Tags, count: missing },
            { value: "ai", label: "AI writing", icon: Sparkles },
          ]} />
        </div>
        <div role="tabpanel" className="min-h-64">
          {tab === "checks" && <ChecklistPanel checks={r.checks} />}
          {tab === "competitors" && <CompetitorsPanel session={session} />}
          {tab === "terms" && <TermsPanel terms={r.terms} pages={r.benchmark?.pages ?? 0} />}
          {tab === "ai" && <AiWritingPanel result={r} />}
        </div>
      </section>
    </div>
  )
}
