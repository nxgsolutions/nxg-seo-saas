"use client"

import { ScanSearch } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card } from "@/components/ui/card"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { ApiError, NetworkError } from "@/lib/api/client"
import { useBacklinkTarget } from "../_hooks/use-backlink-target"
import { EmptyFetch, FetchButton } from "./fetch-controls"
import { ProfileLists } from "./profile-lists"
import { TargetBar } from "./target-bar"

const errText = (e: unknown, f: string) => (e instanceof ApiError || e instanceof NetworkError ? e.message : f)

export default function ExplorerScreen() {
  const { wid, did, activeDomain, options, profile, data, refresh, target, setTarget } = useBacklinkTarget()
  const shown = target ?? options?.your_domain ?? null
  const busy = refresh.isPending
  const error = refresh.isError ? errText(refresh.error, "Fetch failed.")
    : profile.isError ? errText(profile.error, "Could not load backlinks.") : null

  function fetchNow(force: boolean) {
    if (!wid || !did) return
    refresh.mutate({ target, force }, { onSuccess: (d) => { if (d.fetched_now) toast.success(`Backlinks saved for ${d.target}`) } })
  }

  const HEADER = (
    <PageHeader title={<><ScanSearch className="size-5 text-primary" /> Backlink Explorer</>}
      description="Browse every linking site, backlink and linked page. Click a row for the full detail." />
  )
  if (!activeDomain) return <div className="space-y-6">{HEADER}<NoDomain what="backlinks" /></div>

  const s = data?.summary
  return (
    <div className="space-y-6">
      {HEADER}
      <Card className="overflow-hidden p-0">
        <TargetBar options={options} shown={shown} data={data} busy={busy}
          onPick={(d) => setTarget(d === options?.your_domain ? null : d)} onFetch={fetchNow} />
        {error && <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}
        {profile.isPending && !data ? (
          <div className="border-t border-border"><TableSkeleton rows={8} columns={4} label="Loading backlinks…" /></div>
        ) : !data ? null : !s ? (
          <div className="border-t border-border">
            <EmptyFetch title={`No backlink data for ${data.target} yet`} body="Fetch its backlink profile to explore every linking site, backlink and linked page."
              note={!data.can_fetch ? "Fetching new data is turned off right now." : null}>
              <FetchButton state={data} busy={busy} onFetch={fetchNow} label="backlink profile" requests={4} big />
            </EmptyFetch>
          </div>
        ) : null}
      </Card>

      {s && wid && did && (
        <ProfileLists wid={wid} did={did} target={target} isYou={Boolean(data?.is_you)} lists={["domains", "links", "pages"]}
          counts={{ domains: data?.referring_domains.length ?? 0, links: data?.backlinks.length ?? 0, anchors: 0, reclaim: 0 }} />
      )}
    </div>
  )
}
