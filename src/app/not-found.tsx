import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Compass, Home } from "lucide-react"

import { PublicShell } from "@/components/layout/public-shell"
import { Container } from "@/components/layout/container"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Page not found",
  description: "The page you’re looking for doesn’t exist or has moved.",
}

/**
 * Global 404. Catches any unmatched route app-wide and renders inside the
 * public site chrome so a missing URL still looks like the rest of the site.
 */
export default function NotFound() {
  return (
    <PublicShell mainClassName="public-auth flex flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <Container className="flex max-w-xl flex-col items-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Compass className="size-7" aria-hidden />
        </span>
        <p className="mt-6 font-mono text-sm font-medium text-muted-foreground">
          404 — Page not found
        </p>
        <h1 className="mt-3 font-heading text-[clamp(1.75rem,4vw,2.5rem)] font-bold tracking-tight text-balance">
          We couldn’t find that page
        </h1>
        <p className="mt-3 max-w-md text-base text-muted-foreground text-balance">
          The page you’re looking for doesn’t exist, may have moved, or the link
          might be out of date.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button render={<Link href="/" />} variant="brand" size="xl">
            <Home className="size-4" />
            Back to home
          </Button>
          <Button render={<Link href="/dashboard" />} variant="outline" size="xl">
            Go to dashboard
            <ArrowLeft className="size-4 rotate-180" />
          </Button>
        </div>
      </Container>
    </PublicShell>
  )
}
