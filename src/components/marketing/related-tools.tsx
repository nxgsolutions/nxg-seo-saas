import { productMenu } from "@/config/navigation"
import { Section } from "@/components/layout/section"
import { Stagger, StaggerItem } from "@/components/motion/reveal"
import { FeatureCard } from "./feature-card"
import { SectionHeading } from "./section-heading"

/** Grid of product-page links. Pass hrefs to include, or `exclude` one href. */
export function RelatedTools({
  hrefs,
  exclude,
  eyebrow = "The platform",
  title = "Works better together",
  description = "Every NXGSEO tool reads from the same first-party data, so research, tracking and optimization stay in sync.",
  className,
}: {
  hrefs?: string[]
  exclude?: string
  eyebrow?: string
  title?: string
  description?: string
  className?: string
}) {
  const items = hrefs
    ? hrefs.map((h) => productMenu.items.find((i) => i.href === h)).filter((i) => i != null)
    : productMenu.items.filter((i) => i.href !== exclude).slice(0, 3)
  return (
    <Section className={className}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <Stagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
        {items.map((t) => (
          <StaggerItem key={t.href} className="h-full">
            <FeatureCard icon={t.icon!} title={t.label} href={t.href} className="h-full">
              {t.description}
            </FeatureCard>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  )
}
