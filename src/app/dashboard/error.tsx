"use client"

import * as React from "react"
import Link from "next/link"
import { RotateCw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * Dashboard error boundary. Catches render/runtime errors inside the
 * authenticated app so a crash stays within the dashboard chrome (sidebar +
 * topbar from the segment layout) instead of bubbling to the root boundary,
 * which would drop the user into the public marketing shell.
 *
 * Must be a client component (Next.js requirement). Receives `retry` to
 * re-fetch and re-render the failed segment (stable prop as of Next 16.3).
 */
export default function DashboardError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-7" aria-hidden />
      </span>
      <p className="mt-6 font-mono text-sm font-medium text-muted-foreground">
        Something went wrong
      </p>
      <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-balance">
        We couldn’t load this view
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground text-balance">
        An unexpected error interrupted this page. You can try again, or return
        to your dashboard home.
      </p>
      {error.digest ? (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          Reference: {error.digest}
        </p>
      ) : null}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={() => retry()} variant="brand" size="xl">
          <RotateCw className="size-4" />
          Try again
        </Button>
        <Button render={<Link href="/dashboard" />} variant="outline" size="xl">
          Dashboard home
        </Button>
      </div>
    </div>
  )
}
