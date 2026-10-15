"use client"

import { ArrowRight, BarChart3, Loader2, Search, ShieldCheck, TrendingUp } from "lucide-react"
import { toast } from "sonner"

import { Modal } from "@/components/dashboard/domain-dialogs"
import { Button } from "@/components/ui/button"
import { useConnectGsc, useGscStatus } from "@/hooks/api/use-gsc"

const BENEFITS = [
  { icon: TrendingUp, text: "Your real clicks, impressions and average position" },
  { icon: Search, text: "The exact search queries people find you with" },
  { icon: BarChart3, text: "Rank tracking and competitor insights from live data" },
]

/**
 * Inline Google Search Console connect flow — opened from the dashboard
 * (setup checklist, Search Performance) so a new user never has to hunt
 * through Settings. Explains what connecting does, then starts Google OAuth
 * and returns to `returnPath` (default: the dashboard).
 */
export function ConnectGscDialog({
  workspaceId,
  open,
  onOpenChange,
  returnPath = "/dashboard",
}: {
  workspaceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  returnPath?: string
}) {
  const gsc = useGscStatus(workspaceId)
  const connect = useConnectGsc(workspaceId)
  const configured = gsc.data?.configured ?? null
  const notConfigured = configured === false

  function start() {
    if (!workspaceId) return
    connect.mutate(returnPath, {
      onError: () => toast.error("Could not start the Google connection. Please try again."),
    })
  }

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { if (!connect.isPending) onOpenChange(o) }}
      title="Connect Google Search Console"
      description="See how you really rank on Google — straight from your own Search Console."
    >
      <div className="space-y-5">
        <ul className="space-y-2.5">
          {BENEFITS.map((b) => (
            <li key={b.text} className="flex items-start gap-2.5 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <b.icon className="size-3.5" />
              </span>
              <span className="text-muted-foreground">{b.text}</span>
            </li>
          ))}
        </ul>

        {notConfigured ? (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm text-amber-700 dark:text-amber-400">
            Google Search Console isn’t set up on this server yet. Ask your admin to add Google
            OAuth credentials, then you can connect it right here.
          </div>
        ) : (
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            You’ll pick your Google account and approve <strong className="font-medium text-foreground">read-only</strong> access.
            We never post or change anything on your account.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={connect.isPending}>
            Cancel
          </Button>
          <Button onClick={start} disabled={connect.isPending || gsc.isPending || notConfigured}>
            {connect.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Connect with Google <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </Modal>
  )
}
