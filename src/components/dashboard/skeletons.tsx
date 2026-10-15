import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

/** A row of stat/KPI cards. */
export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="space-y-2 py-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** A card with a title and a chart-height body. */
export function ChartCardSkeleton({ className, height = "h-52" }: { className?: string; height?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-2 h-3 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className={cn("w-full", height)} />
      </CardContent>
    </Card>
  )
}

/** A single generic result panel (title + lines + block). */
export function PanelSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <Card className={className}>
      <CardContent className="space-y-3 py-6">
        <Skeleton className="h-4 w-40" />
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3", i % 2 ? "w-2/3" : "w-full max-w-lg")} />
        ))}
      </CardContent>
    </Card>
  )
}

/** A score/hero card (circle + text) above a list — for audit/optimization/AI results. */
export function ScoreResultSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-6 py-6">
          <Skeleton className="size-24 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </CardContent>
      </Card>
      <ListRowsSkeleton rows={6} />
    </div>
  )
}

/** Rows of list items (icon + two lines). */
export function ListRowsSkeleton({ rows = 6, wrap = true }: { rows?: number; wrap?: boolean }) {
  const body = (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <Skeleton className="size-7 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  )
  if (!wrap) return body
  return (
    <Card>
      <CardContent className="p-0">{body}</CardContent>
    </Card>
  )
}
