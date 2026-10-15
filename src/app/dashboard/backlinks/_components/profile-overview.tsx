"use client"

import type { BacklinkDetails, BreakdownItem } from "@/lib/api/backlinks"
import { cn, timeAgo } from "@/lib/utils"
import { ArrowDownRight, ArrowUpRight, Globe2, History, Layers, Link2, ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"

const fmt = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString())

function Card({ icon: Icon, title, hint, children }: { icon: typeof Globe2; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-xs" aria-label={title}>
      <h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className="size-4 text-primary" /> {title}</h3>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  )
}

/** Horizontal bars, one scale per list (longest = full width). */
function Bars({ items, empty = "No data" }: { items: BreakdownItem[]; empty?: string }) {
  const max = Math.max(1, ...items.map((i) => i.count))
  const total = items.reduce((a, i) => a + i.count, 0)
  if (!items.length || !total) return <p className="text-xs text-muted-foreground">{empty}</p>
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)_3.5rem] items-center gap-2 text-sm">
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

function Delta({ label, value }: { label: string; value: number | null }) {
  if (value == null) return null
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs",
      value > 0 ? "text-emerald-700 dark:text-emerald-400" : value < 0 ? "text-destructive" : "text-muted-foreground")}>
      {value > 0 ? <ArrowUpRight className="size-3.5" /> : value < 0 ? <ArrowDownRight className="size-3.5" /> : null}
      {label} {value > 0 ? "+" : ""}{value.toLocaleString()}
    </span>
  )
}

/** Since the previous fetch: totals moved, and which linking sites appeared / disappeared. */
export function ProfileChanges({ details }: { details: BacklinkDetails }) {
  const c = details.changes
  if (!c) return null
  return (
    <section className="rounded-2xl border bg-card p-4 shadow-xs" aria-label="Changes since last fetch">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><History className="size-4 text-primary" /> Since the previous fetch ({timeAgo(c.previous_fetched_at)})</h3>
        <div className="flex flex-wrap gap-1.5">
          <Delta label="Backlinks" value={c.backlinks} />
          <Delta label="Linking domains" value={c.referring_domains} />
          <Delta label="Authority" value={c.rank} />
        </div>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {[{ title: "New linking sites", list: c.gained_domains, tone: "border-emerald-500/30 bg-emerald-500/5" },
          { title: "Linking sites no longer seen", list: c.lost_domains, tone: "border-destructive/25 bg-destructive/5" }].map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">{g.title} ({g.list.length})</p>
            {g.list.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {g.list.slice(0, 20).map((d) => <li key={d} className={cn("rounded-full border px-2 py-0.5 text-xs", g.tone)}>{d}</li>)}
              </ul>
            ) : <p className="text-xs text-muted-foreground">None among the saved top linking sites.</p>}
          </div>
        ))}
      </div>
    </section>
  )
}

/** Link quality + where links come from. */
export function ProfileBreakdowns({ details }: { details: BacklinkDetails }) {
  const b = details.breakdowns
  const st = details.link_status
  if (!b) return null
  const follow = b.follow.filter((f) => f.label === "Dofollow" || f.label === "Nofollow")
  const total = follow.reduce((a, f) => a + f.count, 0)
  const dofollowPct = total ? Math.round(((follow.find((f) => f.label === "Dofollow")?.count ?? 0) / total) * 100) : null
  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
      <Card icon={ShieldCheck} title="Link quality" hint={b.referring_pages != null ? `${fmt(b.referring_pages)} linking pages in total` : undefined}>
        {dofollowPct != null && (
          <>
            <div className="flex items-baseline justify-between text-sm">
              <span><span className="text-lg font-semibold tabular-nums">{dofollowPct}%</span> dofollow</span>
              <span className="text-xs text-muted-foreground">{100 - dofollowPct}% nofollow</span>
            </div>
            <div className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <span className="h-full bg-emerald-500" style={{ width: `${dofollowPct}%` }} />
              <span className="h-full bg-muted-foreground/40" style={{ width: `${100 - dofollowPct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Dofollow links pass ranking value; nofollow mostly don&apos;t.</p>
          </>
        )}
        {st && (
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[["New", st.new, "text-sky-600 dark:text-sky-400"], ["Lost", st.lost, "text-destructive"], ["Broken", st.broken, "text-amber-600 dark:text-amber-400"]].map(([l, v, c]) => (
              <div key={l as string} className="rounded-lg border px-2 py-1.5">
                <dt className="text-[11px] text-muted-foreground">{l}</dt>
                <dd className={cn("text-base font-semibold tabular-nums", (v as number) > 0 && (c as string))}>{v as number}</dd>
              </div>
            ))}
          </dl>
        )}
        {st && <p className="mt-1 text-[11px] text-muted-foreground">Among the {st.saved} saved strongest links.</p>}
      </Card>
      <Card icon={Globe2} title="Linking sites by domain ending" hint="Top-level domains of the linking pages">
        <Bars items={b.tlds} />
      </Card>
      <Card icon={Layers} title="Countries" hint="Where the linking sites are hosted">
        <Bars items={b.countries} />
      </Card>
      <Card icon={Link2} title="Link types & platforms" hint="How they link, and what kind of site">
        <Bars items={[...b.link_types, ...b.platforms.map((p) => ({ label: p.label === "Unknown" ? "Unknown site type" : p.label, count: p.count }))].slice(0, 8)} />
      </Card>
    </div>
  )
}

/** Every saved fetch of this domain (newest first). */
export function FetchHistory({ details }: { details: BacklinkDetails }) {
  if (details.history.length < 1) return null
  return (
    <section className="rounded-2xl border bg-card shadow-xs" aria-label="Fetch history">
      <h3 className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold"><History className="size-4 text-primary" /> Fetch history</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead><tr className="border-b text-xs text-muted-foreground">
            <th className="px-4 py-2 text-left font-medium">Fetched</th>
            <th className="px-3 py-2 text-right font-medium">Authority</th>
            <th className="px-3 py-2 text-right font-medium">Backlinks</th>
            <th className="px-3 py-2 text-right font-medium">Linking domains</th>
            <th className="px-3 py-2 text-right font-medium">Spam</th>
            {/* Cost column hidden — h.cost has the provider-reported USD per fetch. */}
          </tr></thead>
          <tbody className="divide-y">
            {details.history.map((h) => (
              <tr key={h.fetched_at}>
                <td className="px-4 py-2" title={new Date(h.fetched_at).toLocaleString()}>{new Date(h.fetched_at).toLocaleDateString()} <span className="text-xs text-muted-foreground">({timeAgo(h.fetched_at)})</span></td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(h.rank)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(h.backlinks)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(h.referring_domains)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{fmt(h.spam_score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
