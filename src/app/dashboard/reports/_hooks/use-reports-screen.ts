"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useAuditDetailLoader, useAuditHistory } from "@/hooks/api/use-page-audits"
import { gscQueries } from "@/hooks/api/use-gsc"
import { type AuditDetail } from "@/lib/api/audits"
import { type GscKeywordPerformance } from "@/lib/api/gsc"
import { useQueryClient } from "@tanstack/react-query"
import { type SiteReportData } from "@/lib/report/site-report"
import * as React from "react"
import { hostOf } from "../_lib/reports-helpers"

export function useReportsScreen() {

  // The workspace + website picked in the top bar.
  const { activeWorkspace, activeDomain: domain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  // Cached data (shared with Page Audit / Search Performance) — building a report reuses it.
  const qc = useQueryClient()
  const audits = useAuditHistory(workspaceId).data ?? []
  const loadAudit = useAuditDetailLoader(workspaceId)

  const [building, setBuilding] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)

  const [data, setData] = React.useState<SiteReportData | null>(null)

  async function generate() {
    if (!workspaceId || !domain) return
    setBuilding(true)
    setError(null)
    setData(null)
    try {
      const host = domain.domain.replace(/^www\./, "")

      // Latest audit whose host matches this domain.
      let audit: AuditDetail | null = null
      const match = audits.find((a) => hostOf(a.url) === host)
      if (match) {
        try {
          audit = await loadAudit(match.id)
        } catch {
          audit = null
        }
      }

      // Search Console data — real data only; left out when not connected.
      let gsc: GscKeywordPerformance | null = null
      try {
        const status = await qc.fetchQuery(gscQueries.status(workspaceId))
        if (status.connected) gsc = await qc.fetchQuery(gscQueries.firstPage(workspaceId, domain.id, 28))
      } catch {
        gsc = null
      }

      setData({ domain: host, audit, gsc, gscSample: false })
    } catch {
      setError("Could not build the report. Please try again.")
    } finally {
      setBuilding(false)
    }
  }
  return { domain, building, error, data, setData, generate }
}
