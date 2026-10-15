import * as React from "react"

import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

/**
 * Shared chrome for all public marketing pages. The `.marketing-page` class
 * enables the marketing scroll-margin, brand focus outline and reduced-motion
 * rules defined in globals.css. Nested inside the root layout.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-page flex min-h-dvh flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
