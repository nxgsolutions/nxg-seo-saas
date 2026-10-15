/** Billing API: plans + per-workspace subscription. */
import { apiClient } from "./client"

export interface Plan {
  id: string
  code: string
  name: string
  description: string
  price_cents: number
  currency: string
  interval: string
  features: string[]
  sort_order: number
}

export interface Subscription {
  status: string // free | trialing | active | past_due | canceled
  plan: Plan
  trial_end: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  stripe_configured: boolean
}

export interface SelectPlanResponse {
  mode: string // "local" | "checkout"
  checkout_url: string | null
  subscription: Subscription | null
}

export const plansApi = {
  list: () => apiClient.get<Plan[]>("/api/plans"),
}

const base = (wid: string) => `/api/workspaces/${wid}`

export const billingApi = {
  subscription: (wid: string) =>
    apiClient.get<Subscription>(`${base(wid)}/subscription`),

  select: (wid: string, planCode: string, successUrl?: string, cancelUrl?: string) =>
    apiClient.post<SelectPlanResponse>(`${base(wid)}/subscription/select`, {
      plan_code: planCode,
      success_url: successUrl ?? null,
      cancel_url: cancelUrl ?? null,
    }),

  cancel: (wid: string) =>
    apiClient.post<Subscription>(`${base(wid)}/subscription/cancel`, {}),

  portal: (wid: string, returnUrl: string) =>
    apiClient.post<{ url: string }>(`${base(wid)}/billing/portal`, {
      return_url: returnUrl,
    }),
}

/** Format cents as a currency string, e.g. 4900 -> "$49". */
export function formatPrice(cents: number, currency = "usd"): string {
  if (cents === 0) return "Free"
  const amount = cents / 100
  const symbol = currency.toLowerCase() === "usd" ? "$" : ""
  return `${symbol}${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`
}
