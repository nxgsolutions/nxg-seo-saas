import type { Metadata } from "next"
import { Check, Database, Eye, Scale, ShieldCheck, Sparkles, Wrench, X } from "lucide-react"

import { createMetadata } from "@/config/seo"
import { Section } from "@/components/layout/section"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { FeatureCard } from "@/components/marketing/feature-card"
import { LogoStrip } from "@/components/marketing/logo-strip"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = createMetadata({
  title: "About",
  description: "NXGSEO builds SEO intelligence on first-party data you own — accurate, transparent and yours.",
  path: "/about",
})

const values = [
  { icon: Database, title: "First-party by default", body: "We build on the data you already own — Search Console, your crawl, the live SERP — not resold clickstream." },
  { icon: Eye, title: "Transparent by design", body: "Every score is explainable. No black-box metrics you can't verify or reproduce." },
  { icon: ShieldCheck, title: "Your data stays yours", body: "We don't compile or resell your performance data. It's your business, in your workspace." },
  { icon: Scale, title: "Honest numbers", body: "We label estimates as estimates and never dress modelled data up as fact." },
  { icon: Wrench, title: "Built for practitioners", body: "Workflows designed around what SEO and content teams actually do every week." },
  { icon: Sparkles, title: "Fair pricing", body: "No per-keyword credits or reseller markup — pricing that doesn't punish growth." },
]

const oldWay = [
  "Licensed clickstream data resold at a premium",
  "Modelled volumes presented as precise fact",
  "Scores you can't inspect or reproduce",
  "Per-keyword and per-credit pricing",
]
const ourWay = [
  "Signals from Search Console, the SERP and your crawl",
  "Estimates clearly labelled with their source",
  "Every score broken down into its inputs",
  "Flat plans, with a free tier to start",
]

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About NXGSEO"
        title={<>SEO intelligence built on <span className="text-gradient">data you own</span></>}
        description="NXGSEO exists to make organic growth accurate and honest — grounded in first-party data rather than expensive, opaque estimates."
        breadcrumbs={[{ label: "About" }]}
      />

      {/* Story */}
      <Section>
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
          <SectionHeading align="left" eyebrow="Our story" title="Why we built NXGSEO" />
          <Reveal delay={0.1} className="space-y-5 text-lg leading-relaxed text-muted-foreground">
            <p>
              Most SEO platforms resell licensed clickstream data at a premium, then present modelled numbers as fact.
              Teams end up paying more every time they add a keyword — and still can&apos;t explain why a tool says a
              term is worth chasing.
            </p>
            <p>
              We think teams deserve better. The most accurate signals about your site already exist: the impressions
              and positions in Google Search Console, the live search results page, and your own content.
            </p>
            <p className="text-foreground">
              NXGSEO turns those signals into a complete SEO workflow — research, tracking, optimization and analysis —
              scored in ways you can actually inspect. Powerful tooling, without the reseller markup or the black box.
            </p>
          </Reveal>
        </div>
      </Section>

      {/* Old way vs our way */}
      <Section className="border-y border-border bg-muted/25">
        <SectionHeading eyebrow="A different approach" title="What we do differently" />
        <Stagger className="mx-auto mt-12 grid max-w-5xl gap-5 md:grid-cols-2">
          <StaggerItem className="h-full">
            <div className="h-full rounded-3xl border border-border bg-card p-8">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">Typical SEO suites</p>
              <ul className="mt-6 space-y-4">
                {oldWay.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-muted-foreground">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted">
                      <X className="size-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
          <StaggerItem className="h-full">
            <div className="ring-gradient h-full rounded-3xl bg-card p-8 shadow-xl shadow-brand/10">
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-brand">The NXGSEO way</p>
              <ul className="mt-6 space-y-4">
                {ourWay.map((t) => (
                  <li key={t} className="flex items-start gap-3 font-medium">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                      <Check className="size-3" />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        </Stagger>
      </Section>

      {/* Values */}
      <Section>
        <SectionHeading
          eyebrow="What we value"
          title="Principles that guide the product"
          description="The commitments behind every feature we ship."
        />
        <Stagger className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((v) => (
            <StaggerItem key={v.title} className="h-full">
              <FeatureCard icon={v.icon} title={v.title} className="h-full">
                {v.body}
              </FeatureCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <section className="pb-8">
        <Reveal>
          <LogoStrip label="The first-party signals we build on" />
        </Reveal>
      </section>

      <CtaSection title="Grow organic search, honestly" />
    </>
  )
}
