import * as React from "react"

import { cn } from "@/lib/utils"
import { Container } from "./container"

interface SectionProps extends React.ComponentProps<"section"> {
  /** Constrain and center inner content (default true). Set false for full-bleed. */
  contained?: boolean
  containerClassName?: string
}

/** A vertical page section with consistent rhythm. Wrap content in a Container. */
export function Section({
  className,
  containerClassName,
  contained = true,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn("py-16 sm:py-20 lg:py-28", className)} {...props}>
      {contained ? <Container className={containerClassName}>{children}</Container> : children}
    </section>
  )
}

/** Small eyebrow label above a section heading. */
export function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand",
        className,
      )}
      {...props}
    />
  )
}
