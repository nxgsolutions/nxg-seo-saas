import * as React from "react"

import { cn, formatDate, formatDateTime } from "@/lib/utils"

/**
 * The single date display used across the app — renders a calendar date in the
 * app's one format ("2 Nov 2026") as a semantic <time> element, with the full
 * date and time in its hover tooltip. Use this everywhere a date is shown so
 * every screen (Competitor Analysis, Page Audit, Action Plan, …) reads the same.
 *
 * Renders nothing when the value is empty or invalid.
 */
export function FormattedDate({
  value,
  className,
}: {
  value: string | number | Date | null | undefined
  className?: string
}) {
  const text = formatDate(value)
  if (!text) return null
  const date = value instanceof Date ? value : new Date(value as string | number)
  return (
    // Rendered as a subtle highlighted badge so dates read the same and stand
    // out everywhere. tabular-nums + nowrap keep it a stable width and position.
    <time
      dateTime={date.toISOString()}
      title={formatDateTime(value)}
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-xs font-medium tabular-nums text-foreground/80",
        className,
      )}
    >
      {text}
    </time>
  )
}
