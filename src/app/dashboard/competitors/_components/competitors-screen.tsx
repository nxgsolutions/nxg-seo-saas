"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useCompetitorList, useDiscoverCompetitors } from "@/hooks/api/use-competitors"
import { errorMessage } from "@/lib/api/client"
import { Loader2, Search, Sparkles, Users } from "lucide-react"
import Link from "next/link"
import { useCompetitorsScreen } from "../_hooks/use-competitors-screen"
import { CompetitorRankTrendPanel } from "./competitor-rank-trend-panel"
import { DiscoverPanel } from "./discover-panel"
import { EditableCompetitorsPanel } from "./editable-competitors-panel"

export default function CompetitorsPage() {
  const { domainId } = useCompetitorsScreen()
  const { activeDomain } = useDashboard()

  return (
    <div className="space-y-6">
      <PageHeader title={<> <Users className="size-5 text-primary" /> Tracked Competitors </>} description={<> Track your competitors and how their search rank changes over time. Your list is
        fully editable — add or remove competitors whenever it&apos;s wrong. </>} />

      {!activeDomain ? <NoDomain what="competitor tracking" /> : <CompetitorsBody domainId={domainId} />}
    </div>
  )
}

function CompetitorsBody({ domainId }: { domainId: string }) {
  const { activeWorkspace } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const list = useCompetitorList(workspaceId, domainId || null)
  const hasCompetitors = (list.data?.rows?.length ?? 0) > 0

  if (list.isPending && domainId) {
    return <Skeleton className="h-48 rounded-xl" />
  }

  // New / empty workspace: a single clear action to get started.
  if (!hasCompetitors) return <FindCompetitorsHero domainId={domainId} />

  // Has competitors: the full workspace (re-find, edit list, rank trend).
  return (
    <>
      <DiscoverPanel domainId={domainId} />
      <EditableCompetitorsPanel domainId={domainId} />
      <CompetitorRankTrendPanel domainId={domainId} />
    </>
  )
}

/** The single, prominent "get my competitors" call to action for a fresh workspace. */
function FindCompetitorsHero({ domainId }: { domainId: string }) {
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const discover = useDiscoverCompetitors(workspaceId, domainId || null)
  const busy = discover.isPending
  const error = discover.isError ? errorMessage(discover.error, "Could not find competitors. Please try again.") : null

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
        <Button size="lg" onClick={() => discover.mutate({ extraServices: [] })} disabled={busy || !domainId} className="min-w-52">
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
