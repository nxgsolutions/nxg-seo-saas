"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import {
  useCancelSubscription, usePlans, useSelectPlan, useSubscription,
} from "@/hooks/api/use-billing"
import { billingApi } from "@/lib/api/billing"
import { ApiError, NetworkError } from "@/lib/api/client"
import * as React from "react"
import { toast } from "sonner"
import { statusMeta } from "../_lib/billing-helpers"

export function useBillingScreen() {

  const { activeWorkspace } = useDashboard()

  const workspaceId = activeWorkspace?.id ?? null

  // Plans + subscription (TanStack Query; the subscription is shared with the sidebar card).
  const plansQuery = usePlans()
  const subQuery = useSubscription(workspaceId)
  const plans = plansQuery.data ?? []
  const sub = subQuery.data ?? null
  const loading = Boolean(workspaceId) && (plansQuery.isPending || subQuery.isPending)
  const selectMutation = useSelectPlan(workspaceId)
  const cancelMutation = useCancelSubscription(workspaceId)
  const selecting = selectMutation.isPending ? selectMutation.variables?.code ?? null : null

  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [notice, setNotice] = React.useState<string | null>(null)

  // Surface Stripe checkout return status.
  const [checkedParam, setCheckedParam] = React.useState(false)

  if (!checkedParam && typeof window !== "undefined") {
    setCheckedParam(true)
    const p = new URLSearchParams(window.location.search).get("checkout")
    if (p === "success") setNotice("Payment successful — your plan is now active.")
    else if (p === "cancel") setError("Checkout was cancelled.")
  }

  async function choose(code: string) {
    if (!workspaceId || selecting) return
    setError(null)
    setNotice(null)
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const res = await selectMutation.mutateAsync({
        code,
        successUrl: `${origin}/dashboard/billing?checkout=success`,
        cancelUrl: `${origin}/dashboard/billing?checkout=cancel`,
      })
      if (res.mode === "checkout" && res.checkout_url) {
        window.location.assign(res.checkout_url)
        return
      }
      if (res.subscription) {
        toast.success(code === "free" ? "You're on the Free plan." : "Your 1-year free trial has started.")
      }
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else if (err instanceof NetworkError) setError(err.message)
      else setError("Could not change your plan.")
    }
  }

  async function cancel() {
    if (!workspaceId) return
    setBusy(true)
    setError(null)
    const p = cancelMutation.mutateAsync()
    toast.promise(p, {
      loading: "Downgrading to Free…",
      success: "Your subscription was downgraded to Free.",
      error: "Could not cancel the subscription.",
    })
    try {
      await p
    } catch {
      /* toast shown */
    } finally {
      setBusy(false)
    }
  }

  async function manage() {
    if (!workspaceId) return
    setBusy(true)
    setError(null)
    try {
      const { url } = await billingApi.portal(workspaceId, window.location.href)
      window.location.assign(url)
    } catch (err) {
      if (err instanceof ApiError) setError(err.message)
      else setError("Could not open the billing portal.")
      setBusy(false)
    }
  }

  const meta = sub ? statusMeta(sub) : null
  return { plans, sub, selecting, busy, error, notice, loading, choose, cancel, manage, meta }
}
