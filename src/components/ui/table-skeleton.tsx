import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Placeholder table body for a list's FIRST load: same row height as real
 * rows, so the layout doesn't jump when data arrives. (Later page/sort changes
 * keep the previous rows on screen instead — see Pager / keepPreviousData.)
 */
export function TableSkeleton({ rows = 8, columns = 6, className, label = "Loading…" }: {
  rows?: number
  columns?: number
  className?: string
  label?: string
}) {
  return (
    <div className={cn("divide-y divide-border/60", className)} role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, r) => (
        <div key={r} className="flex h-12 items-center gap-4 px-6">
          <Skeleton className="size-6 shrink-0" />
          <Skeleton className="h-4 flex-[3]" />
          {Array.from({ length: Math.max(0, columns - 1) }, (_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
