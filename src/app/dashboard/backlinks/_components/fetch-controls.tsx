"use client"

import { CloudDownload, Inbox, Loader2, RefreshCw } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Modal } from "@/components/dashboard/domain-dialogs"
import { cn, timeAgo } from "@/lib/utils"

export interface FetchState {
  environment: "live" | "sandbox"
  live_enabled: boolean
  can_fetch: boolean
  estimated_cost: number
  fetched_at: string | null
  cost: number | null
}

export const usd = (n: number) => (n > 0 ? `~$${n.toFixed(n < 0.1 ? 3 : 2)}` : "free")


/** "Data saved · fetched 3d ago · cost $0.11" or "No data yet". */
export function DataStatus({ state, what }: { state: FetchState; what: string }) {
  return state.fetched_at ? (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2 rounded-full bg-emerald-500" />
      <span className="font-medium text-emerald-700 dark:text-emerald-400">Data saved</span>
      · fetched {timeAgo(state.fetched_at)}
      {/* Cost is kept out of the UI: state.cost has the provider-reported USD of this fetch. */}
    </p>
  ) : (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2 rounded-full bg-amber-500" />
      <span className="font-medium text-amber-700 dark:text-amber-400">No data yet</span> · {what} not fetched
    </p>
  )
}

/**
 * Fetch / Refresh button. In a live workspace it asks first and states the
 * price — the data is saved, so the user pays once per click, never on page load.
 */
export function FetchButton({ state, busy, onFetch, label, big = false, disabledReason }: {
  state: FetchState
  busy: boolean
  /** force = re-fetch saved data */
  onFetch: (force: boolean) => void
  /** e.g. "backlink profile" */
  label: string
  /** Paid requests this fetch makes (not shown; for reference). */
  requests: number
  big?: boolean
  disabledReason?: string | null
}) {
  const [confirming, setConfirming] = React.useState(false)
  const refresh = Boolean(state.fetched_at)
  const live = state.environment === "live"
  const blocked = !state.can_fetch || !!disabledReason

  function click() {
    if (live) setConfirming(true)
    else onFetch(refresh)
  }

  return (
    <>
      <Button size={big ? "default" : "sm"} variant={refresh ? "outline" : "default"} disabled={busy || blocked}
        onClick={click} title={disabledReason ?? (!state.can_fetch ? "Fetching is turned off right now" : undefined)}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : refresh ? <RefreshCw className="size-4" /> : <CloudDownload className="size-4" />}
        {busy ? "Fetching…" : refresh ? "Refresh" : `Fetch ${label}`}
        {/* Price hidden in the UI — estimated USD is in state.estimated_cost (usd()). */}
      </Button>
      <Modal open={confirming} onOpenChange={setConfirming}
        title={refresh ? `Refresh ${label}?` : `Fetch ${label}?`}
        description="This gets the latest data and saves it.">
        <div className="space-y-4 text-sm">
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            {/* Estimated cost (not shown): usd(state.estimated_cost) for `requests` paid requests. */}
            <p className="text-muted-foreground">
              The result is saved, so you only need to refresh when you want newer numbers.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button>
            <Button onClick={() => { setConfirming(false); onFetch(refresh) }}>
              <CloudDownload className="size-4" /> {refresh ? "Refresh" : "Fetch"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

/** Centered "nothing saved yet" panel with the fetch action. */
export function EmptyFetch({ title, body, children, note }: {
  title: string; body: string; children: React.ReactNode; note?: string | null
}) {
  return (
    <div className="px-6 py-12 text-center">
      <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Inbox className="size-5" />
      </div>
      <p className="font-medium">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      <div className="mt-4 flex justify-center">{children}</div>
      {note && <p className="mt-2 text-xs text-muted-foreground">{note}</p>}
    </div>
  )
}

/** Small stat tile. */
export function Stat({ label, value, hint, tone }: { label: string; value: React.ReactNode; hint?: string; tone?: string }) {
  return (
    <div className="bg-card px-5 py-3">
      <p className="text-xs text-muted-foreground" title={hint}>{label}</p>
      <p className={cn("text-xl font-semibold tabular-nums", tone)}>{value}</p>
    </div>
  )
}
