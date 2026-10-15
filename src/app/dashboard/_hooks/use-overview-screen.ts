"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useGscStatus } from "@/hooks/api/use-gsc"
import { useMembers } from "@/hooks/api/use-members"
import { useAuditHistory } from "@/hooks/api/use-page-audits"
import { auditsApi, type AuditSummary } from "@/lib/api/audits"
import { queryKeys } from "@/lib/query/keys"
import { useQuery } from "@tanstack/react-query"
import * as React from "react"
import { auditHost } from "../_lib/overview-helpers"

const NO_AUDITS: AuditSummary[] = [] // stable empty list (keeps memos stable)

export function useOverviewScreen() {

  const { user, activeWorkspace, domains, activeDomain, domainsLoading } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null

  // Cached, shared with the KPI hero / Search Performance (TanStack Query).
  const gscStatus = useGscStatus(workspaceId)
  const gscConnected = Boolean(gscStatus.data?.connected)

  // Cached, shared with Team / Page Audit (TanStack Query).
  const membersQuery = useMembers(workspaceId)
  const auditsQuery = useAuditHistory(workspaceId)
  const members = membersQuery.members
  const audits = auditsQuery.data ?? NO_AUDITS
  const loading = domainsLoading || (Boolean(workspaceId) && (membersQuery.isPending || auditsQuery.isPending))

  // The newest audit's full detail (same cache entry Page Audit uses).
  const latestId = audits[0]?.id ?? null
  const latest = useQuery({
    queryKey: queryKeys.pageAudits.detail(workspaceId ?? "", latestId ?? ""),
    queryFn: () => auditsApi.get(workspaceId!, latestId!),
    enabled: Boolean(workspaceId && latestId),
    staleTime: Infinity, // a saved audit never changes
  }).data ?? null

  const avgScore = audits.length
    ? Math.round(audits.reduce((s, a) => s + a.score, 0) / audits.length)
    : null

  // Latest audit's change vs the previous audit of the same URL.
  const latestDelta = React.useMemo(() => {
    if (audits.length < 2) return null
    const newest = audits[0]
    const prev = audits.slice(1).find((a) => a.url === newest.url)
    return prev ? newest.score - prev.score : null
  }, [audits])

  const health = latest
    ? {
      pass: latest.checks.filter((c) => c.status === "pass").length,
      warn: latest.checks.filter((c) => c.status === "warn").length,
      fail: latest.checks.filter((c) => c.status === "fail").length,
    }
    : null

  const issues = latest
    ? latest.checks
      .filter((c) => c.status !== "pass")
      .sort((a) => (a.status === "fail" ? -1 : 1))
    : []

  // Latest audit score per domain (match host).
  const siteScores = domains.map((w) => {
    const host = w.domain.replace(/^www\./, "")
    const a = audits.find((x) => auditHost(x.url) === host)
    return { domain: w, score: a?.score ?? null }
  })
  return { user, activeWorkspace, workspaceId, domains, activeDomain, gscConnected, members, audits, loading, latest, avgScore, latestDelta, health, issues, siteScores }
}
