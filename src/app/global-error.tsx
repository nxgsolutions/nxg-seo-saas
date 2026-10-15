"use client"

import * as React from "react"

import "./globals.css"
import { fontVariables } from "@/config/fonts"

/**
 * Last-resort boundary for errors thrown in the root layout itself. It replaces
 * the entire document, so it must render its own <html>/<body> and can't rely
 * on the app's providers or chrome. Keep it self-contained and minimal.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  React.useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" className={`${fontVariables} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-20 text-center">
          <p className="font-mono text-sm font-medium text-muted-foreground">
            Something went wrong
          </p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">
            An unexpected error occurred
          </h1>
          <p className="mt-3 max-w-md text-base text-muted-foreground">
            Sorry — the page failed to load. Please try again.
          </p>
          {error.digest ? (
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={() => reset()}
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-semibold text-brand-foreground shadow-sm transition-colors hover:bg-brand-strong"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
