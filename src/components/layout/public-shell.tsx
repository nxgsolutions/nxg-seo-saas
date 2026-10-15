import * as React from "react"

import { cn } from "@/lib/utils"
import { AnnouncementBar } from "./announcement-bar"
import { Header } from "./header"
import { Footer } from "./footer"

/**
 * Shared public-site chrome: announcement bar + marketing header + footer, the
 * exact same frame the marketing pages render. Used by any top-level page that
 * lives outside the `(marketing)` route group but should still look like the
 * public site — the auth screens, the global 404 and the error boundary.
 *
 * `.marketing-page` enables the marketing scroll-margin / focus-outline rules
 * from globals.css. `mainClassName` styles the <main> for each use.
 */
export function PublicShell({
  children,
  mainClassName,
}: {
  children: React.ReactNode
  mainClassName?: string
}) {
  return (
    <div className="marketing-page flex min-h-dvh flex-col bg-background">
      <AnnouncementBar />
      <Header />
      <main id="main-content" className={cn("flex-1", mainClassName)}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
