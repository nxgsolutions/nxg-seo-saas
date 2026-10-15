"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

/**
 * Shows a notification when the user returns from the Google Search Console
 * OAuth redirect (`…?gsc=connected|denied|error`), refreshes the GSC-backed
 * queries on success, then strips the query param so it doesn't fire again on
 * refresh. Mounted once in the dashboard layout.
 */
export function ConnectResultToast() {
  const params = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const qc = useQueryClient()
  const gsc = params.get("gsc")

  React.useEffect(() => {
    if (!gsc) return
    if (gsc === "connected") {
      toast.success("Google Search Console connected", {
        description: "Real rankings, clicks and competitor data will start syncing.",
      })
      void qc.invalidateQueries({ predicate: (q) => q.queryKey.includes("gsc") })
    } else if (gsc === "denied") {
      toast.error("Google sign-in was cancelled.")
    } else {
      toast.error("Could not connect Google Search Console. Please try again.")
    }
    // Remove the ?gsc=… param without a full navigation.
    const rest = new URLSearchParams(params.toString())
    rest.delete("gsc")
    const qs = rest.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname)
  }, [gsc, params, pathname, router, qc])

  return null
}
