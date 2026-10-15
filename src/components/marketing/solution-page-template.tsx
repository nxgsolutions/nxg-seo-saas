import * as React from "react"
import { ArrowRight, X } from "lucide-react"

import { site } from "@/config/site"
import type { SolutionPage } from "@/config/solutions"
import { heroHighlights, solutionTools, workflowSteps } from "@/config/marketing"
import { Section } from "@/components/layout/section"
import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { Steps } from "@/components/marketing/steps"
import { FaqSection } from "@/components/marketing/faq"
import { RelatedTools } from "@/components/marketing/related-tools"
import { CtaSection } from "@/components/marketing/cta-section"
import {
  AuditIssuesMock,
  ContentScoreMock,
  KeywordTableMock,
  OpportunityMock,
  RankChartMock,
  SerpMock,
} from "@/components/marketing/visuals"
import { JsonLd } from "@/components/seo/json-ld"

const heroVisuals: Record<string, React.ReactNode> = {
  agencies: <RankChartMock caption={false} />,
  enterprise: <AuditIssuesMock caption={false} />,
  "seo-teams": <KeywordTableMock caption={false} />,
  "content-teams": <ContentScoreMock caption={false} />,
  ecommerce: <SerpMock caption={false} />,
  startups: <OpportunityMock />,
}

/** Shared shell for solution / use-case pages, driven by per-page content. */
export function SolutionPageTemplate({ data }: { data: SolutionPage }) {
  const pairs = data.challenges.map((c, i) => ({ challenge: c, outcome: data.outcomes[i] }))
  return (
    <>
      <PageHero
        eyebrow={data.hero.eyebrow}
        title={data.hero.title}
        description={data.hero.description}
        breadcrumbs={[{ label: "Solutions" }, { label: data.hero.eyebrow.replace(/^For /, "") }]}
        highlights={heroHighlights}
        visual={heroVisuals[data.slug]}
      />

      {/* Challenge → outcome pairs */}
      <Section>
        <SectionHeading
          eyebrow="The challenge"
          title="What gets in the way — and how we fix it"
          description="The problems that slow teams like yours down most often — and what changes with NXGSEO."
        />
        <Stagger className="mx-auto mt-14 max-w-5xl space-y-4">
          {pairs.map(({ challenge, outcome }, i) => {
            const Icon = outcome?.icon
            return (
              <StaggerItem key={challenge.title}>
                <div className="grid grid-cols-1 items-stretch gap-3 md:grid-cols-[1fr_auto_1fr]">
                  <div className="flex gap-4 rounded-2xl border border-border bg-muted/30 p-6">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--chart-fail)]/10 text-[var(--chart-fail)]">
                      <X className="size-4" />
                    </span>
                    <div>
                      <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Problem {String(i + 1).padStart(2, "0")}
                      </p>
                      <h3 className="mt-1 font-heading text-base font-semibold tracking-tight">{challenge.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{challenge.body}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="flex size-9 rotate-90 items-center justify-center rounded-full border border-border bg-card text-brand shadow-sm md:rotate-0">
                      <ArrowRight className="size-4" />
                    </span>
                  </div>
                  {outcome ? (
                    <div className="flex gap-4 rounded-2xl border border-brand/25 bg-brand/[0.04] p-6">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/12 text-brand">
                        {Icon ? <Icon className="size-4" /> : null}
                      </span>
                      <div>
                        <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand">With NXGSEO</p>
                        <h3 className="mt-1 font-heading text-base font-semibold tracking-tight">{outcome.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{outcome.body}</p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </StaggerItem>
            )
          })}
        </Stagger>
      </Section>

      <RelatedTools
        hrefs={solutionTools[data.slug]}
        eyebrow={data.outcomesEyebrow}
        title={data.outcomesTitle}
        description="The NXGSEO tools this team leans on most — all reading from the same first-party data."
        className="border-y border-border bg-muted/25"
      />

      <Section>
        <SectionHeading
          eyebrow="Getting started"
          title="Up and running the same day"
          description="Connect your data once and every tool is ready to use."
        />
        <div className="mt-14">
          <Steps steps={workflowSteps} />
        </div>
      </Section>

      <FaqSection items={data.faqs} />

      <CtaSection />

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: site.url },
              { "@type": "ListItem", position: 2, name: data.metaTitle, item: `${site.url}/solutions/${data.slug}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: data.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />
    </>
  )
}
