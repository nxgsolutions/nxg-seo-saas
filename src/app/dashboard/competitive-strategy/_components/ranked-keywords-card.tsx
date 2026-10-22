"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Pager } from "@/components/ui/pager"
import { TableSkeleton } from "@/components/ui/table-skeleton"
import {
  useAddRankedCompetitor,
  useRankedEstimate,
  useRankedKeywords,
  useRankedOptions,
  useRankedRefresh,
} from "@/hooks/api/use-ranked-keywords"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { errorMessage } from "@/lib/api/client"
import {
  rankedKeywordsApi,
  type RankedFilters,
  type RankedKeywordRow,
  type RankedKeywordsEstimate,
  type RankedScope,
} from "@/lib/api/opportunity"
import { fetchAllPages } from "@/lib/api/pagination"
import { downloadCsv } from "@/lib/report/csv"
import { cn, timeAgo } from "@/lib/utils"
import {
  ArrowDown,
  ArrowUp,
  CloudDownload,
  Download,
  ExternalLink,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
  Swords,
  UserPlus,
  X,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { useDiscoverCompetitors } from "@/hooks/api/use-competitors"
import { queryKeys } from "@/lib/query/keys"
import { toast } from "sonner"
import * as React from "react"
import { compact, posColor } from "../_lib/competitive-strategy-helpers"
import { RankedPagesTable } from "./ranked-pages-table"
import { KeywordActionsMenu } from "@/components/keywords/keyword-actions-menu"
import {
  CompetitorCombobox,
  type CompetitorOption,
} from "@/components/dashboard/competitor-combobox"
import { SearchInput } from "@/components/ui/search-input"
import { ColumnHelp, HeaderWithHelp } from "@/components/ui/column-help"
import { COLUMN_HELP } from "@/lib/column-help"

const SCOPES: { id: RankedScope; label: string; hint: string }[] = [
  {
    id: "top",
    label: "Top 100",
    hint: "Top keywords by traffic (one request)",
  },
  // "Relevant" = the backend topic rule (DATAFORSEO_RELEVANT_KEYWORD_REGEX) + position/volume limits.
  {
    id: "relevant",
    label: "Relevant",
    hint: "Keywords on your topic that rank in the top 20 with 50+ searches",
  },
  // "all" stays in the map for labelling any legacy stored run, but is hidden
  // from the scope selector (see VISIBLE_SCOPES) — it's the only costly scope.
  {
    id: "all",
    label: "All keywords",
    hint: "Every keyword the domain ranks for (paged, capped)",
  },
]
// Scopes offered in the UI. "all" is intentionally omitted to steer users to the
// two cheap, high-value scopes (Top 100 + Relevant); the backend still supports it.
const VISIBLE_SCOPES = SCOPES.filter((s) => s.id !== "all")
const STOP_REASON: Record<string, string> = {
  complete: "complete",
  cap_reached: "stopped at the per-load limit",
  // The provider returned no new rows (e.g. repeated pages) — stop early.
  no_new_keywords: "no more new keywords",
}
// Prices are not shown in the UI. Format if needed: n > 0 ? `~$${n.toFixed(n < 0.1 ? 3 : 2)}` : "free"

const PAGE_SIZE = 15
const BUCKETS = [
  { id: "all", label: "All positions", test: () => true },
  { id: "top3", label: "Top 3", test: (p: number) => p <= 3 },
  { id: "top10", label: "4–10", test: (p: number) => p > 3 && p <= 10 },
  { id: "top20", label: "11–20", test: (p: number) => p > 10 && p <= 20 },
  { id: "rest", label: "21+", test: (p: number) => p > 20 },
] as const
type SortKey =
  | "etv"
  | "position"
  | "search_volume"
  | "keyword_difficulty"
  | "keyword"

function kdColor(v: number | null) {
  if (v == null) return "text-muted-foreground"
  return v >= 70
    ? "text-red-500"
    : v >= 40
      ? "text-amber-500"
      : "text-emerald-600 dark:text-emerald-400"
}

function Change({ row }: { row: RankedKeywordRow }) {
  if (row.is_new)
    return (
      <span className="ml-1 rounded bg-sky-500/15 px-1 text-xs font-semibold text-sky-600 dark:text-sky-400">
        NEW
      </span>
    )
  if (!row.change) return null
  const up = row.change > 0
  const Icon = up ? ArrowUp : ArrowDown
  return (
    <span
      className={cn(
        "ml-1 inline-flex items-center text-xs font-medium",
        up ? "text-emerald-600 dark:text-emerald-400" : "text-red-500",
      )}
      title={`Was #${row.prev_position}`}
    >
      <Icon className="size-3" />
      {Math.abs(row.change)}
    </span>
  )
}

type Sort = { key: SortKey; dir: "asc" | "desc" }

function SortTh({
  k,
  sort,
  onSort,
  children,
  help,
  className,
}: {
  k: SortKey
  sort: Sort
  onSort: (k: SortKey) => void
  children: React.ReactNode
  help?: React.ReactNode
  className?: string
}) {
  const active = sort.key === k
  return (
    <th className={cn("px-3 py-2 text-right font-medium", className)}>
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={() => onSort(k)}
          className={cn(
            "inline-flex items-center gap-0.5 uppercase",
            active && "text-foreground",
          )}
        >
          {children}
          {active &&
            (sort.dir === "asc" ? (
              <ArrowUp className="size-3" />
            ) : (
              <ArrowDown className="size-3" />
            ))}
        </button>
        {help && (
          <ColumnHelp
            text={help}
            label={typeof children === "string" ? children : undefined}
          />
        )}
      </span>
    </th>
  )
}

/** Keyword title + tags. `linked`: underline the keyword when its parent link is hovered. */
function KeywordLine({
  row,
  linked = false,
}: {
  row: RankedKeywordRow
  linked?: boolean
}) {
  return (
    <span className="flex items-center gap-1.5 truncate font-medium text-primary">
      <span className={cn("truncate", linked && "group-hover:underline")}>
        {row.keyword}
      </span>
      {row.intent && (
        <span className="shrink-0 rounded bg-muted px-1 text-xs font-normal capitalize text-muted-foreground">
          {row.intent}
        </span>
      )}
      {row.tracked && (
        <span
          className="shrink-0 rounded bg-primary/10 px-1 text-xs font-normal text-primary"
          title="In your tracked keywords"
        >
          tracked
        </span>
      )}
    </span>
  )
}

interface Props {
  workspaceId: string
  domainId: string
  /** Domain picked elsewhere (e.g. the footprint table's "Rankings" button). */
  selected: string | null
  onSelect: (domain: string) => void
}

/** Keywords a domain ACTUALLY ranks for — position, ranking URL, traffic — from
 * stored DataForSEO Labs data, compared with your own positions. Opening a
 * domain reads the DB only; Fetch/Refresh is the only paid action. */
export function RankedKeywordsCard({
  workspaceId,
  domainId,
  selected,
  onSelect,
}: Props) {
  const [error, setError] = React.useState<string | null>(null)
  const [q, setQ] = React.useState("")
  const debouncedQ = useDebouncedValue(q)
  const [bucket, setBucket] =
    React.useState<(typeof BUCKETS)[number]["id"]>("all")
  const [show, setShow] = React.useState<"all" | "gap" | "common">("all")
  const [sort, setSort] = React.useState<Sort>({ key: "etv", dir: "desc" })
  const [page, setPage] = React.useState(1)
  // Scope being viewed (null = newest stored run of any scope).
  const [scope, setScope] = React.useState<RankedScope | null>(null)
  const [view, setView] = React.useState<"keywords" | "pages">("keywords")
  const [urlFilter, setUrlFilter] = React.useState<string | null>(null)
  const [estimate, setEstimate] = React.useState<RankedKeywordsEstimate | null>(
    null,
  )
  const [exporting, setExporting] = React.useState(false)

  // A different domain starts from its newest run (adjusted during render).
  const [prevSelected, setPrevSelected] = React.useState(selected)
  if (selected !== prevSelected) {
    setPrevSelected(selected)
    setScope(null)
    setEstimate(null)
    setUrlFilter(null)
    setView("keywords")
    setPage(1)
    setError(null)
  }
  // Any filter / search / sort / scope change starts again at page 1.
  const filterKey = `${debouncedQ}|${bucket}|${show}|${sort.key}|${sort.dir}|${urlFilter}|${scope}`
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  // Data (TanStack Query): options + ONE page of rows, filtered/sorted server-side.
  const options = useRankedOptions(workspaceId, domainId).data ?? null
  const list = {
    page,
    pageSize: PAGE_SIZE,
    sort: sort.key,
    order: sort.dir,
    q: debouncedQ,
  } as const
  const filters: RankedFilters = { bucket, show, url: urlFilter }
  const ranked = useRankedKeywords(
    workspaceId,
    domainId,
    selected,
    scope,
    list,
    filters,
  )
  // Previous page/filter stays on screen while the next loads, but never another domain's rows.
  const data =
    ranked.data &&
    (!ranked.isPlaceholderData || ranked.data.target === selected)
      ? ranked.data
      : null
  const loading = ranked.isFetching
  const loadError = ranked.isError
    ? errorMessage(ranked.error, "Could not load keywords.")
    : null

  const qc = useQueryClient()
  const discoverMutation = useDiscoverCompetitors(workspaceId, domainId)
  const refreshMutation = useRankedRefresh(workspaceId, domainId)
  const estimateMutation = useRankedEstimate(workspaceId, domainId)
  const addMutation = useAddRankedCompetitor(workspaceId, domainId)
  const fetching = refreshMutation.isPending
  const estimating = estimateMutation.isPending
  const adding = addMutation.isPending

  // The scope the actions apply to: the one picked, else the run shown.
  const activeScope: RankedScope = scope ?? data?.scope ?? "top"

  function pickScope(s: RankedScope) {
    setScope(s)
    setEstimate(null)
    setUrlFilter(null)
  }

  /** Paid: fetch / refresh the open domain; the list then reloads from the DB. */
  function fetchNow(force: boolean) {
    if (!selected) return
    setError(null)
    refreshMutation.mutate(
      {
        domain: selected,
        force,
        scope: activeScope,
        maxKeywords:
          activeScope !== "top" && estimate ? estimate.to_fetch : undefined,
      },
      {
        onSuccess: () => {
          setEstimate(null)
          setScope(activeScope)
          setPage(1)
        },
        onError: (e) => setError(errorMessage(e, "Couldn't load the data.")),
      },
    )
  }

  // Live fetching is allowed for your own site and your competitor list, so adding
  // the open domain as a competitor unlocks Fetch; on "Top 100" it fetches right away.
  function addAndFetch() {
    if (!selected) return
    setError(null)
    addMutation.mutate(selected, {
      onSuccess: () => {
        toast.success(`Added ${selected} to your competitors`)
        if (activeScope === "top") fetchNow(false)
      },
      onError: (e) =>
        setError(errorMessage(e, "Could not add the competitor.")),
    })
  }

  function checkCost() {
    if (!selected) return
    setError(null)
    estimateMutation.mutate(
      { domain: selected, scope: activeScope },
      {
        onSuccess: setEstimate,
        onError: (e) => setError(errorMessage(e, "Could not check the size.")),
      },
    )
  }

  const pageRows = data?.rows ?? []

  function sortBy(key: SortKey) {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : {
            key,
            dir:
              key === "position" ||
              key === "keyword_difficulty" ||
              key === "keyword"
                ? "asc"
                : "desc",
          },
    )
  }

  /** Every row matching the current filters (fetched in big pages), as CSV. */
  async function exportCsv() {
    if (!data || !selected) return
    setExporting(true)
    try {
      const rows = await fetchAllPages((p, size) =>
        rankedKeywordsApi
          .get(
            workspaceId,
            domainId,
            selected,
            scope,
            { ...list, page: p, pageSize: size },
            filters,
          )
          .then((d) => ({ rows: d.rows, pagination: d.pagination! })),
      )
      downloadCsv(
        `${data.target}-ranked-keywords`,
        [
          "Keyword",
          "Position",
          "Previous",
          "URL",
          "Volume",
          "Est. traffic",
          "CPC",
          "Paid difficulty",
          "SEO difficulty",
          "Intent",
          "Your position",
        ],
        rows.map((r) => [
          r.keyword,
          r.position ?? "",
          r.prev_position ?? "",
          r.url ?? "",
          r.search_volume ?? "",
          r.etv ?? "",
          r.cpc ?? "",
          r.paid_difficulty ?? "",
          r.keyword_difficulty ?? "",
          r.intent ?? "",
          r.our_position ?? "",
        ]),
      )
    } catch (e) {
      toast.error(errorMessage(e, "Could not export."))
    } finally {
      setExporting(false)
    }
  }

  // Saved runs per domain — drives the "data saved" status everywhere.
  const storedBy = React.useMemo(
    () => new Map((options?.stored ?? []).map((s) => [s.target, s])),
    [options],
  )

  // Combobox options: you, then domains with saved data (newest first), then the
  // rest of your competitors. Each row says whether data is saved, so a long
  // competitor list stays in one searchable dropdown instead of a wall of chips.
  const comboOptions = React.useMemo<CompetitorOption[]>(() => {
    const you = options?.your_domain
    const domains = new Set<string>()
    if (you) domains.add(you)
    for (const s of [...(options?.stored ?? [])].sort((a, b) =>
      b.fetched_at.localeCompare(a.fetched_at),
    ))
      domains.add(s.target)
    for (const s of options?.suggestions ?? []) domains.add(s)
    return [...domains].map((d) => {
      const st = storedBy.get(d)
      return {
        domain: d,
        group: d === you ? "Your site" : st ? "Saved" : "Not loaded yet",
        hint: st
          ? `${compact(st.items_count)} kw · ${timeAgo(st.fetched_at)}`
          : undefined,
      }
    })
  }, [options, storedBy])

  // Before anything is opened: a handful of quick picks (saved data first).
  const quickPicks = comboOptions.slice(0, 6)
  const morePicks = comboOptions.length - quickPicks.length
  // New workspace: the only option is your own site — no competitors found/added yet.
  const noCompetitors = comboOptions.length <= 1
  const discovering = discoverMutation.isPending

  /** First-run: auto-find competitors for the current domain (AI), then the
   * combobox / quick-picks fill in. No trip to the competitor list needed. */
  function findCompetitors() {
    if (!domainId) return
    setError(null)
    discoverMutation.mutate(
      { extraServices: [] },
      {
        onSuccess: (res) => {
          qc.invalidateQueries({
            queryKey: queryKeys.rankedKeywords.options(workspaceId, domainId),
          })
          const n = (res as { count?: number } | undefined)?.count
          toast.success(
            n
              ? `Found ${n} competitors — pick one to see its keywords`
              : "Competitor search complete",
          )
        },
        onError: (e) =>
          setError(
            errorMessage(e, "Could not find competitors. Please try again."),
          ),
      },
    )
  }

  const storedHere = data?.stored_scopes.find((x) => x.scope === activeScope)
  // Stored rows exist for this scope (filters may still match none on this page).
  const hasRows = Boolean(data && data.items_count > 0)
  const scopeLabel =
    SCOPES.find((s) => s.id === activeScope)?.label ?? "Top 100"

  // The one action for the open domain: fetch / refresh / add-then-fetch / disabled.
  function fetchAction(big = false) {
    if (!data) return null
    const size = big ? "default" : "sm"
    if (data.can_fetch) {
      if (activeScope !== "top") {
        return (
          <Button
            size={size}
            variant={hasRows ? "outline" : "default"}
            disabled={estimating || fetching}
            onClick={checkCost}
            title="See how many keywords match before anything loads"
          >
            {estimating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : hasRows ? (
              <RefreshCw className="size-4" />
            ) : (
              <CloudDownload className="size-4" />
            )}
            {hasRows ? "Refresh" : "Load keywords"}
          </Button>
        )
      }
      const refresh = Boolean(storedHere)
      return (
        <Button
          size={size}
          variant={refresh ? "outline" : "default"}
          disabled={fetching}
          onClick={() => fetchNow(refresh)}
        >
          {fetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : refresh ? (
            <RefreshCw className="size-4" />
          ) : (
            <CloudDownload className="size-4" />
          )}
          {fetching
            ? "Loading…"
            : refresh
              ? "Refresh"
              : `Load top ${data.default_limit} keywords`}
          {/* Price hidden in the UI — estimated USD: usd(data.estimated_cost). */}
        </Button>
      )
    }
    if (data.live_enabled && !data.is_you) {
      return (
        <Button size={size} disabled={adding || fetching} onClick={addAndFetch}>
          {adding || fetching ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <UserPlus className="size-4" />
          )}
          {activeScope === "top"
            ? "Add to competitors & load"
            : "Add to competitors"}
          {/* Price hidden in the UI — estimated USD: usd(data.estimated_cost). */}
        </Button>
      )
    }
    return (
      <Button
        size={size}
        variant="outline"
        disabled
        title="Loading new data is turned off right now"
      >
        <RefreshCw className="size-4" />{" "}
        {hasRows ? "Refresh" : "Load keywords"}
      </Button>
    )
  }

  // Why the action is what it is (shown under it / in the empty state).
  const actionNote = !data
    ? null
    : data.can_fetch
      ? activeScope === "top"
        ? null
        : "You'll see how many keywords match before anything loads."
      : data.live_enabled && !data.is_you
        ? "Only domains on your competitor list can be loaded."
        : "Loading new data is turned off right now — saved data is still shown."

  return (
    <Card id="ranked-keywords">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-base">
              Where competitors actually rank
            </CardTitle>
            <CardDescription>
              {/* Opening a domain reads stored data only; Fetch / Refresh is the one paid call (DataForSEO Labs). */}
              Keywords a domain ranks for on Google — position, ranking page and
              traffic, next to yours.
            </CardDescription>
          </div>
          <CompetitorCombobox
            options={comboOptions}
            onPick={onSelect}
            value={selected}
            className="sm:w-96"
            placeholder={
              comboOptions.length > 0
                ? `Search ${comboOptions.length} domains or type one…`
                : "Type a domain, e.g. example.com"
            }
          />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {(error ?? loadError) && (
          <div className="mx-6 mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error ?? loadError}
          </div>
        )}

        {!selected && noCompetitors ? (
          <div className="border-t border-border px-6 py-12 text-center">
            <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Swords className="size-5" />
            </div>
            <p className="font-medium">
              You haven&apos;t added any competitors yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Find the sites competing for your keywords — we&apos;ll analyze{" "}
              <span className="font-medium text-foreground">
                {options?.your_domain ?? "your site"}
              </span>{" "}
              and suggest your top rivals. You can also type a domain in the
              search above.
            </p>
            <div className="mt-5 flex justify-center">
              <Button
                size="lg"
                onClick={findCompetitors}
                disabled={discovering || !domainId}
                className="min-w-56"
              >
                {discovering ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Finding
                    competitors…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Find my competitors
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : !selected ? (
          <div className="border-t border-border px-6 py-10 text-center">
            <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Search className="size-5" />
            </div>
            <p className="font-medium">Pick a competitor to see its keywords</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Use the search box above, or start with one of these.
              <span className="ml-2 inline-flex items-center gap-1 text-xs">
                <span className="size-1.5 rounded-full bg-emerald-500" /> saved
              </span>
            </p>
            {quickPicks.length > 0 && (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {quickPicks.map((o) => (
                  <button
                    key={o.domain}
                    type="button"
                    onClick={() => onSelect(o.domain)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-primary/50 hover:bg-primary/5"
                  >
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        storedBy.has(o.domain)
                          ? "bg-emerald-500"
                          : "bg-muted-foreground/40",
                      )}
                    />
                    {o.domain}
                    {o.domain === options?.your_domain && (
                      <span className="text-xs text-muted-foreground">
                        (you)
                      </span>
                    )}
                  </button>
                ))}
                {morePicks > 0 && (
                  <span className="self-center text-xs text-muted-foreground">
                    +{morePicks} more in search
                  </span>
                )}
              </div>
            )}
          </div>
        ) : !data && loading ? (
          <div className="border-t border-border">
            <TableSkeleton
              rows={8}
              columns={6}
              label={`Loading ${selected}…`}
            />
          </div>
        ) : data ? (
          <div className={cn("transition-opacity", loading && "opacity-60")}>
            {/* Open domain: name, data status, the one action */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-lg font-semibold">{selected}</h3>
                  {data.is_you && (
                    <span className="rounded bg-muted px-1.5 py-px text-xs text-muted-foreground">
                      your site
                    </span>
                  )}
                  {loading && (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                {storedHere ? (
                  <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span className="font-medium text-foreground">
                      {compact(storedHere.items_count)} {scopeLabel} keywords
                    </span>
                    · updated {timeAgo(storedHere.fetched_at)}
                    {data.scope === activeScope &&
                    data.stop_reason &&
                    data.stop_reason !== "complete"
                      ? ` · ${STOP_REASON[data.stop_reason]}`
                      : ""}
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="size-2 rounded-full bg-amber-500" />
                    <span className="font-medium text-amber-700 dark:text-amber-400">
                      Not loaded yet
                    </span>
                    · no {scopeLabel} keywords for this domain
                  </p>
                )}
              </div>
              {hasRows && (
                <div className="flex flex-col items-end gap-1">
                  {fetchAction()}
                  {actionNote && (
                    <p className="max-w-xs text-right text-xs text-muted-foreground">
                      {actionNote}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Which saved data set to view (switching is free) */}
            <div className="flex flex-wrap items-center gap-3 border-t border-border px-6 py-3">
              <span className="text-xs text-muted-foreground">Show</span>
              <div className="inline-flex rounded-lg bg-muted p-0.5">
                {VISIBLE_SCOPES.map((s) => {
                  const st = data.stored_scopes.find((x) => x.scope === s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => pickScope(s.id)}
                      title={s.hint}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors",
                        activeScope === s.id
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {s.label}
                      {st ? (
                        <span className="tabular-nums text-muted-foreground">
                          {compact(st.items_count)}
                        </span>
                      ) : (
                        <span
                          className="size-1.5 rounded-full bg-muted-foreground/30"
                          title="Not loaded yet"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
              <span className="text-xs text-muted-foreground">
                {activeScope === "relevant" && data.relevant_rule
                  ? `Topic keywords · top ${data.relevant_rule.max_position} · ${data.relevant_rule.min_volume}+ searches`
                  : SCOPES.find((s) => s.id === activeScope)?.hint}
              </span>
            </div>

            {/* Headline numbers — only when there is something to count */}
            {hasRows && (
              <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
                {[
                  [
                    "Ranks for (all keywords)",
                    data.total_count != null ? compact(data.total_count) : "—",
                  ],
                  [
                    "Top 3 / Top 10",
                    `${data.summary.top3} / ${data.summary.top10}`,
                  ],
                  ["Est. monthly traffic", compact(data.summary.etv)],
                  [
                    data.is_you
                      ? "In your tracked list"
                      : "Keywords you don't rank for",
                    data.is_you
                      ? String(data.summary.tracked)
                      : String(data.summary.gap),
                  ],
                ].map(([label, value]) => (
                  <div key={label} className="bg-card px-6 py-3">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-xl font-semibold tabular-nums">
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Size + cost check before a multi-page fetch */}
            {estimate && estimate.scope === activeScope && (
              <div className="mx-6 mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
                <div className="space-y-0.5">
                  <p>
                    <strong>{estimate.matching_count.toLocaleString()}</strong>{" "}
                    {activeScope === "relevant" ? "relevant " : ""}keywords
                    match. Load{" "}
                    <strong>{estimate.to_fetch.toLocaleString()}</strong> of
                    them now.
                    {/* Not shown: estimate.requests paid requests, usd(estimate.estimated_cost). */}
                  </p>
                  {estimate.capped && (
                    <p className="text-xs text-muted-foreground">
                      Limited to {estimate.max_keywords.toLocaleString()}{" "}
                      keywords at a time.
                      {/* Not shown: per-fetch cap estimate.max_cost (USD), full cost usd(estimate.full_cost). */}
                    </p>
                  )}
                  {/* Not shown: this size check cost usd(estimate.check_cost). */}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEstimate(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={fetching || estimate.to_fetch === 0}
                    onClick={() =>
                      fetchNow(
                        Boolean(
                          data.stored_scopes.find(
                            (x) => x.scope === activeScope,
                          ),
                        ),
                      )
                    }
                  >
                    {fetching ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <CloudDownload className="size-4" />
                    )}
                    Load {estimate.to_fetch.toLocaleString()} keywords
                  </Button>
                </div>
              </div>
            )}

            {!hasRows ? (
              !(estimate && estimate.scope === activeScope) && (
                <div className="border-t border-border px-6 py-10 text-center">
                  <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Inbox className="size-5" />
                  </div>
                  <p className="font-medium">
                    No {scopeLabel} keywords saved for {selected} yet
                  </p>
                  <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                    {activeScope === "top"
                      ? "Load its top keywords to see positions, ranking pages, traffic — and which ones you're missing."
                      : "Load this data to see it here."}
                  </p>
                  <div className="mt-4 flex justify-center">
                    {fetchAction(true)}
                  </div>
                  {actionNote && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {actionNote}
                    </p>
                  )}
                  {data.stored_scopes.some((x) => x.scope !== "all") && (
                    <p className="mt-4 text-xs text-muted-foreground">
                      Already saved:{" "}
                      {data.stored_scopes
                        .filter((x) => x.scope !== "all")
                        .map((x, i) => (
                          <React.Fragment key={x.scope}>
                            {i > 0 && " · "}
                            <button
                              type="button"
                              onClick={() => pickScope(x.scope)}
                              className="font-medium text-primary hover:underline"
                            >
                              {SCOPES.find((sc) => sc.id === x.scope)?.label} (
                              {compact(x.items_count)})
                            </button>
                          </React.Fragment>
                        ))}
                    </p>
                  )}
                </div>
              )
            ) : (
              <>
                {/* Keywords / Top pages */}
                <div className="flex gap-4 border-t border-border px-6">
                  {(
                    [
                      ["keywords", `Keywords (${data.items_count})`],
                      ["pages", `Top pages (${data.pages.length})`],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setView(id)}
                      className={cn(
                        "border-b-2 py-2 text-sm font-medium transition-colors",
                        view === id
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {view === "pages" ? (
                  <RankedPagesTable
                    pages={data.pages}
                    workspaceId={workspaceId}
                    domainId={domainId}
                    onShowKeywords={(url) => {
                      setUrlFilter(url)
                      setView("keywords")
                    }}
                  />
                ) : (
                  <>
                    {urlFilter && (
                      <div className="flex items-center gap-2 border-t border-border px-6 py-2 text-xs">
                        <span className="text-muted-foreground">Page:</span>
                        <span className="truncate font-medium">
                          {urlFilter}
                        </span>
                        <button
                          type="button"
                          onClick={() => setUrlFilter(null)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Clear page filter"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    )}
                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-3">
                      <SearchInput
                        value={q}
                        onValueChange={setQ}
                        placeholder="Filter keywords…"
                        className="min-w-[180px] flex-1"
                      />
                      <div className="flex flex-wrap gap-1">
                        {BUCKETS.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => setBucket(b.id)}
                            className={cn(
                              "rounded-md px-2 py-1 text-xs",
                              bucket === b.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                      {!data.is_you && (
                        <div className="flex gap-1">
                          {(
                            [
                              ["all", "All"],
                              ["gap", `You don't rank (${data.summary.gap})`],
                              [
                                "common",
                                `You also rank (${data.summary.common})`,
                              ],
                            ] as const
                          ).map(([id, label]) => (
                            <button
                              key={id}
                              type="button"
                              onClick={() => setShow(id)}
                              className={cn(
                                "rounded-md px-2 py-1 text-xs",
                                show === id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-full text-sm sm:min-w-[980px]">
                        <thead>
                          <tr className="border-y border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-4 py-2 font-medium sm:px-6">
                              <span className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => sortBy("keyword")}
                                  className={cn(
                                    "inline-flex items-center gap-0.5 uppercase",
                                    sort.key === "keyword" && "text-foreground",
                                  )}
                                >
                                  Keyword · ranking URL
                                  {sort.key === "keyword" &&
                                    (sort.dir === "asc" ? (
                                      <ArrowUp className="size-3" />
                                    ) : (
                                      <ArrowDown className="size-3" />
                                    ))}
                                </button>
                                <ColumnHelp
                                  text={COLUMN_HELP.keywordUrl}
                                  label="Keyword"
                                />
                              </span>
                            </th>
                            <SortTh
                              k="position"
                              sort={sort}
                              onSort={sortBy}
                              help={COLUMN_HELP.position}
                            >
                              Pos.
                            </SortTh>
                            <SortTh
                              k="search_volume"
                              sort={sort}
                              onSort={sortBy}
                              help={COLUMN_HELP.volume}
                              className="hidden sm:table-cell"
                            >
                              Volume
                            </SortTh>
                            <SortTh
                              k="etv"
                              sort={sort}
                              onSort={sortBy}
                              help={COLUMN_HELP.estTraffic}
                              className="hidden min-[480px]:table-cell"
                            >
                              Est. traffic
                            </SortTh>
                            <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">
                              <HeaderWithHelp help={COLUMN_HELP.cpc}>
                                CPC
                              </HeaderWithHelp>
                            </th>
                            <SortTh
                              k="keyword_difficulty"
                              sort={sort}
                              onSort={sortBy}
                              help={COLUMN_HELP.seoDifficulty}
                              className="hidden min-[480px]:table-cell"
                            >
                              SEO diff.
                            </SortTh>
                            {!data.is_you && (
                              <th className="px-4 py-2 text-right font-medium sm:px-6">
                                <HeaderWithHelp help={COLUMN_HELP.yourPosition}>
                                  Your pos.
                                </HeaderWithHelp>
                              </th>
                            )}
                          </tr>
                        </thead>
                        <tbody
                          className={cn(
                            "divide-y divide-border/60 transition-opacity",
                            ranked.isPlaceholderData && "opacity-60",
                          )}
                        >
                          {pageRows.length === 0 && (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-6 py-10 text-center text-sm text-muted-foreground"
                              >
                                No keywords match these filters.
                              </td>
                            </tr>
                          )}
                          {pageRows.map((r) => (
                            <tr key={r.keyword} className="hover:bg-muted/40">
                              <td className="max-w-[200px] px-4 py-2 sm:max-w-[420px] sm:px-6">
                                <div className="flex min-w-0 items-start gap-2">
                                  <KeywordActionsMenu
                                    keyword={r.keyword}
                                    workspaceId={workspaceId}
                                    domainId={domainId}
                                    className="mt-px"
                                  />
                                  <div className="min-w-0 flex-1">
                                    {r.url ? (
                                      // Keyword + URL are one link to the competitor's ranking page.
                                      <a
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        title={
                                          r.title
                                            ? `${r.title}\n${r.url}`
                                            : r.url
                                        }
                                        className="group block min-w-0"
                                      >
                                        <KeywordLine row={r} linked />
                                        <span className="flex items-center gap-1 truncate text-xs text-muted-foreground group-hover:text-foreground">
                                          <span className="truncate">
                                            {r.url}
                                          </span>
                                          <ExternalLink className="size-3 shrink-0" />
                                        </span>
                                      </a>
                                    ) : (
                                      <KeywordLine row={r} />
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                <span
                                  className={cn(
                                    "font-semibold",
                                    r.position != null && posColor(r.position),
                                  )}
                                >
                                  {r.position ?? "—"}
                                </span>
                                <Change row={r} />
                              </td>
                              <td className="hidden px-3 py-2 text-right tabular-nums sm:table-cell">
                                {r.search_volume != null
                                  ? r.search_volume.toLocaleString()
                                  : "—"}
                              </td>
                              <td className="hidden px-3 py-2 text-right tabular-nums min-[480px]:table-cell">
                                {r.etv != null ? compact(r.etv) : "—"}
                              </td>
                              <td className="hidden px-3 py-2 text-right tabular-nums text-muted-foreground sm:table-cell">
                                {r.cpc != null ? `$${r.cpc.toFixed(2)}` : "—"}
                              </td>
                              <td
                                className={cn(
                                  "hidden px-3 py-2 text-right font-semibold tabular-nums min-[480px]:table-cell",
                                  kdColor(r.keyword_difficulty),
                                )}
                              >
                                {r.keyword_difficulty ?? "—"}
                              </td>
                              {!data.is_you && (
                                <td className="px-4 py-2 text-right tabular-nums sm:px-6">
                                  {r.our_position != null ? (
                                    <a
                                      href={r.our_url ?? undefined}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={cn(
                                        posColor(r.our_position),
                                        r.our_url && "hover:underline",
                                      )}
                                      title={
                                        r.our_position_source === "gsc"
                                          ? "From your search data"
                                          : (r.our_url ?? "")
                                      }
                                    >
                                      {r.our_position}
                                    </a>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      gap
                                    </span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-6 py-2">
                      <Pager
                        className="flex-1"
                        noun="keywords"
                        pagination={data.pagination}
                        fetching={loading}
                        onPageChange={setPage}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportCsv}
                        disabled={exporting}
                      >
                        {exporting ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Download className="size-3.5" />
                        )}{" "}
                        Export CSV
                      </Button>
                    </div>
                    {!data.is_you && !data.has_our_run && (
                      <p className="px-6 pb-3 text-xs text-muted-foreground">
                        Your positions come from your search data. Load your
                        own domain for a full comparison.
                      </p>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
