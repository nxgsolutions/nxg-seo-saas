import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder with the shape of the Keyword Ideas card (header, AI overview,
 * category tabs, filters, table) — shown while a search runs or reopens. */
export function KeywordResultsSkeleton({ label }: { label: string }) {
  return (
    <Card aria-busy="true">
      <CardContent className="space-y-4 pt-6">
        <span className="sr-only" role="status">{label}</span>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-32" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="flex gap-2">
          {[64, 96, 80, 88, 104].map((w) => <Skeleton key={w} className="h-8" style={{ width: w }} />)}
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-40" />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <Skeleton className="h-10 w-full rounded-none" />
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-4 border-t px-3 py-3">
              <Skeleton className="size-6" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

/** Placeholder rows for the Recent searches list. */
export function RecentSearchesSkeleton() {
  return (
    <Card aria-busy="true">
      <CardContent className="space-y-2 pt-6">
        <span className="sr-only" role="status">Loading recent searches…</span>
        <Skeleton className="mb-2 h-4 w-32" />
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="size-4" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
