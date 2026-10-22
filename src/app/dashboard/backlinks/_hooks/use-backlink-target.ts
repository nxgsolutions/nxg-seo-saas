"use client"

/**
 * Shared state for the target-scoped Backlinks pages (Overview, Explorer): the
 * domain being viewed lives in the URL (?target=), so it persists as you move
 * between those pages and into the site/page drill-downs. null = your own site.
 */

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import {
  useBacklinkAnalytics, useBacklinkDetails, useBacklinkOptions, useBacklinkProfile, useRefreshBacklinkProfile,
} from "@/hooks/api/use-backlinks"

export function useBacklinkTarget() {
  const { activeWorkspace, activeDomain } = useDashboard()
  const wid = activeWorkspace?.id ?? null
  const did = activeDomain?.id ?? null
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const target = params.get("target")

  const setTarget = React.useCallback((next: string | null) => {
    const sp = new URLSearchParams(params.toString())
    if (next) sp.set("target", next)
    else sp.delete("target")
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [params, pathname, router])

  const options = useBacklinkOptions(wid, did).data ?? null
  const profile = useBacklinkProfile(wid, did, target)
  const data = profile.data ?? null
  const hasData = Boolean(data?.summary)
  const details = useBacklinkDetails(wid, did, target, hasData).data ?? null
  const analytics = useBacklinkAnalytics(wid, did, target, hasData).data ?? null
  const refresh = useRefreshBacklinkProfile(wid, did)

  return { wid, did, activeDomain, options, profile, data, details, analytics, refresh, target, setTarget }
}
