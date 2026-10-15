"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { PanelSkeleton } from "@/components/dashboard/skeletons"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  formatPrice
} from "@/lib/api/billing"
import { cn } from "@/lib/utils"
import { Check, CreditCard, Loader2, Sparkles } from "lucide-react"
import { motion } from "motion/react"
import { useBillingScreen } from "../_hooks/use-billing-screen"

export default function BillingPage() {
  const { plans, sub, selecting, busy, error, notice, loading, choose, cancel, manage, meta } = useBillingScreen()

  return (
    <div className="space-y-6">
      <PageHeader title={<> <CreditCard className="size-5 text-primary" /> Billing &amp; Plans </>} description={<> Manage your workspace subscription. Upgrade, downgrade, or manage payment details anytime. </>} />

      {notice ? (
        <Alert>
          <Check />
          <AlertTitle>Done</AlertTitle>
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <div className="space-y-6">
          <PanelSkeleton lines={2} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <PanelSkeleton lines={5} />
            <PanelSkeleton lines={5} />
            <PanelSkeleton lines={5} />
          </div>
        </div>
      ) : sub ? (
        <>
          <Card>
            <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{sub.plan.name} plan</p>
                  {meta ? (
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", meta.className)}>
                      {meta.label}
                    </span>
                  ) : null}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{sub.plan.description}</p>
                {sub.cancel_at_period_end ? (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    Cancels at the end of the current period.
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                {sub.stripe_configured && sub.status !== "free" ? (
                  <Button variant="outline" onClick={manage} disabled={busy}>
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null} Manage billing
                  </Button>
                ) : null}
                {sub.status !== "free" ? (
                  <Button variant="outline" onClick={cancel} disabled={busy}>
                    Downgrade to Free
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {plans.map((plan) => {
              const current = sub.plan.code === plan.code
              const featured = plan.code === "pro"
              return (
                <motion.div key={plan.code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className={cn("h-full", featured && "border-primary")}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base">
                          {plan.code === "pro" ? <Sparkles className="size-4 text-primary" /> : null}
                          {plan.name}
                        </CardTitle>
                        {featured ? <Badge variant="outline">Popular</Badge> : null}
                      </div>
                      <div className="mt-1">
                        <span className="text-2xl font-semibold tabular-nums">
                          {plan.code === "enterprise" ? "Custom" : formatPrice(plan.price_cents, plan.currency)}
                        </span>
                        {plan.price_cents > 0 ? <span className="text-sm text-muted-foreground">/{plan.interval}</span> : null}
                      </div>
                      {plan.price_cents > 0 ? (
                        <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">1-year free trial</p>
                      ) : null}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm">
                            <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                            <span className="text-muted-foreground">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        className="w-full"
                        variant={current ? "outline" : featured ? "default" : "outline"}
                        disabled={current || selecting !== null}
                        onClick={() => choose(plan.code)}
                      >
                        {selecting === plan.code ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : null}
                        {current ? "Current plan" : plan.price_cents > 0 ? "Start free trial" : "Switch to Free"}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Could not load your subscription. Please refresh.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
