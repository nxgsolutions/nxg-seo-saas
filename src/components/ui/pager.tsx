"use client"

import { Button } from "@/components/ui/button"
import type { PageInfo } from "@/lib/api/pagination"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

/** Page numbers with gaps: 1 … 4 5 6 … 13 */
function pageList(page: number, total: number): (number | "gap")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const set = new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total))
  const sorted = [...set].sort((a, b) => a - b)
  const out: (number | "gap")[] = []
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap")
    out.push(p)
  })
  return out
}

/**
 * Footer for a server-paginated list: "Showing 26–50 of 312" + page buttons.
 * Fixed height and always rendered (even for one page) so the layout never
 * jumps while pages load; `fetching` shows a small spinner instead.
 */
export function Pager({ pagination, onPageChange, fetching = false, className, noun = "results" }: {
  pagination: PageInfo | null | undefined
  onPageChange: (page: number) => void
  fetching?: boolean
  className?: string
  noun?: string
}) {
  const p = pagination
  const from = p && p.total ? (p.page - 1) * p.page_size + 1 : 0
  const to = p ? Math.min(p.page * p.page_size, p.total) : 0
  return (
    <div className={cn("flex min-h-10 flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground", className)}>
      <span className="flex items-center gap-1.5 tabular-nums" aria-live="polite">
        {p ? (p.total ? `Showing ${from.toLocaleString()}–${to.toLocaleString()} of ${p.total.toLocaleString()} ${noun}` : `No ${noun}`) : " "}
        {fetching && <Loader2 className="size-3.5 animate-spin" aria-label="Loading" />}
      </span>
      {p && p.total_pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="size-8" disabled={p.page <= 1} onClick={() => onPageChange(p.page - 1)} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          {pageList(p.page, p.total_pages).map((n, i) => n === "gap" ? (
            <span key={`gap-${i}`} className="px-1">…</span>
          ) : (
            <Button key={n} size="sm" variant={n === p.page ? "default" : "ghost"} className="size-8 p-0 tabular-nums"
              aria-current={n === p.page ? "page" : undefined} onClick={() => onPageChange(n)}>{n}</Button>
          ))}
          <Button variant="outline" size="icon" className="size-8" disabled={p.page >= p.total_pages} onClick={() => onPageChange(p.page + 1)} aria-label="Next page">
            <ChevronRight />
          </Button>
        </nav>
      )}
    </div>
  )
}
