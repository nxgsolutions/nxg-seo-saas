"use client"

import * as React from "react"

import { CompetitorCombobox, type CompetitorOption } from "@/components/dashboard/competitor-combobox"
import { timeAgo } from "@/lib/utils"
import type { BacklinkOptions, BacklinkProfile } from "@/lib/api/backlinks"
import { DataStatus, FetchButton } from "./fetch-controls"

/** Domain picker + saved-data status + Fetch/Refresh, shared by Overview and Explorer. */
export function TargetBar({ options, shown, data, busy, onPick, onFetch }: {
  options: BacklinkOptions | null
  shown: string | null
  data: BacklinkProfile | null
  busy: boolean
  onPick: (domain: string) => void
  onFetch: (force: boolean) => void
}) {
  const comboOptions = React.useMemo<CompetitorOption[]>(() => (options?.domains ?? []).map((d) => ({
    domain: d.domain,
    group: d.is_you ? "Your site" : d.fetched_at ? "Recently checked" : "Your competitors — no data yet",
    hint: d.fetched_at ? timeAgo(d.fetched_at) : undefined,
  })), [options])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate text-lg font-semibold">{shown}</h2>
          {data?.is_you && <span className="rounded bg-muted px-1.5 py-px text-xs text-muted-foreground">your site</span>}
        </div>
        {data && <DataStatus state={data} />}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CompetitorCombobox options={comboOptions} onPick={onPick} value={shown}
          className="sm:w-80" placeholder="Pick or type a domain…" />
        {data?.fetched_at && <FetchButton state={data} busy={busy} onFetch={onFetch} label="backlink profile" requests={4} />}
      </div>
    </div>
  )
}
