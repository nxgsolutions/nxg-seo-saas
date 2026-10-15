"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { KeyRound } from "lucide-react"
import { useKeywordResearchScreen } from "../_hooks/use-keyword-research-screen"
import { KeywordSearch } from "./keyword-search"
import { RecentSearches } from "./recent-searches"

export default function KeywordResearchPage({ query = null }: { query?: string | null }) {
  const { workspaceId, recent, activeId, setActiveId, openSearch } = useKeywordResearchScreen()

  return (
    <div className="space-y-6">
      <PageHeader title={<> <KeyRound className="size-5 text-primary" /> Keyword Analysis </>} description={<> Type a topic to find what people search for — how often, how hard it is to rank, and what it&apos;s worth.
        Every search is saved so you can come back to it. </>} />

      <KeywordSearch workspaceId={workspaceId} activeId={activeId} onShow={setActiveId} query={query} />

      {/* Recent keyword searches — opening one loads it from cache / the DB (no provider call). */}
      <RecentSearches query={recent} activeId={activeId} onOpen={openSearch} />
    </div>
  )
}
