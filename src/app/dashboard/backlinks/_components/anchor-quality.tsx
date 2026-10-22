"use client"

import { AlertTriangle, Globe2, ShieldCheck, Type } from "lucide-react"
import type { ReactNode } from "react"

import type { AnchorMix, BreakdownItem, DiversitySignals } from "@/lib/api/backlinks"
import { cn } from "@/lib/utils"

const pct = (n: number | null | undefined) => (n == null ? "—" : `${Math.round(n * 100)}%`)

function Card({ icon: Icon, title, children }: { icon: typeof Type; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-xs" aria-label={title}>
      <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-primary" /> {title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Bars({ items, empty = "No data" }: { items: BreakdownItem[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  if (!items.length) return <p className="text-xs text-muted-foreground">{empty}</p>
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[7rem_minmax(0,1fr)_3rem] items-center gap-2 text-sm">
          <span className="truncate" title={i.label}>{i.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(2, (i.count / max) * 100)}%` }} />
          </span>
          <span className="text-right text-xs tabular-nums text-muted-foreground">{i.count.toLocaleString()}</span>
        </li>
      ))}
    </ul>
  )
}

type Tone = "ok" | "warn" | "bad"
const DOT: Record<Tone, string> = { ok: "bg-emerald-500", warn: "bg-amber-500", bad: "bg-destructive" }

function Signal({ tone, label, value }: { tone: Tone; label: string; value: string }) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-2"><span className={cn("size-2 rounded-full", DOT[tone])} aria-hidden="true" /> {label}</span>
      <span className="tabular-nums text-muted-foreground">{value}</span>
    </li>
  )
}

export function AnchorQuality({ anchors, diversity }: { anchors: AnchorMix | null; diversity: DiversitySignals | null }) {
  if (!anchors && !diversity) return null
  const spam = diversity?.spammy_share ?? null
  const spamTone: Tone = spam == null ? "ok" : spam >= 0.5 ? "bad" : spam >= 0.2 ? "warn" : "ok"
  const dofollowTone: Tone = diversity?.dofollow_share != null && diversity.dofollow_share < 0.1 ? "warn" : "ok"
  const anchorTone: Tone = anchors?.over_optimized ? "bad" : "ok"
  const concentratedTone: Tone = diversity?.concentrated ? "warn" : "ok"
  const ipTone: Tone = diversity?.shared_ips ? "warn" : "ok"
  const tones = [spamTone, dofollowTone, anchorTone, concentratedTone, ipTone]
  const bad = tones.filter((t) => t === "bad").length
  const warn = tones.filter((t) => t === "warn").length
  const band = bad >= 2 ? "Poor" : bad === 1 || warn >= 2 ? "Fair" : "Good"
  const bandTone: Tone = band === "Poor" ? "bad" : band === "Fair" ? "warn" : "ok"

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card icon={Type} title="Anchor text mix">
        {anchors ? (
          <>
            <Bars items={anchors.classes.map((c) => ({ label: c.label, count: c.count }))} empty="No anchors saved" />
            {anchors.over_optimized && (
              <p className="mt-3 flex gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 px-2.5 py-2 text-xs">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-amber-600" />
                A large share of links use keyword-rich anchors. A natural profile is mostly branded and generic — worth reviewing, not necessarily a problem.
              </p>
            )}
          </>
        ) : <p className="text-xs text-muted-foreground">No anchor data.</p>}
      </Card>

      <Card icon={ShieldCheck} title="Link quality">
        <div className="mb-3 flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", DOT[bandTone])} aria-hidden="true" />
          <span className="text-sm font-medium">{band}</span>
          <span className="text-xs text-muted-foreground">overall read</span>
        </div>
        <ul className="space-y-2">
          <Signal tone={spamTone} label="Spammy linking sites" value={pct(spam)} />
          <Signal tone={dofollowTone} label="Dofollow share" value={pct(diversity?.dofollow_share)} />
          <Signal tone={anchorTone} label="Keyword-rich anchors" value={pct(anchors?.classes.find((c) => c.label === "Exact match")?.share)} />
          <Signal tone={concentratedTone} label="Links per domain" value={diversity?.links_per_domain != null ? String(diversity.links_per_domain) : "—"} />
          <Signal tone={ipTone} label="Distinct IPs" value={diversity?.referring_ips != null ? diversity.referring_ips.toLocaleString() : "—"} />
        </ul>
        <p className="mt-2 text-[11px] text-muted-foreground">Signals to investigate — no single number means a link is bad.</p>
      </Card>

      <Card icon={Globe2} title="Where links come from">
        <p className="mb-2 text-xs text-muted-foreground">
          {diversity?.referring_domains?.toLocaleString() ?? "—"} linking sites across {diversity?.referring_ips?.toLocaleString() ?? "—"} IPs
        </p>
        <Bars items={[...(diversity?.top_tlds ?? []), ...(diversity?.top_countries ?? [])].slice(0, 6)} />
      </Card>
    </div>
  )
}
