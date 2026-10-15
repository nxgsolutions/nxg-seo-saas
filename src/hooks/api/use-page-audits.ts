"use client"

/** Page Audit (TanStack Query, per workspace): recent audits (newest 25) + saved audit details. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { auditsApi, type AuditDetail, type AuditSummary } from "@/lib/api/audits"
import { queryKeys } from "@/lib/query/keys"

export function useAuditHistory(wid: string | null) {
  return useQuery({
    queryKey: queryKeys.pageAudits.list(wid ?? ""),
    queryFn: () => auditsApi.list(wid!),
    enabled: Boolean(wid),
  })
}

/** Run an audit: the result is cached and added to the top of the history. */
export function useRunAudit(wid: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { url: string; device: "desktop" | "mobile" }) => auditsApi.run(wid!, v.url, v.device),
    onSuccess: (res: AuditDetail) => {
      if (!wid) return
      qc.setQueryData(queryKeys.pageAudits.detail(wid, res.id), res)
      qc.setQueryData<AuditSummary[]>(queryKeys.pageAudits.list(wid), (prev = []) => [{
        id: res.id, url: res.url, score: res.score, status_code: res.status_code,
        load_time_ms: res.load_time_ms, created_at: res.created_at,
      }, ...prev.filter((a) => a.id !== res.id)])
      void qc.invalidateQueries({ queryKey: queryKeys.pages.all(wid) }) // a new page-history snapshot
    },
  })
}

/** A saved audit (cached — reopening one from the history is instant). */
export function useAuditDetailLoader(wid: string | null) {
  const qc = useQueryClient()
  return (id: string) => qc.fetchQuery({
    queryKey: queryKeys.pageAudits.detail(wid ?? "", id),
    queryFn: () => auditsApi.get(wid!, id),
    staleTime: Infinity, // a saved audit never changes
  })
}
