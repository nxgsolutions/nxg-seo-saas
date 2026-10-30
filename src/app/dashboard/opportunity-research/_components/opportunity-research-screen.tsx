"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { cn } from "@/lib/utils"
import { TrendingUp } from "lucide-react"
import { useOpportunityResearchScreen } from "../_hooks/use-opportunity-research-screen"
import { TABS } from "../_lib/opportunity-research-helpers"
import { NoDomain } from "@/components/dashboard/current-domain"
import { ActionPlan } from "./action-plan"
import { OpportunityKeywords } from "./opportunity-keywords"
import { QuickWins } from "./quick-wins"

export default function OpportunityResearchPage() {
  const { workspaceId, domainId, tab, setTab } = useOpportunityResearchScreen()

  const ready = !!workspaceId && !!domainId

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Keyword research"
        title={
          <>
            <TrendingUp /> Action Plan
          </>
        }
        description="What to do next: improve rankings you already have, win keywords from competitors, and target easy new keywords — prioritised by the traffic they can bring."
      />

      <div className="flex gap-4 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap border-b-2 pb-2 text-sm font-semibold uppercase tracking-wide transition-colors",
              tab === t.key
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!ready ? (
        <NoDomain what="opportunity research" />
      ) : tab === "action" ? (
        <ActionPlan key={domainId} wid={workspaceId} did={domainId} />
      ) : tab === "keywords" ? (
        <OpportunityKeywords key={domainId} wid={workspaceId} did={domainId} />
      ) : (
        <QuickWins wid={workspaceId} did={domainId} />
      )}
    </div>
  )
}
