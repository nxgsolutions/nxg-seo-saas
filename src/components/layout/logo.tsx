import * as React from "react"
import Link from "next/link"

import { site } from "@/config/site"
import { cn } from "@/lib/utils"

/** The NXGSEO brand mark — three ascending "rank" bars on a gradient tile. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center rounded-lg shadow-sm",
        className,
      )}
      style={{ backgroundImage: "var(--grad-logo)" }}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
        <path d="M6 17v-3M12 17V9M18 17V6" />
      </svg>
    </span>
  )
}

/** Brand lockup: mark + wordmark, linking home. */
export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${site.name} home`}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand",
        className,
      )}
    >
      <BrandMark />
      <span className="font-heading text-lg font-bold tracking-tight">{site.name}</span>
    </Link>
  )
}
