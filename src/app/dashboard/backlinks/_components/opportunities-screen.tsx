"use client"

import { Split, Unlink } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Card } from "@/components/ui/card"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useBacklinkProfile, useRefreshBacklinkProfile } from "@/hooks/api/use-backlinks"
import { EmptyFetch, FetchButton } from "./fetch-controls"
import LinkGapPage from "./link-gap-screen"
import { ProfileLists } from "./profile-lists"

function ReclamationScreen() {
  const { activeWorkspace, activeDomain } = useDashboard()
  const wid = activeWorkspace?.id ?? null
  const did = activeDomain?.id ?? null
  const profile = useBacklinkProfile(wid, did, null)
  const refresh = useRefreshBacklinkProfile(wid, did)
  const data = profile.data ?? null
  const s = data?.summary

  function fetchNow(force: boolean) {
    if (!wid || !did) return
    refresh.mutate({ target: null, force }, { onSuccess: (d) => { if (d.fetched_now) toast.success("Backlinks saved") } })
  }
  if (!wid || !did) return null

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pages on your site that still have backlinks but no longer load. Fix the highest-authority ones first to win back that link value.
      </p>
      {profile.isPending && !data ? (
        <Card className="p-0"><TableSkeleton rows={6} columns={4} label="Loading…" /></Card>
      ) : !s ? (
        <Card className="p-0">
          <EmptyFetch title="No backlink data yet" body="Fetch your backlink profile to find broken links worth reclaiming."
            note={data && !data.can_fetch ? "Fetching new data is turned off right now." : null}>
            {data && <FetchButton state={data} busy={refresh.isPending} onFetch={fetchNow} label="backlink profile" requests={4} big />}
          </EmptyFetch>
        </Card>
      ) : (
        <ProfileLists wid={wid} did={did} target={null} isYou lists={["reclaim"]}
          counts={{ domains: 0, links: 0, anchors: 0, reclaim: data?.backlinks.filter((b) => b.is_broken).length ?? 0 }} />
      )}
    </div>
  )
}

type Tab = "gap" | "reclaim"

export default function OpportunitiesScreen() {
  const { activeDomain } = useDashboard()
  const [tab, setTab] = React.useState<Tab>("gap")
  const HEADER = (
    <PageHeader title={<><Split className="size-5 text-primary" /> Opportunities</>}
      description="Turn backlink data into link-building actions: gaps to close and broken links to reclaim." />
  )
  if (!activeDomain) return <div className="space-y-6">{HEADER}<NoDomain what="opportunities" /></div>
  return (
    <div className="space-y-6">
      {HEADER}
      <SegmentedTabs<Tab> value={tab} onChange={setTab} label="Opportunities" items={[
        { value: "gap", label: "Link Gap", icon: Split },
        { value: "reclaim", label: "Reclamation", icon: Unlink },
      ]} />
      {tab === "gap" ? <LinkGapPage embedded /> : <ReclamationScreen />}
    </div>
  )
}
