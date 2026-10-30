"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { UrlCombobox } from "@/components/ui/url-combobox"
import { AlertTriangle, Gauge, History, Loader2, Monitor, Smartphone, X } from "lucide-react"
import type { usePageScoreScreen } from "../_hooks/use-page-score-screen"

type Screen = ReturnType<typeof usePageScoreScreen>

/** URL (with tracked pages as suggestions) + optional target keyword + device + Run. */
export function ScoreForm({ screen }: { screen: Screen }) {
  const { url, setUrl, keyword, setKeyword, device, setDevice, running, error, setError, runScore, pageOptions } = screen
  return (
    <form onSubmit={runScore} className="rounded-2xl border bg-card p-4 shadow-xs sm:p-5" aria-busy={running}>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,16rem)_auto_auto] lg:items-end">
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Page to score</span>
          <UrlCombobox value={url} onValueChange={(v) => { setUrl(v); if (error) setError(null) }}
            items={pageOptions} placeholder="https://yoursite.com/page" disabled={running}
            invalid={Boolean(error)} aria-label="Page to score" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Target keyword <span className="text-muted-foreground/70">(optional)</span></span>
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. running shoes"
            disabled={running} className="h-11" aria-label="Target keyword" />
        </label>
        <div className="grid gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Device</span>
          <SegmentedTabs<"desktop" | "mobile"> value={device} onChange={(v) => !running && setDevice(v)} label="Device" className="h-11" items={[
            { value: "desktop", label: "Desktop", icon: Monitor },
            { value: "mobile", label: "Mobile", icon: Smartphone },
          ]} />
        </div>
        <Button type="submit" size="lg" disabled={running} className="h-11 lg:w-36">
          {running ? <><Loader2 className="size-4 animate-spin" /> Scoring…</> : <><Gauge className="size-4" /> Get score</>}
        </Button>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <History className="size-3.5" /> The keyword tunes content checks. Every score is saved with its date in Page history, so you can see what changed.
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
