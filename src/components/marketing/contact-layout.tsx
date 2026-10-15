import * as React from "react"

import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/motion/reveal"
import { Breadcrumbs, HeroBackdrop, type Crumb } from "./page-hero"
import { EyebrowPill } from "./section-heading"

/** Two-column layout for form pages (contact, demo): copy on the left, form on the right. */
export function ContactLayout({
  eyebrow,
  title,
  description,
  breadcrumbs,
  aside,
  form,
}: {
  eyebrow: string
  title: React.ReactNode
  description: string
  breadcrumbs: Crumb[]
  aside: React.ReactNode
  form: React.ReactNode
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <HeroBackdrop />
      <Container className="pb-20 pt-10 sm:pb-28 sm:pt-14">
        <Breadcrumbs items={breadcrumbs} />
        <div className="mt-8 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <Reveal>
            <EyebrowPill>{eyebrow}</EyebrowPill>
            <h1 className="mt-5 font-heading text-[clamp(2.25rem,4.5vw,3.5rem)] font-bold leading-[1.05] tracking-tight text-balance">
              {title}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground text-pretty">{description}</p>
            <div className="mt-10">{aside}</div>
          </Reveal>
          <Reveal delay={0.1} className="relative">
            <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand/10 blur-2xl" />
            {form}
          </Reveal>
        </div>
      </Container>
    </section>
  )
}
