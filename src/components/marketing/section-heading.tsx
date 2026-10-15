import * as React from "react"

import { cn } from "@/lib/utils"
import { Reveal } from "@/components/motion/reveal"

interface SectionHeadingProps {
  eyebrow?: string
  title: React.ReactNode
  description?: React.ReactNode
  align?: "center" | "left"
  className?: string
}

/** Eyebrow pill + section heading + lead. Used at the top of most sections. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? (
        <Reveal>
          <EyebrowPill>{eyebrow}</EyebrowPill>
        </Reveal>
      ) : null}
      <Reveal delay={0.05}>
        <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
          {title}
        </h2>
      </Reveal>
      {description ? (
        <Reveal delay={0.1}>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg">{description}</p>
        </Reveal>
      ) : null}
    </div>
  )
}

/** Small mono pill used as an eyebrow above headings. */
export function EyebrowPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/[0.06] px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-brand",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-brand" />
      {children}
    </span>
  )
}
