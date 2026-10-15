import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, BookOpen, Library, Newspaper, PlugZap } from "lucide-react"

import { glossaryTerms } from "@/config/glossary"
import { createMetadata } from "@/config/seo"
import { Section } from "@/components/layout/section"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = createMetadata({
  title: "Resources",
  description: "Guides, articles and a plain-English SEO glossary to help you grow organic search.",
  path: "/resources",
})

const resources = [
  { icon: Newspaper, title: "Blog", body: "Playbooks, product news and SEO thinking.", href: "/blog" },
  { icon: BookOpen, title: "Guides", body: "In-depth, practical how-to guides.", href: "/guides" },
  { icon: Library, title: "Glossary", body: `${glossaryTerms.length} plain-English definitions of key SEO terms.`, href: "/glossary" },
  { icon: PlugZap, title: "Integrations", body: "The data sources NXGSEO connects to.", href: "/integrations" },
]

export default function ResourcesPage() {
  const featured = glossaryTerms.slice(0, 6)
  return (
    <>
      <PageHero
        eyebrow="Resources"
        title="Learn first-party SEO"
        description="Everything you need to get more from organic search, without the jargon."
        breadcrumbs={[{ label: "Resources" }]}
        secondary={{ label: "Open the glossary", href: "/glossary" }}
      />
      <Section>
        <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {resources.map((r) => (
            <StaggerItem key={r.href} className="h-full">
              <Link
                href={r.href}
                className="group flex h-full flex-col rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-xl hover:shadow-brand/[0.07]"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl border border-brand/15 bg-gradient-to-b from-brand/15 to-brand/5 text-brand">
                    <r.icon className="size-5" />
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                </div>
                <h2 className="mt-5 font-heading text-lg font-semibold tracking-tight">{r.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <Section className="border-t border-border bg-muted/25">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <SectionHeading align="left" eyebrow="From the glossary" title="Start with the fundamentals" />
          <Reveal>
            <Link href="/glossary" className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand">
              All {glossaryTerms.length} terms <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Reveal>
        </div>
        <Stagger className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((t) => (
            <StaggerItem key={t.slug} className="h-full">
              <Link
                href={`/glossary/${t.slug}`}
                className="group block h-full rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/35"
              >
                <p className="font-heading font-semibold group-hover:text-brand">{t.term}</p>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{t.definition}</p>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </Section>

      <CtaSection />
    </>
  )
}
