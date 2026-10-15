import type { Metadata } from "next"
import { Compass, FileSearch, Gauge, Layers, LineChart, Search } from "lucide-react"

import { createMetadata } from "@/config/seo"
import { Section } from "@/components/layout/section"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { PlannedGrid, type PlannedItem } from "@/components/marketing/planned-grid"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = createMetadata({
  title: "Guides",
  description: "In-depth, practical SEO guides — keyword research, rank tracking, audits and content optimization.",
  path: "/guides",
})

const guides: PlannedItem[] = [
  { category: "Research", icon: Search, title: "The complete guide to first-party keyword research", body: "From seed terms to a prioritized roadmap using data you already own." },
  { category: "Research", icon: Layers, title: "Keyword clustering and topic architecture", body: "Group keywords into pillars and supporting pages that rank together." },
  { category: "Tracking", icon: LineChart, title: "Setting up rank tracking that matters", body: "Choose keywords, locations and devices that reflect how your customers search." },
  { category: "Technical", icon: Gauge, title: "Running an impact-first SEO audit", body: "Prioritize technical fixes by the traffic they're likely to unlock." },
  { category: "Technical", icon: FileSearch, title: "Crawlability: robots, sitemaps and indexing", body: "Make sure search engines can find, crawl and index the pages you care about." },
  { category: "Strategy", icon: Compass, title: "Reading the SERP before you write", body: "Use features, intent and difficulty to pick targets you can realistically win." },
]

export default function GuidesPage() {
  return (
    <>
      <PageHero
        eyebrow="Guides"
        title="In-depth, practical SEO guides"
        description="Step-by-step guides to research, tracking and optimization — grounded in first-party data. The library is being built now."
        breadcrumbs={[{ label: "Resources", href: "/resources" }, { label: "Guides" }]}
        secondary={{ label: "Browse the glossary", href: "/glossary" }}
      />
      <Section>
        <SectionHeading
          eyebrow="The library"
          title="Guides on the way"
          description="Hands-on, tool-agnostic guides. The glossary covers the core concepts in the meantime."
        />
        <div className="mt-14">
          <PlannedGrid items={guides} />
        </div>
      </Section>
      <CtaSection />
    </>
  )
}
