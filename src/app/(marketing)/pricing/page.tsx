import type { Metadata } from "next"
import { Check, Database, Minus, Receipt, ShieldCheck, Sparkles, Unplug, Zap } from "lucide-react"

import { plans, billingNote, planMatrix, type MatrixCell } from "@/config/pricing"
import { createMetadata } from "@/config/seo"
import { cn } from "@/lib/utils"
import { Section } from "@/components/layout/section"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { PricingCard } from "@/components/marketing/pricing-card"
import { FaqSection, type FaqItem } from "@/components/marketing/faq"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = createMetadata({
  title: "Pricing",
  description: "Simple, transparent pricing for NXGSEO. Start free — no credit card required.",
  path: "/pricing",
})

const faqs: FaqItem[] = [
  { q: "Is there really a free plan?", a: "Yes. The Free plan covers one workspace and website with first-party keyword research and basic rank tracking — no credit card required." },
  { q: "Can I change plans later?", a: "Yes, you can upgrade or downgrade at any time; changes take effect on your next billing cycle." },
  { q: "Do you charge per keyword?", a: "No. Because NXGSEO is built on first-party data, there are no per-keyword data-reseller fees." },
  { q: "What does Enterprise include?", a: "Unlimited websites, roles and permissions, priority support and custom integrations. Contact sales for a tailored quote." },
  { q: "Do I need a credit card to start?", a: "No. Create a workspace on the Free plan and add billing details only when you choose to upgrade." },
]

const included = [
  { icon: Database, title: "First-party data", body: "Search Console, Trends and Autocomplete on every plan." },
  { icon: Receipt, title: "No per-keyword fees", body: "No reseller markup, no metered keyword credits." },
  { icon: Sparkles, title: "Explainable scores", body: "See the inputs behind every opportunity score." },
  { icon: ShieldCheck, title: "Your data stays yours", body: "Never pooled, compiled or resold." },
  { icon: Zap, title: "Fast setup", body: "Connect Search Console and start in minutes." },
  { icon: Unplug, title: "Cancel anytime", body: "No lock-in contracts on self-serve plans." },
]

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={<>Simple pricing, built on <span className="text-gradient">data you own</span></>}
        description="Start free and upgrade as you grow. No per-keyword fees, no data-reseller markup, no surprises."
        primary={null}
        secondary={null}
        breadcrumbs={[{ label: "Pricing" }]}
        highlights={["No credit card required", "Upgrade or downgrade anytime", "No per-keyword fees"]}
      />

      <Section className="pt-12 sm:pt-16 lg:pt-20">
        <Stagger className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <StaggerItem key={plan.name} className="h-full">
              <PricingCard plan={plan} />
            </StaggerItem>
          ))}
        </Stagger>
        <p className="mt-8 text-center text-xs text-muted-foreground">{billingNote}</p>
      </Section>

      {/* Included in every plan */}
      <Section className="border-y border-border bg-muted/25">
        <SectionHeading eyebrow="Every plan" title="Included, whichever plan you choose" />
        <Stagger className="mx-auto mt-12 grid max-w-5xl grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {included.map((i) => (
            <StaggerItem key={i.title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
                <i.icon className="size-5" />
              </span>
              <div>
                <h3 className="font-heading font-semibold">{i.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{i.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      {/* Comparison matrix */}
      <Section id="compare">
        <SectionHeading eyebrow="Compare plans" title="Every feature, side by side" />
        <Reveal className="mx-auto mt-12 max-w-5xl overflow-x-auto" amount={0.05}>
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-[40%] py-4 text-left font-medium text-muted-foreground">Features</th>
                {plans.map((p) => (
                  <th
                    key={p.name}
                    className={cn(
                      "px-4 py-4 text-center font-heading text-base font-semibold",
                      p.highlighted && "text-brand",
                    )}
                  >
                    {p.name}
                    <span className="mt-0.5 block font-sans text-xs font-normal text-muted-foreground">
                      {p.price}
                      {p.period && p.period !== "forever" ? p.period : ""}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            {planMatrix.map((g) => (
              <tbody key={g.label}>
                <tr>
                  <th colSpan={4} className="pb-2 pt-8 text-left font-mono text-[11px] font-semibold uppercase tracking-wider text-brand">
                    {g.label}
                  </th>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.label} className="group">
                    <td className="border-t border-border py-3.5 pr-4 text-foreground/90">{r.label}</td>
                    {r.values.map((v, i) => (
                      <td
                        key={i}
                        className={cn("border-t border-border px-4 py-3.5 text-center", plans[i]?.highlighted && "bg-brand/[0.05]")}
                      >
                        <MatrixValue v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </Reveal>
      </Section>

      <FaqSection items={faqs} title="Pricing questions" description="Still deciding which plan fits?" />

      <CtaSection title="Try NXGSEO free" description="Create your workspace in minutes. No credit card required." />
    </>
  )
}

function MatrixValue({ v }: { v: MatrixCell }) {
  if (v === true) return <Check className="mx-auto size-5 text-brand" aria-label="Included" />
  if (v === false) return <Minus className="mx-auto size-4 text-muted-foreground/40" aria-label="Not included" />
  return <span className="text-sm font-medium">{v}</span>
}
