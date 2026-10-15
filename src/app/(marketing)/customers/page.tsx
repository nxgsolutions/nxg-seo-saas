import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BarChart3, Clock, Quote, Target } from "lucide-react"

import { createMetadata } from "@/config/seo"
import { Button } from "@/components/ui/button"
import { Section } from "@/components/layout/section"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { FeatureCard } from "@/components/marketing/feature-card"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = createMetadata({
  title: "Customers",
  description: "Customer stories from teams growing organic search with NXGSEO.",
  path: "/customers",
})

const measures = [
  { icon: BarChart3, title: "Verified outcomes", body: "Clicks and positions measured in each team's own Search Console — not modelled estimates." },
  { icon: Clock, title: "Time saved", body: "How much faster research, reporting and audits get when they live in one workspace." },
  { icon: Target, title: "Prioritization wins", body: "Which opportunity-scored keywords were targeted, and what happened next." },
]

export default function CustomersPage() {
  return (
    <>
      <PageHero
        eyebrow="Customers"
        title="Built for teams who grow with search"
        description="Real customer stories are on the way. We'd rather show verified results than invent them."
        breadcrumbs={[{ label: "Customers" }]}
      />

      <Section>
        <Reveal>
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-border bg-card p-10 text-center sm:p-14">
            <div aria-hidden className="absolute inset-0 bg-dots opacity-50 [mask-image:radial-gradient(closest-side,black,transparent)]" />
            <div className="relative">
              <span className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-brand/20 bg-brand/10 text-brand">
                <Quote className="size-6" />
              </span>
              <h2 className="mt-6 font-heading text-2xl font-bold tracking-tight sm:text-3xl">Case studies coming soon</h2>
              <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
                We&apos;re gathering results from real teams. Want to be one of our first featured customers? We&apos;ll
                work with you on onboarding and tell your story with your own verified data.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button render={<Link href="/register" />} variant="brand" size="xl">
                  Start free <ArrowRight className="size-4" />
                </Button>
                <Button render={<Link href="/contact" />} variant="outline" size="xl">
                  Get featured
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section className="border-t border-border bg-muted/25">
        <SectionHeading
          eyebrow="Our standard"
          title="What every story will show"
          description="When we publish a case study, it will be built on data you can check."
        />
        <Stagger className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          {measures.map((m) => (
            <StaggerItem key={m.title} className="h-full">
              <FeatureCard icon={m.icon} title={m.title} className="h-full">
                {m.body}
              </FeatureCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <CtaSection />
    </>
  )
}
