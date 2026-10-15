"use client"

import { AuditHealthPanel } from "./audit-health-panel"
import { AuditIssuesPanel } from "./audit-issues-panel"
import { AuditTrendPanel } from "./audit-trend-panel"
import { ActionPlanTeaser } from "./action-plan-teaser"
import { DomainHealthPanel } from "./domain-health-panel"
import { QuickActionsPanel } from "./quick-actions-panel"
import { RecentAuditsPanel } from "./recent-audits-panel"

import { PageHeader } from "@/components/dashboard/page-header"
import { SearchKpis } from "@/components/dashboard/search-kpis"
import { SearchSnapshot } from "@/components/dashboard/search-snapshot"
import { SetupChecklist } from "@/components/dashboard/setup-checklist"
import { Button } from "@/components/ui/button"
import { Gauge } from "lucide-react"
import Link from "next/link"
import { useOverviewScreen } from "../_hooks/use-overview-screen"

export default function OverviewPage() {
  const {
    user,
    activeWorkspace,
    workspaceId,
    domains,
    activeDomain,
    audits,
    loading,
    latest,
    health,
    issues,
    siteScores,
  } = useOverviewScreen()

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={activeWorkspace?.name ?? "Your workspace"}
        title={<>Welcome back, {user.first_name}</>}
        description="Your search visibility, site health, and next steps. All in one place."
        actions={
          <Button size="lg" render={<Link href="/dashboard/page-audit" />}>
            <Gauge data-icon="inline-start" />
            Run a page audit
          </Button>
        }
      />

      {/* Outcome-first: how search is actually doing (real GSC data). */}
      <SearchKpis workspaceId={workspaceId} domain={activeDomain} />

      <SetupChecklist
        workspaceId={workspaceId}
        domains={domains}
        audits={audits}
      />

      {/* The actionable middle: what to do next, pulled from the Action Plan. */}
      <ActionPlanTeaser wid={workspaceId} did={activeDomain?.id ?? null} />

      {/* Trend + latest audit health */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SearchSnapshot workspaceId={workspaceId} domain={activeDomain} />
        </div>
        <AuditHealthPanel latest={latest} health={health} />
      </div>

      {/* Audit score trend + quick actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AuditTrendPanel
          activeWorkspace={activeWorkspace}
          audits={audits}
          loading={loading}
        />
        <QuickActionsPanel />
      </div>

      {/* Top issues + domains */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AuditIssuesPanel latest={latest} issues={issues} />
        <DomainHealthPanel
          domains={domains}
          loading={loading}
          siteScores={siteScores}
        />
      </div>

      {/* Recent audits */}
      {audits.length > 0 ? <RecentAuditsPanel audits={audits} /> : null}
    </div>
  )
}
