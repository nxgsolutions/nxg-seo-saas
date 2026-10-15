import { site } from "@/config/site"
import type { FeaturePage } from "@/config/feature-pages"
import { heroHighlights, workflowSteps } from "@/config/marketing"
import { Section } from "@/components/layout/section"
import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { FeatureCard } from "@/components/marketing/feature-card"
import { SplitFeature } from "@/components/marketing/split-feature"
import { Steps } from "@/components/marketing/steps"
import { FaqSection } from "@/components/marketing/faq"
import { RelatedTools } from "@/components/marketing/related-tools"
import { CtaSection } from "@/components/marketing/cta-section"
import { featureVisuals } from "@/components/marketing/visuals"
import { JsonLd } from "@/components/seo/json-ld"

/** Shared shell for feature pages, driven by per-page content. */
export function FeaturePageTemplate({ data }: { data: FeaturePage }) {
  const visuals = featureVisuals[data.slug]
  return (
    <>
      <PageHero
        eyebrow={data.hero.eyebrow}
        title={data.hero.title}
        description={data.hero.description}
        breadcrumbs={[{ label: "Product" }, { label: data.metaTitle }]}
        highlights={heroHighlights}
        visual={visuals?.hero}
      />

      <Section>
        <SectionHeading eyebrow={data.featuresEyebrow} title={data.featuresTitle} />
        <Stagger className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.features.map((f) => (
            <StaggerItem key={f.title} className="h-full">
              <FeatureCard icon={f.icon} title={f.title} className="h-full">
                {f.body}
              </FeatureCard>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <div className="border-y border-border bg-muted/25">
        {data.splits.map((s, i) => (
          <SplitFeature
            key={s.title}
            eyebrow={s.eyebrow}
            title={s.title}
            description={s.description}
            bullets={s.bullets}
            reverse={s.reverse}
            visual={visuals?.splits[i]}
          />
        ))}
      </div>

      <Section>
        <SectionHeading
          eyebrow="How it works"
          title="From connected to ranking in four steps"
          description="No exports, no spreadsheets — one workflow from first-party data to results."
        />
        <div className="mt-14">
          <Steps steps={workflowSteps} />
        </div>
      </Section>

      <RelatedTools exclude={`/${data.slug}`} className="border-t border-border bg-muted/25" />

      <FaqSection items={data.faqs} />

      <CtaSection />

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: site.url },
              { "@type": "ListItem", position: 2, name: data.metaTitle, item: `${site.url}/${data.slug}` },
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
