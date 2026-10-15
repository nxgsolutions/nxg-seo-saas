import * as React from "react"
import Link from "next/link"
import { ArrowRight, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  children: React.ReactNode
  className?: string
  /** Makes the whole card a link with a "Learn more" affordance. */
  href?: string
}

/** A single capability card: icon tile, title, description, optional link. */
export function FeatureCard({ icon: Icon, title, children, className, href }: FeatureCardProps) {
  const body = (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="flex size-11 items-center justify-center rounded-xl border border-brand/15 bg-gradient-to-b from-brand/15 to-brand/5 text-brand transition-transform duration-300 group-hover:scale-105">
        <Icon className="size-5" />
      </div>
      <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
      {href ? (
        <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
          Learn more <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      ) : null}
    </>
  )
  const classes = cn(
    "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-xl hover:shadow-brand/[0.07]",
    className,
  )
  return href ? (
    <Link href={href} className={classes}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  )
}
