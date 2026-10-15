import * as React from "react"
import Link from "next/link"
import { ArrowRight, Check, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/motion/reveal"
import { EyebrowPill } from "./section-heading"

interface Cta {
  label: string
  href: string
}

export interface Crumb {
  label: string
  href?: string
}

interface PageHeroProps {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  primary?: Cta | null
  secondary?: Cta | null
  breadcrumbs?: Crumb[]
  /** Short check-marked proof points under the CTAs. */
  highlights?: string[]
  /** Product visual — switches the hero to a two-column layout. */
  visual?: React.ReactNode
  /** Extra content rendered under the CTAs (e.g. a search box). */
  children?: React.ReactNode
}

/** Hero for inner marketing pages (features, solutions, commercial). */
export function PageHero({
  eyebrow,
  title,
  description,
  primary = { label: "Start free", href: "/register" },
  secondary = { label: "Book a demo", href: "/demo" },
  breadcrumbs,
  highlights,
  visual,
  children,
}: PageHeroProps) {
  const split = Boolean(visual)
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      <HeroBackdrop />
      <Container className={cn("pb-16 pt-10 sm:pb-20 sm:pt-14", !split && "lg:pb-24")}>
        {breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} center={!split} /> : null}
        <div className={cn(split ? "mt-8 grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16" : "mx-auto mt-8 max-w-3xl text-center")}>
          <div>
            {eyebrow ? (
              <Reveal>
                <EyebrowPill>{eyebrow}</EyebrowPill>
              </Reveal>
            ) : null}
            <Reveal delay={0.05}>
              <h1 className="mt-5 font-heading text-[clamp(2.25rem,5vw,3.75rem)] font-bold leading-[1.05] tracking-tight text-balance">
                {title}
              </h1>
            </Reveal>
            {description ? (
              <Reveal delay={0.1}>
                <p className={cn("mt-5 text-lg leading-relaxed text-muted-foreground text-pretty", !split && "mx-auto max-w-2xl")}>
                  {description}
                </p>
              </Reveal>
            ) : null}
            {primary || secondary ? (
              <Reveal delay={0.15}>
                <div className={cn("mt-8 flex flex-col gap-3 sm:flex-row", !split && "items-center justify-center")}>
                  {primary ? (
                    <Button render={<Link href={primary.href} />} variant="brand" size="xl" className="shadow-lg shadow-brand/25">
                      {primary.label} <ArrowRight className="size-4" />
                    </Button>
                  ) : null}
                  {secondary ? (
                    <Button render={<Link href={secondary.href} />} variant="outline" size="xl">
                      {secondary.label}
                    </Button>
                  ) : null}
                </div>
              </Reveal>
            ) : null}
            {highlights?.length ? (
              <Reveal delay={0.2}>
                <ul className={cn("mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground", !split && "justify-center")}>
                  {highlights.map((h) => (
                    <li key={h} className="flex items-center gap-1.5">
                      <Check className="size-4 text-brand" /> {h}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ) : null}
            {children}
          </div>
          {visual ? (
            <Reveal delay={0.15} amount={0.1} className="relative">
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand/10 blur-2xl" />
              {visual}
            </Reveal>
          ) : null}
        </div>
      </Container>
    </section>
  )
}

/** Brand glow + faded grid shared by heroes. */
export function HeroBackdrop({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 -z-10", className)}>
      <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(60%_60%_at_50%_0%,black,transparent)]" />
      <div
        className="absolute inset-x-0 top-0 h-[560px]"
        style={{ background: "radial-gradient(50% 55% at 50% 0%, color-mix(in oklch, var(--brand) 18%, transparent), transparent 75%)" }}
      />
      <div
        className="absolute -right-32 top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: "color-mix(in oklch, var(--aqua) 35%, transparent)" }}
      />
    </div>
  )
}

export function Breadcrumbs({ items, center }: { items: Crumb[]; center?: boolean }) {
  const all: Crumb[] = [{ label: "Home", href: "/" }, ...items]
  return (
    <nav aria-label="Breadcrumb" className={cn("flex", center && "justify-center")}>
      <ol className="flex flex-wrap items-center gap-1 text-xs font-medium text-muted-foreground">
        {all.map((c, i) => (
          <li key={c.label} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight className="size-3.5 opacity-60" /> : null}
            {c.href && i < all.length - 1 ? (
              <Link href={c.href} className="rounded transition-colors hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span aria-current={i === all.length - 1 ? "page" : undefined} className="text-foreground/80">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
