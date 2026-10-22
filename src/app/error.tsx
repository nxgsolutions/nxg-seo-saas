"use client"

import * as React from "react"
import Link from "next/link"
import { Home, RotateCw, TriangleAlert } from "lucide-react"

import { PublicShell } from "@/components/layout/public-shell"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

/**
 * Global error boundary. Catches render/runtime errors in any segment that
 * doesn't define its own boundary and shows a recoverable, on-brand screen.
 * Must be a client component (Next.js requirement) and receives `retry` to
 * re-fetch and re-render the failed segment (the stable prop as of Next 16.3;
 * preferred over `reset`, which only clears state without re-fetching).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  React.useEffect(() => {
    // Surface the error for debugging without exposing details to the user.
    console.error(error)
  }, [error])

  return (
    <PublicShell mainClassName="public-auth flex flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <Container className="flex max-w-xl flex-col items-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <TriangleAlert className="size-7" aria-hidden />
        </span>
        <p className="mt-6 font-mono text-sm font-medium text-muted-foreground">
          Something went wrong
        </p>
        <h1 className="mt-3 font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-balance">
          An unexpected error occurred
        </h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground text-balance">
          Sorry — we hit a problem loading this page. You can try again, or head
          back home while we sort it out.
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
          <Button render={<Link href="/" />} variant="outline" size="xl">
            <Home className="size-4" />
            Back to home
          </Button>
        </div>
      </Container>
    </PublicShell>
  )
}
