import {
  type Subscription
} from "@/lib/api/billing";

export function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

export function statusMeta(sub: Subscription): { label: string; className: string } {
  switch (sub.status) {
    case "trialing":
      return { label: `Trial — ends ${fmtDate(sub.trial_end)}`, className: "bg-sky-500/12 text-sky-600 dark:text-sky-400" }
    case "active":
      return { label: `Active — renews ${fmtDate(sub.current_period_end)}`, className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400" }
    case "past_due":
      return { label: "Payment past due", className: "bg-destructive/10 text-destructive" }
    case "canceled":
      return { label: "Canceled", className: "bg-muted text-muted-foreground" }
    default:
      return { label: "Free plan", className: "bg-muted text-muted-foreground" }
  }
}
