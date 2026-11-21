"use client"

import { KeywordReportingPanel } from "@/components/rankings/keyword-reporting-panel"
import { NoDomain } from "@/components/dashboard/current-domain"
import { PageHeader } from "@/components/dashboard/page-header"
import { useActiveDomain, useActiveWorkspace } from "@/hooks/dashboard"

/** Brief "what this page does" shown in the title help popover. */
const reportingHelp = (
  <>
    <p><span className="font-medium text-foreground">Keyword Reporting</span> shows how many of your tracked keywords rank on Page 1, 2, 3 and beyond on Google over time.</p>
    <p className="mt-2">It reads your stored ranking history — no new lookups are used. Filter by date range and frequency; these filters are independent of the Keyword Rankings page.</p>
  </>
)

export default function KeywordReportingPage() {
  const activeWorkspace = useActiveWorkspace()
  const activeDomain = useActiveDomain()
  const wid = activeWorkspace?.id ?? null
  const siteId = activeDomain?.id ?? null

  return (
    <div className="space-y-6">
      <PageHeader
        title={<> Keyword Reporting </>}
        description={
          <>
            {activeDomain
              ? <>How many keywords rank on each Google result page for {activeDomain.domain} over time.</>
              : <>How many of your keywords rank on each Google result page over time.</>}
          </>
        }
        help={reportingHelp}
      />
      {!activeDomain ? (
        <NoDomain what="keyword reporting" />
      ) : (
        <KeywordReportingPanel workspaceId={wid} domainId={siteId} />
      )}
    </div>
  )
}
