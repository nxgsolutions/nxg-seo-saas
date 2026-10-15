import * as React from "react"
import { FileWarning } from "lucide-react"

import { Container } from "@/components/layout/container"
import { Breadcrumbs, HeroBackdrop } from "./page-hero"
import { EyebrowPill } from "./section-heading"

export interface LegalSection {
  id: string
  title: string
  body: React.ReactNode
}

/** Long-form legal document: header, sticky table of contents, prose body. */
export function LegalPage({
  title,
  intro,
  sections,
}: {
  title: string
  intro: string
  sections: LegalSection[]
}) {
  return (
    <article className="relative isolate">
      <div className="relative overflow-hidden border-b border-border">
        <HeroBackdrop />
        <Container className="pb-14 pt-10 sm:pt-14">
          <Breadcrumbs items={[{ label: "Legal" }, { label: title }]} />
          <div className="mt-8 max-w-3xl">
            <EyebrowPill>Legal</EyebrowPill>
            <h1 className="mt-5 font-heading text-[clamp(2.25rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-tight">{title}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{intro}</p>
          </div>
        </Container>
      </div>

      <Container className="py-14 sm:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-20">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-28">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
              <ol className="mt-4 space-y-1 border-l border-border">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="-ml-px block border-l border-transparent py-1.5 pl-4 text-sm text-muted-foreground transition-colors hover:border-brand hover:text-foreground"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ol>
            </div>
          </nav>

          <div className="max-w-3xl">
            <div className="flex gap-3 rounded-2xl border border-dashed border-[var(--chart-warn)]/50 bg-[var(--chart-warn)]/[0.07] p-4 text-sm text-muted-foreground">
              <FileWarning className="mt-0.5 size-4 shrink-0 text-[var(--chart-warn)]" />
              This page is a placeholder template. Have it reviewed by legal counsel and replaced with your finalized
              document before launch.
            </div>
            <div className="mk-prose mt-10">
              {sections.map((s) => (
                <section key={s.id}>
                  <h2 id={s.id}>{s.title}</h2>
                  {s.body}
                </section>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </article>
  )
}
