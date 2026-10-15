import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { glossaryTerms, type GlossaryTerm } from "@/config/glossary"
import { createMetadata } from "@/config/seo"
import { Section } from "@/components/layout/section"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { PageHero } from "@/components/marketing/page-hero"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = createMetadata({
  title: "SEO Glossary",
  description: "Plain-English definitions of the SEO terms that matter — from SERP and search intent to keyword difficulty.",
  path: "/glossary",
})

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

export default function GlossaryPage() {
  const terms = [...glossaryTerms].sort((a, b) => a.term.localeCompare(b.term))
  const groups = new Map<string, GlossaryTerm[]>()
  for (const t of terms) {
    const letter = t.term[0].toUpperCase()
    groups.set(letter, [...(groups.get(letter) ?? []), t])
  }

  return (
    <>
      <PageHero
        eyebrow="Glossary"
        title="SEO terms, in plain English"
        description={`A no-jargon reference for the ${terms.length} concepts behind organic search.`}
        breadcrumbs={[{ label: "Resources", href: "/resources" }, { label: "Glossary" }]}
        primary={{ label: "Start free", href: "/register" }}
        secondary={{ label: "Read the blog", href: "/blog" }}
      />

      {/* A–Z jump bar */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <nav aria-label="Jump to letter" className="scrollbar-hide mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-3 sm:px-6 lg:justify-center lg:px-8">
          {ALPHABET.map((l) =>
            groups.has(l) ? (
              <a
                key={l}
                href={`#letter-${l}`}
                className="flex size-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-semibold text-foreground transition-colors hover:bg-brand/10 hover:text-brand"
              >
                {l}
              </a>
            ) : (
              <span key={l} className="flex size-8 shrink-0 items-center justify-center font-mono text-sm text-muted-foreground/40">
                {l}
              </span>
            ),
          )}
        </nav>
      </div>

      <Section className="pt-12 sm:pt-16 lg:pt-20">
        <div className="space-y-14">
          {[...groups.entries()].map(([letter, list]) => (
            <section key={letter} id={`letter-${letter}`} className="grid grid-cols-1 gap-6 md:grid-cols-[6rem_1fr]">
              <Reveal>
                <p className="text-gradient font-heading text-5xl font-bold md:sticky md:top-36">{letter}</p>
              </Reveal>
              <Stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((t) => (
                  <StaggerItem key={t.slug} className="h-full">
                    <Link
                      href={`/glossary/${t.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-lg hover:shadow-brand/[0.06]"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="font-heading text-base font-semibold tracking-tight group-hover:text-brand">{t.term}</h2>
                        <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.short}</p>
                    </Link>
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          ))}
        </div>
      </Section>

      <CtaSection />
    </>
  )
}
