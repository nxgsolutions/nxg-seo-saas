"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useAuditHistory, useRunAudit } from "@/hooks/api/use-page-audits"
import { useSitePages } from "@/hooks/api/use-pages"
import { auditsApi, type AuditSummary } from "@/lib/api/audits"
import { errorMessage } from "@/lib/api/client"
import { queryKeys } from "@/lib/query/keys"
import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { computeDeltas, hostOf } from "../_lib/page-audit-helpers"

const NO_AUDITS: AuditSummary[] = [] // stable empty list (keeps the memo below stable)

/**
 * Page Audit state. The open audit lives in ?audit=<id> (refresh / shared link
 * reopens it); ?url= prefills the form (links from Page history etc.). History,
 * saved audits and the website's tracked pages come from TanStack Query.
 */
export function usePageAuditScreen() {
  const { activeWorkspace, domains, activeDomain } = useDashboard()
  const workspaceId = activeWorkspace?.id ?? null
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const [url, setUrl] = React.useState(() => params.get("url") ?? "")
  const [device, setDevice] = React.useState<"desktop" | "mobile">("desktop")
  const [error, setError] = React.useState<string | null>(null)

  // Default the URL to the active website's home page (once it's known).
  const [prefilled, setPrefilled] = React.useState(Boolean(params.get("url")))
  if (!prefilled && activeDomain) {
    setPrefilled(true)
    setUrl(`https://${activeDomain.domain}/`)
  }

  const historyQuery = useAuditHistory(workspaceId)
  const history = historyQuery.data ?? NO_AUDITS
  const historyForId = historyQuery.isPending ? null : workspaceId
  const runMutation = useRunAudit(workspaceId)
  const running = runMutation.isPending

  // Open audit (cached forever — a saved audit never changes).
  const openId = params.get("audit")
  const auditQuery = useQuery({
    queryKey: queryKeys.pageAudits.detail(workspaceId ?? "", openId ?? ""),
    queryFn: () => auditsApi.get(workspaceId!, openId!),
    enabled: Boolean(workspaceId && openId),
    staleTime: Infinity,
  })
  const result = auditQuery.data ?? null

  function open(id: string | null) {
    const next = new URLSearchParams(params.toString())
    next.delete("url")
    if (id) next.set("audit", id)
    else next.delete("audit")
    const qs = next.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  function runAudit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const target = url.trim()
    if (!target || !workspaceId) {
      setError("Enter a URL to audit.")
      return
    }
    runMutation.mutate({ url: target, device }, {
      onSuccess: (res) => open(res.id),
      onError: (err) => setError(errorMessage(err)),
    })
  }

  function openHistory(id: string) {
    setError(null)
    open(id)
  }

  // Suggestions: the active website's tracked pages (newest checked first).
  const sitePages = useSitePages(workspaceId, activeDomain?.id ?? null, 1, "", "checked", 50)
  const pageOptions = React.useMemo(() => {
    const home = activeDomain ? [`https://${activeDomain.domain}/`] : []
    return [...new Set([...home, ...(sitePages.data?.rows ?? []).map((p) => p.url)])]
  }, [sitePages.data, activeDomain])

  const deltas = React.useMemo(() => computeDeltas(history), [history])

  // Match the audited URL to a workspace domain so GSC can resolve a property.
  const gscMatch = React.useMemo(() => {
    if (!result) return { domainId: null as string | null, host: "" }
    const host = hostOf(result.url)
    const site = domains.find((w) => w.domain.toLowerCase().replace(/^www\./, "") === host)
    return { domainId: site?.id ?? null, host }
  }, [result, domains])

  return {
    workspaceId, url, setUrl, device, setDevice, running, error, setError, result,
    resultLoading: Boolean(openId) && auditQuery.isPending, resultError: auditQuery.isError,
    history, historyForId, runAudit, openHistory, deltas, gscMatch, pageOptions,
  }
}
