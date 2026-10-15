"use client"

import { Pager } from "@/components/ui/pager"
import { SearchInput } from "@/components/ui/search-input"
import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import { useBacklinkRows } from "@/hooks/api/use-backlinks"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { AnchorRow, BacklinkList, BacklinkRow, DomainListRow, LinkedPageRow } from "@/lib/api/backlinks"
import { cn } from "@/lib/utils"
import { ArrowDownUp, ChevronDown, ExternalLink, FileText, Globe, Link2, Type } from "lucide-react"
import * as React from "react"

const PAGE_SIZE = 25
const num = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString())
const date = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString() : "—")

function authTone(r: number | null | undefined) {
  if (r == null) return "text-muted-foreground"
  return r >= 50 ? "text-emerald-600 dark:text-emerald-400" : r >= 20 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
}

const FILTERS: Record<BacklinkList, { value: string; label: string }[]> = {
  domains: [{ value: "all", label: "All linking sites" }, { value: "dofollow", label: "With dofollow links" }, { value: "nofollow", label: "Nofollow only" },
    { value: "clean", label: "Low spam (< 30)" }, { value: "spam", label: "Likely spam (≥ 30)" }, { value: "lost", label: "Lost" }],
  links: [{ value: "all", label: "All backlinks" }, { value: "dofollow", label: "Dofollow" }, { value: "nofollow", label: "Nofollow" },
    { value: "new", label: "New" }, { value: "lost", label: "Lost" }, { value: "broken", label: "Broken" }],
  anchors: [{ value: "all", label: "All anchor texts" }],
  pages: [{ value: "all", label: "All your pages" }],
}

type Sort = { key: string | null; desc: boolean }

function Th({ k, label, sort, setSort, className }: { k?: string; label: string; sort: Sort; setSort: (s: Sort) => void; className?: string }) {
  if (!k) return <th className={cn("px-3 py-2 font-medium", className)}>{label}</th>
  const active = sort.key === k
  return (
    <th className={cn("px-3 py-2 font-medium", className)} aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}>
      <button type="button" onClick={() => setSort({ key: k, desc: active ? !sort.desc : k !== "domain" })}
        className={cn("inline-flex cursor-pointer items-center gap-1", active && "text-foreground")}>
        {label}<ArrowDownUp className="size-3" />
      </button>
    </th>
  )
}

function LinkRow({ l }: { l: BacklinkRow }) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <tr className="align-top hover:bg-muted/40">
        <td className="max-w-[440px] px-4 py-2">
          <a href={l.url_from} target="_blank" rel="noopener noreferrer" className="block truncate font-medium text-primary hover:underline" title={l.url_from}>
            {l.page_from_title || l.domain_from || l.url_from}
          </a>
          <span className="block truncate text-xs text-muted-foreground">
            {l.anchor ? <>“{l.anchor}”</> : <em>no anchor text ({l.item_type ?? "link"})</em>}
          </span>
        </td>
        <td className="px-3 py-2">
          <span className={cn("rounded px-1.5 py-px text-xs font-medium",
            l.dofollow ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
            {l.dofollow ? "dofollow" : "nofollow"}
          </span>
          {l.is_new && <span className="ml-1 rounded bg-sky-500/10 px-1.5 py-px text-xs text-sky-600">new</span>}
          {l.is_lost && <span className="ml-1 rounded bg-destructive/10 px-1.5 py-px text-xs text-destructive">lost</span>}
          {l.is_broken && <span className="ml-1 rounded bg-amber-500/10 px-1.5 py-px text-xs text-amber-700">broken</span>}
        </td>
        <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", authTone(l.domain_from_rank))}>{l.domain_from_rank ?? "—"}</td>
        <td className="px-3 py-2 text-right text-xs text-muted-foreground">{date(l.first_seen)}</td>
        <td className="px-3 py-2 text-right">
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Show link details"
            className="inline-flex cursor-pointer items-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} />
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-muted/30">
          <td colSpan={5} className="px-4 py-3">
            <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
              {([
                ["Linking page", <a key="f" href={l.url_from} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{l.url_from}</a>],
                ["Links to", l.url_to ? <a key="t" href={l.url_to} target="_blank" rel="noopener noreferrer" className="break-all text-primary hover:underline">{l.url_to}</a> : "—"],
                ["Anchor text", l.anchor || "— (image or bare link)"],
                ["Link type", `${l.item_type ?? "link"} · ${l.dofollow ? "dofollow" : "nofollow"}`],
                ["Linking site", `${l.domain_from ?? "—"} · authority ${l.domain_from_rank ?? "—"}`],
                ["Spam score", l.spam_score == null ? "—" : `${l.spam_score} / 100${l.spam_score >= 30 ? " (likely spam)" : ""}`],
                ["First seen", date(l.first_seen)],
                ["Last seen", date(l.last_seen)],
              ] as [string, React.ReactNode][]).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2">
                  <dt className="text-muted-foreground">{k}</dt><dd className="min-w-0">{v}</dd>
                </div>
              ))}
            </dl>
          </td>
        </tr>
      )}
    </>
  )
}

/** Referring domains · backlinks · anchors · your linked pages — server-paged with search, filter and sort. */
export function ProfileLists({ wid, did, target, counts }: {
  wid: string; did: string; target: string | null
  counts: { domains: number; links: number; anchors: number }
}) {
  const [list, setList] = React.useState<BacklinkList>("domains")
  const [filter, setFilter] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const q = useDebouncedValue(search.trim(), 300)
  const [sort, setSort] = React.useState<Sort>({ key: null, desc: true })
  const [page, setPage] = React.useState(1)

  // New list / target → reset the controls; new search / filter / sort → page 1 (adjusted during render).
  const listKey = `${list}|${target}`
  const [seenList, setSeenList] = React.useState(listKey)
  if (seenList !== listKey) {
    setSeenList(listKey)
    setFilter("all"); setSearch(""); setSort({ key: null, desc: true }); setPage(1)
  }
  const filterKey = `${q}|${filter}|${sort.key}|${sort.desc}`
  const [seenFilter, setSeenFilter] = React.useState(filterKey)
  if (seenFilter !== filterKey) {
    setSeenFilter(filterKey)
    setPage(1)
  }

  const query = useBacklinkRows(wid, did, list, target, { page, pageSize: PAGE_SIZE, q, sort: sort.key, desc: sort.desc }, filter)
  const rows = query.data?.rows ?? []
  const loading = query.isPending
  const fetching = query.isFetching && !query.isPending
  const filters = FILTERS[list]

  return (
    <section className="rounded-2xl border bg-card shadow-xs" aria-label="Backlink lists">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <SegmentedTabs<BacklinkList> value={list} onChange={setList} label="Lists" items={[
          { value: "domains", label: "Linking sites", icon: Globe, count: counts.domains },
          { value: "links", label: "Backlinks", icon: Link2, count: counts.links },
          { value: "anchors", label: "Anchor texts", icon: Type, count: counts.anchors },
          { value: "pages", label: "Your linked pages", icon: FileText },
        ]} />
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <SearchInput value={search} onValueChange={setSearch} placeholder="Search…" className="min-w-[180px] flex-1 sm:w-56" />
          {filters.length > 1 && (
            <Select value={filter} onValueChange={(v) => setFilter(v ?? "all")}>
              <SelectTrigger className="h-9 w-48" aria-label="Filter"><SelectValue>{(v) => filters.find((f) => f.value === v)?.label}</SelectValue></SelectTrigger>
              <SelectContent>{filters.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="relative">
        <div aria-hidden="true" className={cn("absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden transition-opacity", fetching ? "opacity-100" : "opacity-0")}>
          <div className="h-full w-1/3 animate-[progress_1s_ease-in-out_infinite] bg-primary" />
        </div>
        {loading ? <TableSkeleton rows={8} columns={4} label="Loading…" /> : rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">{q || filter !== "all" ? "Nothing matches your search or filter." : "Nothing saved in this list."}</p>
        ) : (
          <div className={cn("overflow-x-auto transition-opacity", fetching && "opacity-60")}>
            {list === "domains" && (
              <table className="w-full min-w-[720px] text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <Th k="domain" label="Linking site" sort={sort} setSort={setSort} className="px-4" />
                  <Th k="authority" label="Authority" sort={sort} setSort={setSort} className="text-right" />
                  <Th k="backlinks" label="Links to you" sort={sort} setSort={setSort} className="text-right" />
                  <Th label="Dofollow" sort={sort} setSort={setSort} className="text-right" />
                  <Th k="spam" label="Spam" sort={sort} setSort={setSort} className="text-right" />
                  <Th k="first_seen" label="First seen" sort={sort} setSort={setSort} className="px-4 text-right" />
                </tr></thead>
                <tbody className="divide-y">
                  {(rows as DomainListRow[]).map((r) => (
                    <tr key={r.domain} className="hover:bg-muted/40">
                      <td className="px-4 py-2">
                        <a href={`https://${r.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
                          {r.domain}<ExternalLink className="size-3" />
                        </a>
                        {r.lost_date && <span className="ml-2 rounded bg-destructive/10 px-1 text-xs text-destructive">lost {date(r.lost_date)}</span>}
                      </td>
                      <td className={cn("px-3 py-2 text-right font-semibold tabular-nums", authTone(r.rank))}>{r.rank ?? "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(r.backlinks)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(r.dofollow_backlinks)}</td>
                      <td className={cn("px-3 py-2 text-right tabular-nums", (r.spam_score ?? 0) >= 30 ? "font-medium text-destructive" : "text-muted-foreground")}
                        title={(r.spam_score ?? 0) >= 30 ? "Likely spam site" : undefined}>{r.spam_score ?? "—"}</td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground">{date(r.first_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {list === "links" && (
              <table className="w-full min-w-[760px] text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <Th label="Linking page · anchor text" sort={sort} setSort={setSort} className="px-4" />
                  <Th label="Type" sort={sort} setSort={setSort} />
                  <Th k="authority" label="Authority" sort={sort} setSort={setSort} className="text-right" />
                  <Th k="first_seen" label="First seen" sort={sort} setSort={setSort} className="text-right" />
                  <th className="w-10 px-3 py-2"><span className="sr-only">Details</span></th>
                </tr></thead>
                <tbody className="divide-y">{(rows as BacklinkRow[]).map((l, i) => <LinkRow key={`${l.url_from}:${i}`} l={l} />)}</tbody>
              </table>
            )}
            {list === "anchors" && (
              <table className="w-full min-w-[600px] text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <Th label="Anchor text" sort={sort} setSort={setSort} className="px-4" />
                  <Th k="backlinks" label="Backlinks" sort={sort} setSort={setSort} className="text-right" />
                  <Th k="domains" label="Linking sites" sort={sort} setSort={setSort} className="text-right" />
                  <Th label="Nofollow sites" sort={sort} setSort={setSort} className="text-right" />
                  <Th k="first_seen" label="First seen" sort={sort} setSort={setSort} className="px-4 text-right" />
                </tr></thead>
                <tbody className="divide-y">
                  {(rows as AnchorRow[]).map((a, i) => (
                    <tr key={`${a.anchor}:${i}`} className="hover:bg-muted/40">
                      <td className="max-w-[420px] truncate px-4 py-2 font-medium">{a.anchor || <em className="text-muted-foreground">(empty — image or bare link)</em>}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(a.backlinks)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(a.referring_domains)}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{num(a.referring_domains_nofollow)}</td>
                      <td className="px-4 py-2 text-right text-xs text-muted-foreground">{date(a.first_seen)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {list === "pages" && (
              <table className="w-full min-w-[640px] text-sm">
                <thead><tr className="border-b text-left text-xs text-muted-foreground">
                  <Th label="Your page" sort={sort} setSort={setSort} className="px-4" />
                  <Th k="links" label="Links" sort={sort} setSort={setSort} className="text-right" />
                  <Th k="domains" label="Linking sites" sort={sort} setSort={setSort} className="text-right" />
                  <Th label="Dofollow" sort={sort} setSort={setSort} className="text-right" />
                  <Th k="authority" label="Best authority" sort={sort} setSort={setSort} className="px-4 text-right" />
                </tr></thead>
                <tbody className="divide-y">
                  {(rows as LinkedPageRow[]).map((p) => (
                    <tr key={p.url} className="align-top hover:bg-muted/40">
                      <td className="max-w-[420px] px-4 py-2">
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="block truncate font-medium text-primary hover:underline" title={p.url}>{p.url.replace(/^https?:\/\//, "")}</a>
                        {p.anchors.length > 0 && <span className="block truncate text-xs text-muted-foreground">Anchors: {p.anchors.map((a) => `“${a}”`).join(", ")}</span>}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(p.links)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(p.domains)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{num(p.dofollow)}</td>
                      <td className={cn("px-4 py-2 text-right font-semibold tabular-nums", authTone(p.best_authority))}>{p.best_authority ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
      <Pager className="border-t px-4 py-1.5" pagination={query.data?.pagination} onPageChange={setPage} fetching={fetching}
        noun={list === "domains" ? "linking sites" : list === "links" ? "backlinks" : list === "anchors" ? "anchor texts" : "pages"} />
      <p className="border-t px-4 py-2 text-xs text-muted-foreground">
        {list === "links" || list === "pages"
          ? "From the saved strongest backlinks (one per linking site)."
          : list === "domains" ? "The strongest linking sites saved in the last fetch." : "The most-used anchor texts saved in the last fetch."}
      </p>
    </section>
  )
}
