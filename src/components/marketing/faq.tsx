import Link from "next/link"
import { Plus } from "lucide-react"

import { site } from "@/config/site"
import { Section } from "@/components/layout/section"
import { Reveal } from "@/components/motion/reveal"
import { SectionHeading } from "./section-heading"

export interface FaqItem {
  q: string
  a: string
}

/**
 * FAQ accordion built on native <details> — accessible and keyboard-friendly
 * with zero client JS. Pair with FAQPage JSON-LD where appropriate.
 */
export function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <details
          key={item.q}
          className="group rounded-2xl border border-border bg-card px-5 transition-colors open:border-brand/30 open:bg-brand/[0.03]"
          open={i === 0}
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left text-[0.9375rem] font-semibold transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
            {item.q}
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all duration-200 group-open:rotate-45 group-open:border-brand/40 group-open:text-brand">
              <Plus className="size-4" />
            </span>
          </summary>
          <p className="pb-5 pr-10 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
        </details>
      ))}
    </div>
  )
}

/** Two-column FAQ section: heading + contact prompt on the left, accordion on the right. */
export function FaqSection({
  items,
  title = "Questions, answered",
  description = "Everything you need to know about how NXGSEO works. Can't find an answer?",
}: {
  items: FaqItem[]
  title?: string
  description?: string
}) {
  return (
    <Section id="faq">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeading align="left" eyebrow="FAQ" title={title} />
          <Reveal delay={0.1}>
            <p className="mt-4 text-muted-foreground text-pretty">
              {description}{" "}
              <Link href="/contact" className="font-semibold text-brand underline-offset-4 hover:underline">
                Talk to our team
              </Link>{" "}
              or email{" "}
              <a href={`mailto:${site.contact.email}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                {site.contact.email}
              </a>
              .
            </p>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <Faq items={items} />
        </Reveal>
      </div>
    </Section>
  )
}
