"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { useDiscoverCompetitors } from "@/hooks/api/use-competitors"
import { Loader2, Search, Sparkles } from "lucide-react"
import * as React from "react"

export function DiscoverPanel({
  domainId,
  discover,
}: {
  domainId: string
  discover: ReturnType<typeof useDiscoverCompetitors>
}) {
  const { activeWorkspace, domains } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  // Prefilled with the selected website's domain until the user types.
  const [typed, setTarget] = React.useState<string | null>(null)
  const target = typed ?? domains.find((x) => x.id === domainId)?.domain ?? ""
  const [extra, setExtra] = React.useState("")
  const busy = discover.isRunning
  const error = discover.error
  const note = discover.isDone && discover.job
    ? `Found ${discover.job.count ?? 0} competitors.`
    : null

  function run(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceId || !domainId) return
    const extraServices = extra.split(",").map((s) => s.trim()).filter(Boolean)
    discover.start({ targetDomain: target.trim() || undefined, extraServices })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" /> Find competitors
        </CardTitle>
        <CardDescription>
          Enter a domain — the AI analyzes the site and fetches its top 10 competitors,
          replacing the auto-found list (your manually-added ones are kept).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {error ? (
          <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>
        ) : null}
        <form onSubmit={run} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="yourdomain.com"
              disabled={busy || !domainId}
              className="h-10 pl-9"
            />
          </div>
          <Button type="submit" size="lg" disabled={busy || !domainId} className="sm:w-44">
            {busy ? <><Loader2 className="size-4 animate-spin" /> Finding…</> : <><Sparkles className="size-4" /> Find competitors</>}
          </Button>
        </form>
        <Input
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="Optional: extra services/features to target (comma-separated), e.g. AI-based Mains answer evaluation"
          disabled={busy || !domainId}
          className="h-9 text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Add features not yet on your site to steer the match; leave blank to use only the scraped services.
        </p>
        {/* Live progress is shown in the centered DiscoveryOverlay (rendered once
            by the screen), so there's no inline progress block here. */}
        {note && !busy ? <p className="text-xs text-muted-foreground">{note}</p> : null}
      </CardContent>
    </Card>
  )
}
