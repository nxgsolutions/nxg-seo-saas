"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useInspectPage, useSitePages } from "@/hooks/api/use-pages"
import { errorMessage } from "@/lib/api/client"
import type { InspectResult } from "@/lib/api/pages"
import { cn, timeAgo } from "@/lib/utils"
import { AlertTriangle, DownloadCloud, History, Link2, Loader2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"

/**
 * "Load a live page" for the Title & Meta tools: pick one of the website's
 * tracked pages (or paste any URL) and read its current title, meta and social
 * tags. The read is saved to Page history like any other check.
 * `initialUrl` (e.g. from ?url=) is loaded automatically once.
 */
export function LivePageLoader({ onLoaded, initialUrl, className }: {
  onLoaded: (page: InspectResult) => void
  initialUrl?: string | null
  className?: string
}) {
  const { activeWorkspace, activeDomain } = useDashboard()
  const wid = activeWorkspace?.id ?? null
  const [url, setUrl] = React.useState(initialUrl ?? "")
  const [loaded, setLoaded] = React.useState<{ result: InspectResult; at: string } | null>(null)
  const inspect = useInspectPage(wid)
  const pages = useSitePages(wid, activeDomain?.id ?? null, 1, "", "checked", 50)
  const options = [...new Set([...(activeDomain ? [`https://${activeDomain.domain}/`] : []),
    ...(pages.data?.rows ?? []).map((p) => p.url)])]

  // Default the field to the active website's home page.
  const [prefilled, setPrefilled] = React.useState(Boolean(initialUrl))
  if (!prefilled && activeDomain) {
    setPrefilled(true)
    setUrl(`https://${activeDomain.domain}/`)
  }

  function load(target = url) {
    const u = target.trim()
    if (!u || !wid || inspect.isPending) return
    inspect.mutate(u, {
      onSuccess: (r) => {
        setUrl(r.url)
        setLoaded({ result: r, at: new Date().toISOString() })
        onLoaded(r)
      },
    })
  }

  // Auto-load a page passed in the link (once, after mount — it's a network call).
  const autoLoaded = React.useRef(false)
  const autoLoad = React.useEffectEvent((u: string) => load(u))
  React.useEffect(() => {
    if (autoLoaded.current || !initialUrl || !wid) return
    autoLoaded.current = true
    autoLoad(initialUrl)
  }, [initialUrl, wid])

  return (
    <section className={cn("rounded-2xl border bg-card p-4 shadow-xs sm:p-5", className)} aria-label="Load a live page">
      <form onSubmit={(e) => { e.preventDefault(); load() }} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Page</span>
          <div className="relative">
            <Link2 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={url} onValueChange={setUrl} list="live-page-options" placeholder="https://yoursite.com/page"
              disabled={inspect.isPending} className="h-10 pl-9" inputMode="url" />
            <datalist id="live-page-options">{options.map((o) => <option key={o} value={o} />)}</datalist>
          </div>
        </label>
        <Button type="submit" size="lg" variant="outline" disabled={inspect.isPending} className="h-10">
          {inspect.isPending ? <Loader2 className="size-4 animate-spin" /> : <DownloadCloud className="size-4" />}
          Load live page
        </Button>
      </form>
      {inspect.isError ? (
        <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {errorMessage(inspect.error, "Could not read that page.")}
        </p>
      ) : loaded ? (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>Loaded the live tags {timeAgo(loaded.at)}{loaded.result.changes.length ? ` · ${loaded.result.changes.length} change(s) since the last check` : ""}.</span>
          {loaded.result.page_id && (
            <Link href={`/dashboard/page-history?page=${loaded.result.page_id}`} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              <History className="size-3.5" /> Page history
            </Link>
          )}
        </p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Reads the page&apos;s current title, description and social tags so you edit the real values.</p>
      )}
    </section>
  )
}
