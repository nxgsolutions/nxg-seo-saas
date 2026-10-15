"use client"

import { AlertTriangle, Link2 } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { CompetitorCombobox, type CompetitorOption } from "@/components/dashboard/competitor-combobox"
import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Skeleton } from "@/components/ui/skeleton"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useBacklinkDetails, useBacklinkOptions, useBacklinkProfile, useRefreshBacklinkProfile } from "@/hooks/api/use-backlinks"
import { Card } from "@/components/ui/card"
import { ApiError, NetworkError } from "@/lib/api/client"
import { cn, timeAgo } from "@/lib/utils"
import { compact } from "../../competitive-strategy/_lib/competitive-strategy-helpers"
import { DataStatus, EmptyFetch, FetchButton, Stat } from "./fetch-controls"
import { FetchHistory, ProfileBreakdowns, ProfileChanges } from "./profile-overview"
import { ProfileLists } from "./profile-lists"

const num = (n: number | null | undefined) => (n == null ? "—" : compact(n))
const errText = (e: unknown, f: string) => (e instanceof ApiError || e instanceof NetworkError ? e.message : f)

function rankTone(r: number | null) {
  if (r == null) return "text-muted-foreground"
  return r >= 50 ? "text-emerald-600 dark:text-emerald-400" : r >= 20 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
}

export default function BacklinkProfilePage() {
  const { activeWorkspace, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const domainId = activeDomain?.id ?? null
  // Domain being viewed (null = your own site).
  const [target, setTarget] = React.useState<string | null>(null)

  // Saved data only (TanStack Query); Fetch / Refresh is the paid call.
  const options = useBacklinkOptions(workspaceId, domainId).data ?? null
  const profile = useBacklinkProfile(workspaceId, domainId, target)
  const refresh = useRefreshBacklinkProfile(workspaceId, domainId)
  const data = profile.data ?? null
  // Breakdowns, history and changes — only once a profile is saved.
  const details = useBacklinkDetails(workspaceId, domainId, target, Boolean(data?.summary)).data ?? null
  const busy = refresh.isPending
  const error = refresh.isError ? errText(refresh.error, "Fetch failed.")
    : profile.isError ? errText(profile.error, "Could not load backlinks.") : null

  const shown = target ?? options?.your_domain ?? null

  function fetchNow(force: boolean) {
    if (!workspaceId || !domainId) return
    refresh.mutate({ target, force }, {
      onSuccess: (d) => { if (d.fetched_now) toast.success(`Backlinks saved for ${d.target}`) },
    })
  }

  const comboOptions = React.useMemo<CompetitorOption[]>(() => (options?.domains ?? []).map((d) => ({
    domain: d.domain,
    group: d.is_you ? "Your site" : d.fetched_at ? "Data saved" : "Your competitors — no data yet",
    hint: d.fetched_at ? timeAgo(d.fetched_at) : undefined,
  })), [options])

  if (!activeDomain) {
    return (
      <div className="space-y-6">
        <PageHeader title={<><Link2 className="size-5 text-primary" /> Backlink Profile</>} description="Who links to your site — and to your competitors." />
        <NoDomain what="backlinks" />
      </div>
    )
  }

  const loading = profile.isPending
  const s = data?.summary

  return (
    <div className="space-y-6">
      <PageHeader title={<><Link2 className="size-5 text-primary" /> Backlink Profile</>}
        description="Who links to your site — and to your competitors. Stronger, relevant sites linking to you help you rank." />

      <Card className="overflow-hidden p-0">
        {/* Domain + status + action */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold">{shown}</h2>
              {data?.is_you && <span className="rounded bg-muted px-1.5 py-px text-xs text-muted-foreground">your site</span>}
            </div>
            {data && <DataStatus state={data} what="backlinks" />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CompetitorCombobox options={comboOptions} onPick={(d) => setTarget(d === options?.your_domain ? null : d)}
              value={shown} className="sm:w-80" placeholder="Pick or type a domain…" />
            {data?.fetched_at && <FetchButton state={data} busy={busy} onFetch={fetchNow} label="backlink profile" requests={4} />}
          </div>
        </div>

        {error && <div className="mx-6 mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

        {loading && !data ? (
          <div className="border-t border-border">
            <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2 bg-card px-6 py-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-6 w-16" /></div>
              ))}
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
          <div className={cn("transition-opacity", loading && "opacity-60")}>
            <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Authority" value={s.rank ?? "—"} hint="Domain strength, 0–100, based on backlinks. Higher = stronger." tone={rankTone(s.rank)} />
              <Stat label="Backlinks" value={num(s.backlinks)} />
              <Stat label="Referring domains" value={num(s.referring_domains)} hint="Different websites linking — matters more than raw link count." />
              <Stat label="Dofollow domains" value={num(s.dofollow_referring_domains)} hint="Linking sites that pass ranking value." />
              <Stat label="Broken backlinks" value={num(s.broken_backlinks)} hint="Links pointing at pages that no longer work — fix or redirect them." tone={(s.broken_backlinks ?? 0) > 0 ? "text-amber-600 dark:text-amber-400" : undefined} />
              <Stat label="Spam score" value={s.spam_score ?? "—"} hint="0–100. Lower is better." tone={(s.spam_score ?? 0) >= 30 ? "text-red-500" : undefined} />
            </div>

            {/* Plain-language read of a spam-heavy profile (common for new sites). */}
            {((s.spam_score ?? 0) >= 30 || (s.spammy_share ?? 0) >= 0.5) && (
              <div className="flex gap-3 border-t border-amber-500/25 bg-amber-500/5 px-6 py-3 text-sm">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-medium">
                    Most of these links look automated
                    {s.spammy_share != null ? ` — ${Math.round(s.spammy_share * 100)}% of linking sites have a high spam score` : ""}.
                  </p>
                  <p className="text-muted-foreground">
                    Auto-generated &ldquo;SEO checker&rdquo; and &ldquo;buy backlinks&rdquo; sites link to thousands of domains.
                    Google usually ignores them, so they rarely help or hurt — that&apos;s also why Authority is low.
                    Real growth comes from relevant sites in your niche: check <a href="/dashboard/backlinks/gap" className="text-primary hover:underline">Link Gap</a> for
                    sites already linking to your competitors.
                  </p>
                </div>
              </div>
            )}

          </div>
        )}
      </Card>

      {s && workspaceId && domainId && (
        <>
          {details && <ProfileChanges details={details} />}
          {details ? <ProfileBreakdowns details={details} /> : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
            </div>
          )}
          <ProfileLists wid={workspaceId} did={domainId} target={target}
            counts={{ domains: data?.referring_domains.length ?? 0, links: data?.backlinks.length ?? 0, anchors: data?.anchors.length ?? 0 }} />
          {details && <FetchHistory details={details} />}
        </>
      )}
    </div>
  )
}
