import * as React from "react"

import { PublicShell } from "@/components/layout/public-shell"
import { AuthReveal } from "./auth-reveal"

/**
 * Frame for the sign-in / create-account screens. Reuses the public site's
 * chrome (announcement bar + marketing header + footer) so auth matches the
 * rest of the public pages, and centers the form over the brand-tinted
 * `.public-auth` background.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <PublicShell mainClassName="public-auth flex flex-col items-center justify-center px-4 py-16 sm:px-6 sm:py-20">
      <AuthReveal className="w-full max-w-md">{children}</AuthReveal>
    </PublicShell>
  )
}
