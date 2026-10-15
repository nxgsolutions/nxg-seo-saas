import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { glossaryTerms, glossaryBySlug } from "@/config/glossary"
import { site } from "@/config/site"
import { createMetadata } from "@/config/seo"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { Breadcrumbs, HeroBackdrop } from "@/components/marketing/page-hero"
import { EyebrowPill } from "@/components/marketing/section-heading"
import { CtaSection } from "@/components/marketing/cta-section"
import { JsonLd } from "@/components/seo/json-ld"

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return glossaryTerms.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const term = glossaryBySlug.get(slug)
  if (!term) return {}
  return createMetadata({
    title: `${term.term} — SEO Glossary`,
    description: term.definition.slice(0, 155),
    path: `/glossary/${term.slug}`,
  })
}

export default async function GlossaryTermPage({ params }: Params) {
  const { slug } = await params
  const term = glossaryBySlug.get(slug)
  if (!term) notFound()

  const index = glossaryTerms.findIndex((t) => t.slug === slug)
  const related = [1, 2, 3, 4].map((o) => glossaryTerms[(index + o) % glossaryTerms.length]).filter((t) => t.slug !== slug)

  const next = glossaryTerms[(index + 1) % glossaryTerms.length]

  return (
    <>
      <article className="relative isolate overflow-hidden">
        <HeroBackdrop />
        <Container className="pb-20 pt-10 sm:pt-14">
          <Breadcrumbs items={[{ label: "Glossary", href: "/glossary" }, { label: term.term }]} />
          <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
            <div className="max-w-3xl">
              <EyebrowPill>SEO Glossary</EyebrowPill>
              <h1 className="mt-5 font-heading text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">{term.term}</h1>
              <p className="mt-4 text-xl font-medium text-muted-foreground">{term.short}</p>

              <div className="mt-10 rounded-3xl border border-border bg-card p-7 sm:p-9">
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-brand">Definition</p>
                <p className="mt-4 text-lg leading-relaxed text-foreground/90 text-pretty">{term.definition}</p>
              </div>

              <div className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  href="/glossary"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ArrowLeft className="size-4" /> All terms
                </Link>
                <Link
                  href={`/glossary/${next.slug}`}
                  className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
                >
                  Next: {next.term} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="font-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground">Related terms</h2>
                <ul className="mt-4 space-y-1">
                  {related.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/glossary/${r.slug}`}
                        className="group block rounded-xl px-3 py-2.5 transition-colors hover:bg-muted"
                      >
                        <span className="text-sm font-semibold group-hover:text-brand">{r.term}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{r.short}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-[oklch(0.2_0.06_274)] p-6 text-white">
                <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-[oklch(0.6_0.22_274)] opacity-50 blur-3xl" />
                <p className="relative font-heading text-lg font-semibold">Put it into practice</p>
                <p className="relative mt-1.5 text-sm text-white/70">
                  NXGSEO turns these concepts into a workflow — built on your own Search Console data.
                </p>
                <Button
                  render={<Link href="/register" />}
                  size="lg"
                  className="relative mt-5 w-full bg-white text-[oklch(0.3_0.12_274)] hover:bg-white/90"
                >
                  Start free <ArrowRight className="size-4" />
                </Button>
              </div>
            </aside>
          </div>
        </Container>
      </article>

      <CtaSection />

      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "DefinedTerm",
            name: term.term,
            description: term.definition,
            inDefinedTermSet: `${site.url}/glossary`,
            url: `${site.url}/glossary/${term.slug}`,
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: site.url },
              { "@type": "ListItem", position: 2, name: "Glossary", item: `${site.url}/glossary` },
              { "@type": "ListItem", position: 3, name: term.term, item: `${site.url}/glossary/${term.slug}` },
            ],
          },
        ]}
      />
    </>
  )
}
