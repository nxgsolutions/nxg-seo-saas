import * as React from "react"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/motion/reveal"
import { EyebrowPill } from "./section-heading"

interface SplitFeatureProps {
  eyebrow?: string
  title: string
  description: string
  bullets?: string[]
  /** Put the visual on the left instead of the right. */
  reverse?: boolean
  /** Product visual; falls back to a neutral illustrative panel. */
  visual?: React.ReactNode
  className?: string
}

/** Alternating text + visual section, reusable across feature/solution pages. */
export function SplitFeature({ eyebrow, title, description, bullets, reverse, visual, className }: SplitFeatureProps) {
  return (
    <section className={cn("overflow-hidden py-16 sm:py-24", className)}>
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal className={cn(reverse && "lg:order-2")}>
            {eyebrow ? <EyebrowPill>{eyebrow}</EyebrowPill> : null}
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">{title}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">{description}</p>
            {bullets?.length ? (
              <ul className="mt-8 space-y-4">
                {bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand ring-1 ring-brand/20">
                      <Check className="size-3.5" />
                    </span>
                    <span className="text-[0.9375rem] text-foreground/90">{b}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>

          <Reveal delay={0.1} amount={0.15} className={cn("relative", reverse && "lg:order-1")}>
            <div
              aria-hidden
              className="absolute -inset-4 -z-10 rounded-[2rem] bg-dots opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]"
            />
            {visual ?? <FeatureMock />}
          </Reveal>
        </div>
      </Container>
    </section>
  )
}

/** Neutral illustrative panel — clearly a product visual, not real data. */
function FeatureMock() {
  return (
    <div className="surface rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-brand" />
        <span className="h-2 w-24 rounded-full bg-muted" />
      </div>
      <div className="mt-5 flex h-40 items-end gap-2">
        {[40, 55, 48, 66, 60, 74, 70, 82].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${h}%`, backgroundImage: "var(--grad-brand)", opacity: 0.35 + i * 0.07 }}
          />
        ))}
      </div>
    </div>
  )
}
