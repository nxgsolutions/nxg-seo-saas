import type { Metadata } from "next"
import { BarChart3, Database, FileText, LineChart, Search, Target } from "lucide-react"

import { createMetadata } from "@/config/seo"
import { Section } from "@/components/layout/section"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { PlannedGrid, type PlannedItem } from "@/components/marketing/planned-grid"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = createMetadata({
  title: "Blog",
  description: "Playbooks, product news and honest thinking about first-party SEO from the NXGSEO team.",
  path: "/blog",
})

const upcoming: PlannedItem[] = [
  { category: "Playbook", icon: Database, title: "Keyword research with only Search Console data", body: "How far first-party data gets you — and where to supplement it with Autocomplete and Trends." },
  { category: "Playbook", icon: Target, title: "Finding striking-distance keywords in 15 minutes", body: "A repeatable process for spotting pages ranking 11–20 and pushing them onto page one." },
  { category: "Thinking", icon: BarChart3, title: "Why modelled search volume misleads roadmaps", body: "What clickstream estimates get wrong, and better demand signals to prioritize with." },
  { category: "Playbook", icon: FileText, title: "Writing briefs from the live SERP", body: "Turn what already ranks into a brief your writers can actually use." },
  { category: "Guide", icon: LineChart, title: "Reading rank changes without the noise", body: "Separate real movement from day-to-day jitter before you react." },
  { category: "Product", icon: Search, title: "Inside NXGSEO's opportunity score", body: "Exactly how we combine demand, position and difficulty — with worked examples." },
]

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="Blog"
        title="Playbooks, product news and SEO thinking"
        description="Practical, no-hype writing about growing organic search with data you own. Our first articles are being written now."
        breadcrumbs={[{ label: "Resources", href: "/resources" }, { label: "Blog" }]}
        secondary={{ label: "Browse the glossary", href: "/glossary" }}
      />
      <Section>
        <SectionHeading
          eyebrow="Coming up"
          title="What we're writing"
          description="A preview of the first pieces on the way. Start free to put these ideas to work today."
        />
        <div className="mt-14">
          <PlannedGrid items={upcoming} />
        </div>
      </Section>
      <CtaSection />
    </>
  )
}
