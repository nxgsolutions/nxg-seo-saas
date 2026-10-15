"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { AlertTriangle, Gauge, History, Link2, Loader2, Monitor, Smartphone, X } from "lucide-react"
import type { usePageAuditScreen } from "../_hooks/use-page-audit-screen"

type Screen = ReturnType<typeof usePageAuditScreen>

/** URL (with the website's tracked pages as suggestions) + device + Run audit. */
export function AuditForm({ screen }: { screen: Screen }) {
  const { url, setUrl, device, setDevice, running, error, setError, runAudit, pageOptions } = screen
  return (
    <form onSubmit={runAudit} className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5" aria-busy={running}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-end">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Page to audit</span>
          <div className="relative">
            <Link2 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={url} onValueChange={(v) => { setUrl(v); if (error) setError(null) }} list="page-audit-pages"
              placeholder="https://yoursite.com/page" disabled={running} className="h-10 pl-9" inputMode="url"
              aria-invalid={Boolean(error) || undefined} />
            <datalist id="page-audit-pages">{pageOptions.map((p) => <option key={p} value={p} />)}</datalist>
          </div>
        </label>
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Device</span>
          <SegmentedTabs<"desktop" | "mobile"> value={device} onChange={(v) => !running && setDevice(v)} label="Device" items={[
            { value: "desktop", label: "Desktop", icon: Monitor },
            { value: "mobile", label: "Mobile", icon: Smartphone },
          ]} />
        </div>
        <Button type="submit" size="lg" disabled={running} className="h-10 lg:w-40">
          {running ? <><Loader2 className="size-4 animate-spin" /> Auditing…</> : <><Gauge className="size-4" /> Run audit</>}
        </Button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <History className="size-3.5" /> Every audit is saved with its date in Page history, so you can see what changed and what it did for your rankings.
      </p>
      {error && (
        <div role="alert" className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 flex-1">{error}</span>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="cursor-pointer rounded p-0.5 hover:bg-destructive/10">
            <X className="size-3.5" />
          </button>
        </div>
      )}
    </form>
  )
}
