"use client"

import { Loader2, ShoppingBag } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { useConnectShopify, useDisconnectShopify, useShopifyStatus } from "@/hooks/api/use-shopify"
import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"
import { errorMessage } from "@/lib/api/client"
import { cn } from "@/lib/utils"

const MANAGER_ROLES = new Set(["owner", "admin"])

/**
 * Shopify row for Settings → Integrations. Connects a store to the ACTIVE
 * domain; the backend only accepts a store whose domain matches it.
 */
export function ShopifyIntegration() {
  const workspace = useActiveWorkspace()
  const domain = useActiveDomain()
  const wid = workspace?.id ?? null
  const did = domain?.id ?? null
  const canManage = MANAGER_ROLES.has(workspace?.role ?? "")

  const status = useShopifyStatus(wid, did)
  const connect = useConnectShopify(wid, did)
  const disconnect = useDisconnectShopify(wid, did)
  const [shop, setShop] = React.useState("")
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const data = status.data
  const busy = connect.isPending || disconnect.isPending

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = shop.trim()
    if (!value) return
    connect.mutate(
      { shop: value, returnPath: "/dashboard/settings" },
      { onError: (err) => toast.error(errorMessage(err, "Could not start the Shopify connection.")) },
    )
  }

  return (
    <div className="border-b border-border py-3 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <ShoppingBag className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">Shopify</p>
            <p className="truncate text-xs text-muted-foreground">
              {data?.connected
                ? `${data.shop_name ?? data.shop} · ${data.primary_host ?? data.shop}`
                : domain
                  ? `Edit product & page SEO for ${domain.domain} and publish to your store`
                  : "Add a domain first, then connect its Shopify store"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {status.isPending && did ? (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          ) : data?.connected ? (
            <>
              <Pill tone="ok">Connected</Pill>
              {canManage ? (
                <Button variant="outline" size="sm" onClick={() => setConfirmOpen(true)} disabled={busy}>
                  Disconnect
                </Button>
              ) : null}
            </>
          ) : data?.status === "revoked" ? (
            <Pill tone="warn">App removed in Shopify</Pill>
          ) : data && !data.configured ? (
            <Pill tone="off">Not set up</Pill>
          ) : null}
        </div>
      </div>

      {data && data.configured && !data.connected && domain && canManage ? (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 pl-11 sm:flex-row sm:items-center">
          <Input
            value={shop}
            onValueChange={setShop}
            placeholder="your-store.myshopify.com"
            aria-label="Shopify store address"
            className="sm:max-w-xs"
            disabled={busy}
          />
          <Button type="submit" size="sm" disabled={busy || !shop.trim()}>
            {connect.isPending ? <Loader2 className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}
            {data.status === "revoked" ? "Reconnect" : "Connect"}
          </Button>
          <p className="text-xs text-muted-foreground sm:ml-2">
            The store&apos;s domain must be <span className="font-medium text-foreground">{domain.domain}</span>.
          </p>
        </form>
      ) : null}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Disconnect ${data?.shop_name ?? data?.shop ?? "Shopify"}?`}
        description="Imported pages stay in Page Discovery, but you won't be able to publish changes to the store until you reconnect."
        confirmLabel="Disconnect"
        onConfirm={async () => {
          await disconnect.mutateAsync()
          toast.success("Shopify disconnected.")
        }}
      />
    </div>
  )
}

function Pill({ tone, children }: { tone: "ok" | "warn" | "off"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "ok" && "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
        tone === "warn" && "bg-amber-500/12 text-amber-700 dark:text-amber-400",
        tone === "off" && "bg-muted text-muted-foreground",
      )}
    >
      {children}
    </span>
  )
}
