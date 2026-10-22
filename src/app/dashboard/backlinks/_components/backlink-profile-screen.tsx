"use client"

import { AlertTriangle, History, Layers, Link2, Type, Unlink } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { Card } from "@/components/ui/card"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { ApiError, NetworkError } from "@/lib/api/client"
import { compact } from "../../competitive-strategy/_lib/competitive-strategy-helpers"
import { useBacklinkTarget } from "../_hooks/use-backlink-target"
import { AnchorQuality } from "./anchor-quality"
import { BacklinksTrendChart } from "./backlinks-trend-chart"
import { EmptyFetch, FetchButton, Stat } from "./fetch-controls"
import { FetchHistory, ProfileBreakdowns, ProfileChanges } from "./profile-overview"
import { ProfileLists } from "./profile-lists"
import { TargetBar } from "./target-bar"

const num = (n: number | null | undefined) => (n == null ? "—" : compact(n))
const errText = (e: unknown, f: string) => (e instanceof ApiError || e instanceof NetworkError ? e.message : f)

function rankTone(r: number | null) {
  if (r == null) return "text-muted-foreground"
  return r >= 50 ? "text-emerald-600 dark:text-emerald-400" : r >= 20 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
}

type Tab = "overview" | "anchors" | "changes"

export default function BacklinkOverviewPage() {
  const { wid, did, activeDomain, options, profile, data, details, analytics, refresh, target, setTarget } = useBacklinkTarget()
  const [tab, setTab] = React.useState<Tab>("overview")
  const shown = target ?? options?.your_domain ?? null
  const error = refresh.isError ? errText(refresh.error, "Fetch failed.")
    : profile.isError ? errText(profile.error, "Could not load backlinks.") : null

  function fetchNow(force: boolean) {
    if (!wid || !did) return
    refresh.mutate({ target, force }, { onSuccess: (d) => { if (d.fetched_now) toast.success(`Backlinks saved for ${d.target}`) } })
  }

  const HEADER = (
    <PageHeader title={<><Link2 className="size-5 text-primary" /> Backlink Profile</>}
      description="Who links to your site — and to your competitors. Stronger, relevant sites linking to you help you rank." />
  )
  if (!activeDomain) return <div className="space-y-6">{HEADER}<NoDomain what="backlinks" /></div>

  const s = data?.summary
  const busy = refresh.isPending

  return (
    <div className="space-y-6">
      {HEADER}
      <Card className="overflow-hidden p-0">
        <TargetBar options={options} shown={shown} data={data} busy={busy}
          onPick={(d) => setTarget(d === options?.your_domain ? null : d)} onFetch={fetchNow} />
        {error && <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        {profile.isPending && !data ? (
          <div className="border-t border-border">
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => <div key={i} className="space-y-2 bg-card px-6 py-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-16" /></div>)}
            </div>
            <TableSkeleton rows={6} columns={4} label="Loading backlinks…" />
          </div>
        ) : !data ? null : !s ? (
          <div className="border-t border-border">
            <EmptyFetch title={`No backlink data for ${data.target} yet`}
              body="Fetch its backlink profile: authority, how many sites link to it, the strongest links and the anchor texts they use."
              note={!data.can_fetch ? (data.environment === "live" && data.live_enabled
                ? "Only your own site and your tracked competitors can be fetched. Add it as a competitor first."
                : "Fetching new data is turned off right now.") : null}>
              <FetchButton state={data} busy={busy} onFetch={fetchNow} label="backlink profile" requests={4} big />
            </EmptyFetch>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Authority" value={s.rank ?? "—"} hint="Domain strength, 0–100, based on backlinks. Higher = stronger." tone={rankTone(s.rank)} />
              <Stat label="Backlinks" value={num(s.backlinks)} />
              <Stat label="Referring domains" value={num(s.referring_domains)} hint="Different websites linking — matters more than raw link count." />
              <Stat label="Dofollow domains" value={num(s.dofollow_referring_domains)} hint="Linking sites that pass ranking value." />
              <Stat label="Broken backlinks" value={num(s.broken_backlinks)} hint="Links pointing at pages that no longer work." tone={(s.broken_backlinks ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : undefined} />
              <Stat label="Spam score" value={s.spam_score ?? "—"} hint="0–100. Lower is better." tone={(s.spam_score ?? 0) >= 30 ? "text-red-500" : undefined} />
            </div>

            {((s.spam_score ?? 0) >= 30 || (s.spammy_share ?? 0) >= 0.5) && (
              <div className="flex gap-3 border-t border-amber-500/25 bg-amber-500/5 px-6 py-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-muted-foreground">
                  Most linking sites look automated{s.spammy_share != null ? ` — ${Math.round(s.spammy_share * 100)}% have a high spam score` : ""}. Google usually ignores these, so they rarely help or hurt. Real growth comes from relevant sites — see Explorer and Opportunities.
                </p>
              </div>
            )}
            {data.is_you && (s.broken_backlinks ?? 0) > 0 && (
              <div className="flex gap-3 border-t border-amber-500/25 bg-amber-500/5 px-6 py-3 text-sm">
                <Unlink className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <p className="text-muted-foreground">
                  {num(s.broken_backlinks)} backlinks point at pages on your site that no longer load — recover that value in <span className="font-medium text-foreground">Opportunities → Reclamation</span>.
                </p>
              </div>
            )}

            <div className="border-t border-border px-4 py-3">
              <SegmentedTabs<Tab> value={tab} onChange={setTab} label="Sections" items={[
                { value: "overview", label: "Overview", icon: Layers },
                { value: "anchors", label: "Anchors & Quality", icon: Type },
                { value: "changes", label: "New & Lost", icon: History },
              ]} />
            </div>
          </>
        )}
      </Card>

      {s && wid && did && (
        <>
          {tab === "overview" && (
            <>
              <Card className="p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Layers className="size-4 text-primary" /> Growth</h3>
                <BacklinksTrendChart data={analytics?.trend ?? []} />
              </Card>
              {details ? <ProfileBreakdowns details={details} /> : (
                <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4" aria-hidden="true">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div>
              )}
            </>
          )}
          {tab === "anchors" && (
            <>
              <AnchorQuality anchors={analytics?.anchors ?? null} diversity={analytics?.diversity ?? null} />
              <ProfileLists wid={wid} did={did} target={target} isYou={Boolean(data?.is_you)} lists={["anchors"]}
                counts={{ domains: 0, links: 0, anchors: data?.anchors.length ?? 0, reclaim: 0 }} />
            </>
          )}
          {tab === "changes" && (
            <>
              {details && <ProfileChanges details={details} />}
              <ProfileLists wid={wid} did={did} target={target} isYou={Boolean(data?.is_you)} lists={["links"]}
                counts={{ domains: 0, links: data?.backlinks.length ?? 0, anchors: 0, reclaim: 0 }} />
              {details && <FetchHistory details={details} />}
            </>
          )}
        </>
      )}
    </div>
  )
}
