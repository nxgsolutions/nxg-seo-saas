"use client"

import * as React from "react"
import { BarChart3, Bot, Cpu, Gauge, Loader2, Search, Sparkles, CreditCard } from "lucide-react"

import { toast } from "sonner"

import { integrationsApi } from "@/lib/api/integrations"
import { useConnectGsc, useDisconnectGsc } from "@/hooks/api/use-gsc"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { errorMessage } from "@/lib/api/client"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type State = "connected" | "configured" | "available" | "off"

function StatusPill({ state, text }: { state: State; text: string }) {
  const cls =
    state === "connected" || state === "available"
      ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
      : state === "configured"
        ? "bg-sky-500/12 text-sky-600 dark:text-sky-400"
        : "bg-muted text-muted-foreground"
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", cls)}>{text}</span>
}

function Row({
  icon: Icon,
  name,
  desc,
  children,
}: {
  icon: typeof Search
  name: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}


/** Operator-only status rows (not useful to customers). */
const SHOW_SERVER_SETUP = false

export function IntegrationsPanel() {
  const { activeWorkspace } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null

  // Integration status (TanStack Query); GSC connect / disconnect via the shared GSC hooks.
  const qc = useQueryClient()
  const statusQuery = useQuery({
    queryKey: ["ws", workspaceId ?? "", "integrations"],
    queryFn: () => integrationsApi.status(workspaceId!),
    enabled: Boolean(workspaceId),
  })
  const status = statusQuery.data ?? null
  const loading = statusQuery.isPending && Boolean(workspaceId)
  const connect = useConnectGsc(workspaceId)
  const disconnect = useDisconnectGsc(workspaceId)
  const busy = connect.isPending || disconnect.isPending
  const error = connect.isError ? errorMessage(connect.error, "Could not start the Google connection.")
    : disconnect.isError ? "Could not disconnect." : null

  function connectGsc() {
    if (workspaceId) connect.mutate("/dashboard/settings")
  }

  function disconnectGsc() {
    if (!workspaceId) return
    disconnect.mutate(undefined, {
      onSuccess: () => {
        void qc.invalidateQueries({ queryKey: ["ws", workspaceId, "integrations"] })
        toast.success("Google Search Console disconnected.")
      },
      onError: () => toast.error("Could not disconnect."),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Integrations</CardTitle>
        <CardDescription>Connect your data sources.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading || !status ? (
          <div className="space-y-3 py-2" role="status" aria-busy="true">
            <span className="sr-only">Loading integrations…</span>
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </div>
        ) : (
          <>
            {error ? <p className="mb-2 text-xs text-destructive">{error}</p> : null}
            <div>
              {/* Google Search Console */}
              <Row icon={BarChart3} name="Google Search Console" desc={status.gsc_connected ? (status.gsc_email ?? "Connected") : "Real ranking keywords & traffic for your sites"}>
                {status.gsc_connected ? (
                  <>
                    <StatusPill state="connected" text="Connected" />
                    <Button variant="outline" size="sm" onClick={disconnectGsc} disabled={busy}>Disconnect</Button>
                  </>
                ) : status.gsc_configured ? (
                  <Button size="sm" onClick={connectGsc} disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Connect
                  </Button>
                ) : (
                  <StatusPill state="off" text="Not set up" />
                )}
              </Row>

              {/* Server-side services (PageSpeed, DataForSEO, AI providers, Stripe) are
                  configured by the operator, not by users — hidden here. Set
                  SHOW_SERVER_SETUP to true to show their status rows again. */}
              {SHOW_SERVER_SETUP && (
                <>
                  {/* PageSpeed Insights */}
                  <Row icon={Gauge} name="PageSpeed Insights" desc="Core Web Vitals on Page Audit">
                    <StatusPill state={status.psi_configured ? "configured" : "off"} text={status.psi_configured ? "Configured" : "Not set up"} />
                  </Row>

                  {/* DataForSEO */}
                  <Row icon={Bot} name="DataForSEO" desc="Keyword volume, difficulty & competitor data">
                    <StatusPill state={status.dataforseo_configured ? "configured" : "off"} text={status.dataforseo_configured ? "Configured" : "Not set up"} />
                  </Row>

                  {/* Local AI */}
                  <Row icon={Cpu} name="Local AI (Ollama)" desc={status.ollama_available ? status.ollama_model : "Free, private AI for content optimization & AI Search"}>
                    <StatusPill state={status.ollama_available ? "available" : "off"} text={status.ollama_available ? "Running" : "Offline"} />
                  </Row>

                  {/* Anthropic */}
                  <Row icon={Sparkles} name="Claude (Anthropic)" desc="Optional cloud AI for AI Search">
                    <StatusPill state={status.anthropic_configured ? "configured" : "off"} text={status.anthropic_configured ? "Configured" : "Not set up"} />
                  </Row>

                  {/* Stripe */}
                  <Row icon={CreditCard} name="Stripe" desc="Payments for paid subscriptions">
                    <StatusPill state={status.stripe_configured ? "configured" : "off"} text={status.stripe_configured ? "Configured" : "Not set up"} />
                  </Row>
                </>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
