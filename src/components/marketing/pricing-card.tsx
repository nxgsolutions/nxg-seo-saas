import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import type { Plan } from "@/config/pricing"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function PricingCard({ plan }: { plan: Plan }) {
  const hi = plan.highlighted
  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl border p-7 transition-shadow",
        hi
          ? "ring-gradient border-transparent bg-card shadow-2xl shadow-brand/20 lg:-my-4 lg:py-11"
          : "border-border bg-card hover:shadow-lg",
      )}
    >
      {hi ? (
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-3xl bg-gradient-to-b from-brand/10 to-transparent" />
      ) : null}
      <div className="relative flex items-center justify-between">
        <h3 className="font-heading text-xl font-semibold tracking-tight">{plan.name}</h3>
        {plan.badge ? (
          <span className="rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md shadow-brand/30" style={{ backgroundImage: "var(--grad-brand)" }}>
            {plan.badge}
          </span>
        ) : null}
      </div>
      <p className="relative mt-2 min-h-10 text-sm text-muted-foreground">{plan.description}</p>

      <div className="relative mt-6 flex items-baseline gap-1.5">
        <span className="font-heading text-5xl font-bold tracking-tight">{plan.price}</span>
        {plan.period ? <span className="text-sm text-muted-foreground">{plan.period}</span> : null}
      </div>

      <Button
        render={<Link href={plan.cta.href} />}
        variant={hi ? "brand" : "outline"}
        size="xl"
        className={cn("relative mt-7 w-full", hi && "shadow-lg shadow-brand/25")}
      >
        {plan.cta.label} <ArrowRight className="size-4" />
      </Button>

      <p className="relative mt-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">What&apos;s included</p>
      <ul className="relative mt-4 space-y-3">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", hi ? "bg-brand text-brand-foreground" : "bg-brand/10 text-brand")}>
              <Check className="size-3" />
            </span>
            <span className="text-foreground/90">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
