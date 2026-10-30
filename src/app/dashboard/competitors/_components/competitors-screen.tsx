"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompetitorList, useDiscoverCompetitors } from "@/hooks/api/use-competitors"
import { Loader2, Search, Sparkles, Users } from "lucide-react"
import Link from "next/link"
import { useCompetitorsScreen } from "../_hooks/use-competitors-screen"
import { BusinessProfilePanel } from "./business-profile-panel"
import { CompetitorRankTrendPanel } from "./competitor-rank-trend-panel"
import { DiscoverPanel } from "./discover-panel"
import { DiscoveryOverlay } from "./discovery-progress"
import { EditableCompetitorsPanel } from "./editable-competitors-panel"

export default function CompetitorsPage() {
  const { domainId } = useCompetitorsScreen()
  const { activeDomain } = useDashboard()

  return (
    <div className="space-y-6">
      <PageHeader title={<> <Users className="size-5 text-primary" /> Competitor Analysis </>} description={<> Track your competitors and how their search rank changes over time. Your list is
        fully editable — add or remove competitors whenever it&apos;s wrong. </>} />

      {!activeDomain ? <NoDomain what="competitor tracking" /> : <CompetitorsBody domainId={domainId} />}
    </div>
  )
}

function CompetitorsBody({ domainId }: { domainId: string }) {
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const list = useCompetitorList(workspaceId, domainId || null)
  const hasCompetitors = (list.data?.rows?.length ?? 0) > 0
  // One shared discovery instance drives every panel on this screen: the input
  // (hero or re-find panel) and the business-profile card at the top. That way
  // the profile card can show a loading state the moment discovery starts,
  // instead of sitting frozen (or blank) while the run happens below it.
  const discover = useDiscoverCompetitors(workspaceId, domainId || null)

  if (list.isPending && domainId) {
    return <Skeleton className="h-48 rounded-xl" />
  }

  // Extracted business details sit at the top, just below the page heading, so
  // the user sees the context their competitors were matched against. While a
  // discovery run is in flight it shows a loading state (a skeleton on the first
  // run, an "Updating…" badge when re-running over an existing profile).
  return (
    <>
      {/* Secondary context: the extracted site profile the competitors were matched
          against. Collapsed by default so the competitor list stays the focus. It
          sits just above the rank-trend section (one up from the bottom). */}
      {!hasCompetitors ? (
        // New / empty workspace: a single clear action to get started.
        <>
          <FindCompetitorsHero domainId={domainId} discover={discover} />
          <BusinessProfilePanel domainId={domainId} discovering={discover.isRunning} />
        </>
      ) : (
        // Has competitors: the full workspace (re-find, edit list, profile, rank trend).
        <>
          <DiscoverPanel domainId={domainId} discover={discover} />
          <EditableCompetitorsPanel domainId={domainId} />
          <BusinessProfilePanel domainId={domainId} discovering={discover.isRunning} />
          <CompetitorRankTrendPanel domainId={domainId} />
        </>
      )}

      {/* Centered, blurred modal that drives the whole run; replaces the old
          inline progress in both the hero and the re-find panel. */}
      <DiscoveryOverlay discover={discover} domain={activeDomain?.domain} />
    </>
  )
}

/** The single, prominent "get my competitors" call to action for a fresh workspace. */
function FindCompetitorsHero({
  domainId,
  discover,
}: {
  domainId: string
  discover: ReturnType<typeof useDiscoverCompetitors>
}) {
  const { activeDomain } = useDashboard()
  const busy = discover.isRunning
  const error = discover.error

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Sparkles className="size-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-semibold">Find your competitors</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            We analyze <span className="font-medium text-foreground">{activeDomain?.domain}</span> and find the
            top sites competing for your audience. No setup needed — this reads your site directly.
          </p>
        </div>
        <Button size="lg" onClick={() => discover.start({ extraServices: [] })} disabled={busy || !domainId} className="min-w-52">
          {busy ? <><Loader2 className="size-4 animate-spin" /> Finding competitors…</> : <><Search className="size-4" /> Find my competitors</>}
        </Button>
        {error ? <Alert variant="destructive" className="max-w-md text-left"><AlertDescription>{error}</AlertDescription></Alert> : null}
        <p className="mx-auto max-w-md text-xs text-muted-foreground">
          To track how your competitors rank over time, run a{" "}
          <Link href="/dashboard/keyword-analysis" className="font-medium text-primary hover:underline">Keyword Analysis</Link>{" "}
          and connect{" "}
          <Link href="/dashboard/search-performance" className="font-medium text-primary hover:underline">Google Search Console</Link>.
        </p>
      </CardContent>
    </Card>
  )
}
