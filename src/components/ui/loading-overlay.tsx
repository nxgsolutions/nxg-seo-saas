"use client"

/**
 * A blurred loading overlay for a `relative` container — shown while filtered
 * data is being updated, so stale content is dimmed/blurred until the new data
 * is ready. The parent must be `position: relative`.
 */
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"

export function LoadingOverlay({
  show,
  label = "Updating…",
  className,
}: {
  show: boolean
  label?: string
  className?: string
}) {
  if (!show) return null
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-background/40 backdrop-blur-sm duration-150 animate-in fade-in",
        className,
      )}
    >
      <span className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-sm">
        <Loader2 className="size-4 animate-spin" /> {label}
      </span>
    </div>
  )
}
