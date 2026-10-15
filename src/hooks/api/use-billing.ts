"use client"

/** Billing (TanStack Query). One cached subscription per workspace, shared by
 * the Billing page and the sidebar plan card. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { billingApi, plansApi, type Subscription } from "@/lib/api/billing"

const subKey = (wid: string) => ["ws", wid, "subscription"] as const

export function useSubscription(wid: string | null) {
  return useQuery({
    queryKey: subKey(wid ?? ""),
    queryFn: () => billingApi.subscription(wid!),
    enabled: Boolean(wid),
  })
}

/** The plan catalogue (same for everyone; rarely changes). */
export function usePlans() {
  return useQuery({ queryKey: ["plans"], queryFn: () => plansApi.list(), staleTime: 30 * 60_000 })
}

/** Store a returned subscription so the page and sidebar card update together. */
function useSetSubscription(wid: string | null) {
  const qc = useQueryClient()
  return (sub: Subscription) => qc.setQueryData(subKey(wid ?? ""), sub)
}

export function useSelectPlan(wid: string | null) {
  const setSub = useSetSubscription(wid)
  return useMutation({
    mutationFn: (v: { code: string; successUrl: string; cancelUrl: string }) =>
      billingApi.select(wid!, v.code, v.successUrl, v.cancelUrl),
    onSuccess: (res) => { if (res.subscription) setSub(res.subscription) },
  })
}

export function useCancelSubscription(wid: string | null) {
  const setSub = useSetSubscription(wid)
  return useMutation({
    mutationFn: () => billingApi.cancel(wid!),
    onSuccess: (sub) => setSub(sub),
  })
}
