"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { History } from "lucide-react"
import { usePageHistoryScreen } from "../_hooks/use-page-history-screen"
import { PageDetail } from "./page-detail"
import { PageList } from "./page-list"

export default function PageHistoryPage() {
  const screen = usePageHistoryScreen()
  return (
    <div className="space-y-6">
      <PageHeader
        title={<><History className="size-5 text-primary" /> Page history</>}
        description="Every time a page is checked it's saved with a date. See exactly what changed on each page, and how its Google clicks and rankings moved afterwards."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="min-w-0 xl:sticky xl:top-4 xl:self-start">
          <PageList screen={screen} />
        </aside>
        <div className="min-w-0">
          {screen.selectedId ? <PageDetail screen={screen} /> : !screen.list.loading && (
            <div className="rounded-2xl border border-dashed px-6 py-16 text-center text-sm text-muted-foreground">
              Pick a page to see its history.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
