import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Placeholder matching the auth card shape, shown while the route loads. */
export function AuthFormSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Card aria-hidden>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-56" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </CardContent>
      <CardFooter className="mt-6 flex flex-col gap-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-48" />
      </CardFooter>
    </Card>
  )
}
