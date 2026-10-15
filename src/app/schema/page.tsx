import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, Check, KeyRound, Link2, Minus } from "lucide-react"

import { SchemaFlow, type FlowNode } from "@/components/schema/schema-flow"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Database Schema",
  description:
    "Entity-relationship overview of the keyword research schema, and how first-party data compares to a paid provider.",
}

// ---------------------------------------------------------------------------
// Schema definition (documentation only — mirrors the SQLAlchemy models).
// ---------------------------------------------------------------------------

type Key = "pk" | "fk" | null
interface Column {
  name: string
  type: string
  key?: Key
}
interface Entity {
  name: string
  note: string
  group: "master" | "keyword"
  columns: Column[]
}

const ENTITIES: Entity[] = [
  // ---- master / supporting ----
  {
    name: "users",
    group: "master",
    note: "Accounts. Every keyword traces back to a user via workspace membership.",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "email", type: "string" },
      { name: "first_name", type: "string" },
      { name: "is_active", type: "boolean" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "workspaces",
    group: "master",
    note: "The team / billing boundary. All SEO data is scoped under a workspace.",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "name", type: "string" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "workspace_members",
    group: "master",
    note: "Join table: a user's role in a workspace (owner / admin / member).",
    columns: [
      { name: "workspace_id", type: "uuid", key: "fk" },
      { name: "user_id", type: "uuid", key: "fk" },
      { name: "role", type: "string" },
    ],
  },
  {
    name: "domains",
    group: "master",
    note: "A domain being optimized. Keywords are scoped per domain.",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "workspace_id", type: "uuid", key: "fk" },
      { name: "domain", type: "string" },
      { name: "name", type: "string" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "gsc_connections",
    group: "master",
    note: "Google Search Console OAuth token — the primary free data source.",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "workspace_id", type: "uuid", key: "fk" },
      { name: "property_url", type: "string" },
      { name: "refresh_token", type: "string" },
    ],
  },
  // ---- keyword research ----
  {
    name: "keywords",
    group: "keyword",
    note: "Canonical keyword, de-duplicated per domain + locale. The hub table.",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "domain_id", type: "uuid", key: "fk" },
      { name: "keyword", type: "string" },
      { name: "normalized_keyword", type: "string" },
      { name: "country_code", type: "char(2)" },
      { name: "language_code", type: "char(2)" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "keyword_metrics",
    group: "keyword",
    note: "Daily snapshot of all signals + computed scores (one per keyword per day).",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "keyword_id", type: "uuid", key: "fk" },
      { name: "intent", type: "string" },
      { name: "gsc_impressions", type: "int" },
      { name: "gsc_clicks", type: "int" },
      { name: "gsc_position", type: "decimal" },
      { name: "trend_index", type: "int" },
      { name: "trend_change_pct", type: "int" },
      { name: "difficulty", type: "int" },
      { name: "opportunity_score", type: "decimal" },
      { name: "relevance_score", type: "decimal" },
      { name: "confidence_score", type: "decimal" },
      { name: "captured_on", type: "date" },
    ],
  },
  {
    name: "keyword_sources",
    group: "keyword",
    note: "Provenance / audit trail: which source surfaced each keyword.",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "keyword_id", type: "uuid", key: "fk" },
      { name: "source_type", type: "string" },
      { name: "source_reference", type: "string" },
      { name: "captured_at", type: "timestamp" },
    ],
  },
  {
    name: "keyword_relations",
    group: "keyword",
    note: "Self-referential links (related / variant / parent / question).",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "keyword_id", type: "uuid", key: "fk" },
      { name: "related_keyword_id", type: "uuid", key: "fk" },
      { name: "relation_type", type: "string" },
      { name: "score", type: "decimal" },
    ],
  },
  {
    name: "keyword_clusters",
    group: "keyword",
    note: "Topic groups, hierarchical via parent_cluster_id.",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "domain_id", type: "uuid", key: "fk" },
      { name: "name", type: "string" },
      { name: "parent_cluster_id", type: "uuid", key: "fk" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "keyword_cluster_members",
    group: "keyword",
    note: "Many-to-many join of keywords ↔ clusters, with membership score.",
    columns: [
      { name: "cluster_id", type: "uuid", key: "fk" },
      { name: "keyword_id", type: "uuid", key: "fk" },
      { name: "score", type: "decimal" },
    ],
  },
  {
    name: "keyword_researches",
    group: "keyword",
    note: "One research run from a seed keyword (pending → running → completed).",
    columns: [
      { name: "id", type: "uuid", key: "pk" },
      { name: "domain_id", type: "uuid", key: "fk" },
      { name: "seed_keyword", type: "string" },
      { name: "status", type: "string" },
      { name: "created_at", type: "timestamp" },
    ],
  },
  {
    name: "keyword_research_results",
    group: "keyword",
    note: "Ranked output of a run (keyword + rank).",
    columns: [
      { name: "research_id", type: "uuid", key: "fk" },
      { name: "keyword_id", type: "uuid", key: "fk" },
      { name: "rank", type: "int" },
    ],
  },
]

const RELATIONS: { from: string; to: string }[] = [
  { from: "workspace_members.user_id", to: "users.id" },
  { from: "workspace_members.workspace_id", to: "workspaces.id" },
  { from: "domains.workspace_id", to: "workspaces.id" },
  { from: "gsc_connections.workspace_id", to: "workspaces.id" },
  { from: "keywords.domain_id", to: "domains.id" },
  { from: "keyword_clusters.domain_id", to: "domains.id" },
  { from: "keyword_researches.domain_id", to: "domains.id" },
  { from: "keyword_metrics.keyword_id", to: "keywords.id" },
  { from: "keyword_sources.keyword_id", to: "keywords.id" },
  { from: "keyword_relations.keyword_id", to: "keywords.id" },
  { from: "keyword_relations.related_keyword_id", to: "keywords.id" },
  { from: "keyword_cluster_members.keyword_id", to: "keywords.id" },
  { from: "keyword_cluster_members.cluster_id", to: "keyword_clusters.id" },
  { from: "keyword_clusters.parent_cluster_id", to: "keyword_clusters.id" },
  { from: "keyword_research_results.research_id", to: "keyword_researches.id" },
  { from: "keyword_research_results.keyword_id", to: "keywords.id" },
]

// One illustrative example row per table (shown on hover in the flow diagram).
const EXAMPLES: Record<string, string> = {
  users: `{ email: "admin@iaspirants.com",\n  first_name: "Admin",\n  is_active: true }`,
  workspaces: `{ name: "IAspirants SEO" }`,
  workspace_members: `{ user_id: "…",\n  workspace_id: "…",\n  role: "owner" }`,
  domains: `{ domain: "iaspirants.com",\n  name: "IAspirants" }`,
  gsc_connections: `{ property_url:\n    "sc-domain:iaspirants.com" }`,
  keywords: `{ keyword: "upsc preparation",\n  normalized_keyword:\n    "upsc preparation",\n  country_code: "us" }`,
  keyword_metrics: `{ intent: "informational",\n  gsc_impressions: 40500,\n  gsc_position: 3.2,\n  difficulty: 42,\n  opportunity_score: 96,\n  captured_on: "2026-09-07" }`,
  keyword_sources: `{ source_type: "autocomplete",\n  captured_at: "2026-09-07" }`,
  keyword_relations: `{ relation_type: "question",\n  score: 0.82 }\n// upsc preparation →\n// how to start upsc prep`,
  keyword_clusters: `{ name: "UPSC Preparation",\n  parent_cluster_id: null }`,
  keyword_cluster_members: `{ cluster_id: "…",\n  keyword_id: "…",\n  score: 0.9 }`,
  keyword_researches: `{ seed_keyword: "upsc pyqs",\n  status: "completed" }`,
  keyword_research_results: `{ research_id: "…",\n  keyword_id: "…",\n  rank: 1 }`,
}

const FLOW_NODES: FlowNode[] = ENTITIES.map((e) => ({
  name: e.name,
  group: e.group,
  cols: e.columns.length,
  note: e.note,
  example: EXAMPLES[e.name] ?? "",
}))

// ---------------------------------------------------------------------------
// First-party vs DataForSEO comparison.
// ---------------------------------------------------------------------------

interface CompareRow {
  field: string
  firstParty: string
  dataforseo: string
  firstPartyGood: boolean
}

const COMPARE: CompareRow[] = [
  {
    field: "Search volume",
    firstParty: "GSC impressions (only for keywords you already rank for) + Google Trends 0–100 relative index",
    dataforseo: "Absolute monthly volume for ANY keyword (e.g. 40,500)",
    firstPartyGood: false,
  },
  {
    field: "Keyword ideas",
    firstParty: "Google Autocomplete + your own GSC queries",
    dataforseo: "Thousands of ideas from a clickstream database, each with volume",
    firstPartyGood: false,
  },
  {
    field: "Keyword difficulty (KD)",
    firstParty: "Word-count heuristic (rough estimate, labelled)",
    dataforseo: "Real difficulty from backlink/SERP authority",
    firstPartyGood: false,
  },
  {
    field: "Search intent",
    firstParty: "Rule engine (deterministic, explainable)",
    dataforseo: "Provider-labelled intent",
    firstPartyGood: true,
  },
  {
    field: "Opportunity score",
    firstParty: "Computed: demand × striking-distance × easiness (transparent)",
    dataforseo: "Not provided — you build it yourself anyway",
    firstPartyGood: true,
  },
  {
    field: "CPC / paid competition",
    firstParty: "Not available",
    dataforseo: "Real CPC + competition index",
    firstPartyGood: false,
  },
  {
    field: "Competitor keywords",
    firstParty: "Your own site only (via GSC)",
    dataforseo: "Any competitor domain's ranking keywords",
    firstPartyGood: false,
  },
  {
    field: "SERP results & features",
    firstParty: "Not available (no SERP scraping)",
    dataforseo: "Full top-100 results + SERP features",
    firstPartyGood: false,
  },
  {
    field: "Data accuracy (your site)",
    firstParty: "Ground truth — your real Search Console numbers",
    dataforseo: "Estimated / modelled",
    firstPartyGood: true,
  },
  {
    field: "Recurring cost",
    firstParty: "$0 (free Google sources)",
    dataforseo: "Paid per request / subscription",
    firstPartyGood: true,
  },
  {
    field: "Data ownership & privacy",
    firstParty: "100% yours; nothing sent to a third party",
    dataforseo: "Queries sent to the vendor",
    firstPartyGood: true,
  },
]

const FREE_METHODS: { source: string; gives: string; example: string }[] = [
  {
    source: "Google Search Console",
    gives: "Real impressions, clicks & average position — but only for keywords the site already appears for.",
    example: "“upsc preparation” → 4 impressions · avg position 8.3",
  },
  {
    source: "Google Autocomplete",
    gives: "New keyword ideas and the exact questions people type.",
    example: "→ “upsc preparation timetable”, “how to start upsc preparation?”",
  },
  {
    source: "Google Trends",
    gives: "Relative demand (a 0–100 index) and its trend direction.",
    example: "Demand index 78/100 · trend +24%",
  },
  {
    source: "Rules engine (ours)",
    gives: "Search intent, opportunity and relevance — all computed and explainable.",
    example: "Intent: informational · Opportunity 96/100",
  },
]

const LIMITS: { cant: string; want: string; why: string }[] = [
  {
    cant: "Absolute search volume",
    want: "“40,500 searches / month”",
    why: "Google does not publish exact volumes. That number comes from Google Ads clickstream data, which paid tools (DataForSEO, Ahrefs, Semrush) license and resell. Search Console only shows impressions for keywords we already rank for — nothing for brand-new topics — and Trends gives a relative 0–100, not a real number.",
  },
  {
    cant: "Real keyword difficulty (KD)",
    want: "“KD 42, based on who actually ranks”",
    why: "True difficulty needs a backlink index plus the actual SERP results (who ranks and how strong they are). Both are paid datasets. We currently estimate KD from keyword length as a labelled placeholder.",
  },
  {
    cant: "Competitor keywords",
    want: "“What does byjus.com rank for?”",
    why: "We can only read our own Search Console. To see another domain’s keywords you need either their GSC (we have no access) or a paid clickstream / SERP database.",
  },
  {
    cant: "SERP results & features",
    want: "“Who’s in the top 10? Is there a featured snippet?”",
    why: "This requires scraping Google’s results page at scale — which violates Google’s terms and gets our server IP blocked. Paid providers run large proxy networks specifically to do this.",
  },
  {
    cant: "CPC / ad competition",
    want: "“$2.30 CPC”",
    why: "Comes from Google Ads data — paid only.",
  },
]

// ---------------------------------------------------------------------------
// UI
// ---------------------------------------------------------------------------

function KeyChip({ k }: { k: Key }) {
  if (k === "pk")
    return (
      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
        PK
      </span>
    )
  if (k === "fk")
    return (
      <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-400">
        FK
      </span>
    )
  return null
}

function EntityCard({ e }: { e: Entity }) {
  const accent = e.group === "keyword" ? "before:bg-violet-500" : "before:bg-slate-400"
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-border bg-card shadow-sm",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        accent,
      )}
    >
      <div className="border-b border-border px-4 py-2.5 pl-5">
        <div className="flex items-center gap-2">
          {e.group === "keyword" ? (
            <KeyRound className="size-4 text-violet-500" />
          ) : (
            <Link2 className="size-4 text-slate-400" />
          )}
          <h3 className="font-mono text-sm font-semibold">{e.name}</h3>
        </div>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{e.note}</p>
      </div>
      <ul className="divide-y divide-border/60">
        {e.columns.map((c) => (
          <li key={c.name} className="flex items-center gap-2 px-4 py-1.5 pl-5 text-sm">
            <span className={cn("font-mono", c.key === "pk" && "font-semibold")}>{c.name}</span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">{c.type}</span>
            <KeyChip k={c.key ?? null} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function SchemaPage() {
  const master = ENTITIES.filter((e) => e.group === "master")
  const keyword = ENTITIES.filter((e) => e.group === "keyword")

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/dashboard/keyword-analysis"
        className="mb-6 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div>
        {/* Hero */}
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Documentation</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Database Schema</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            The full keyword-research data model and how the tables relate. Keyword
            tables are highlighted; supporting master tables are shown for context.
          </p>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-violet-500" /> Keyword research
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-slate-400" /> Master / supporting
            </span>
            <span className="flex items-center gap-1.5">
              <KeyChip k="pk" /> Primary key
            </span>
            <span className="flex items-center gap-1.5">
              <KeyChip k="fk" /> Foreign key
            </span>
          </div>
        </div>

        {/* Schema flow */}
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-semibold">Schema flow</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted-foreground">
            Tables flow left → right, from accounts to keyword data. Each arrow points from a
            foreign key to the row it references. Hover any table to highlight its links and
            see what it&apos;s for with an example row.
          </p>
          <SchemaFlow nodes={FLOW_NODES} relations={RELATIONS} />
        </section>

        {/* Keyword tables (highlighted) */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <KeyRound className="size-5 text-violet-500" /> Keyword research tables
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {keyword.map((e) => (
              <EntityCard key={e.name} e={e} />
            ))}
          </div>
        </section>

        {/* Master tables */}
        <section className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Link2 className="size-5 text-slate-400" /> Master / supporting tables
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {master.map((e) => (
              <EntityCard key={e.name} e={e} />
            ))}
          </div>
        </section>

        {/* How it works & why the limits */}
        <section className="mb-12">
          <h2 className="text-lg font-semibold">
            How keyword research works — and why some data isn&apos;t available
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            The system runs entirely on <strong className="font-medium text-foreground">free, first-party Google
            sources</strong> — no paid subscription. Here is exactly what that gives us, and what it
            can&apos;t, using the keyword <span className="font-mono text-foreground">“upsc preparation”</span> as a
            running example.
          </p>

          {/* What we use */}
          <h3 className="mt-6 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" /> What we use — and the data we get
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {FREE_METHODS.map((m) => (
              <div key={m.source} className="rounded-xl border border-border bg-card p-4">
                <p className="text-sm font-semibold">{m.source}</p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{m.gives}</p>
                <p className="mt-2 rounded-lg bg-muted/50 px-2.5 py-1.5 font-mono text-xs text-foreground">
                  {m.example}
                </p>
              </div>
            ))}
          </div>

          {/* What we can't get */}
          <h3 className="mt-8 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
            <Minus className="size-4" /> What we can&apos;t get — and why
          </h3>
          <div className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {LIMITS.map((l) => (
              <div key={l.cant} className="grid grid-cols-1 gap-1 px-4 py-3.5 sm:grid-cols-[minmax(0,220px)_1fr] sm:gap-4">
                <div>
                  <p className="text-sm font-semibold">{l.cant}</p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{l.want}</p>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">{l.why}</p>
              </div>
            ))}
          </div>

          {/* One-line reason callout */}
          <blockquote className="mt-6 rounded-r-xl border-l-4 border-primary bg-primary/5 px-5 py-4">
            <p className="text-sm font-medium leading-relaxed text-foreground">
              Google gives away our <em>own</em> site&apos;s data (Search Console) and <em>relative</em> signals
              (Trends, Autocomplete) for free. Everything about <em>other</em> sites, <em>absolute</em> search
              volumes, and <em>full SERP</em> results is sold, not given — that licensed data is exactly the
              product DataForSEO, Ahrefs, and Semrush charge for.
            </p>
          </blockquote>
        </section>

        {/* First-party vs DataForSEO */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold">What the current Keyword Research gives — vs a paid provider</h2>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            The system runs entirely on free first-party sources (Google Search Console,
            Google Autocomplete, Google Trends). Here is exactly what that produces today,
            and what a paid provider like DataForSEO would add.
          </p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-left">
                  <th className="px-4 py-3 font-semibold">Data point</th>
                  <th className="px-4 py-3 font-semibold">Current — first-party (free)</th>
                  <th className="px-4 py-3 font-semibold">With DataForSEO (paid)</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((r) => (
                  <tr key={r.field} className="border-t border-border align-top">
                    <td className="px-4 py-3 font-medium">{r.field}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {r.firstPartyGood ? (
                          <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Minus className="mt-0.5 size-4 shrink-0 text-amber-500" />
                        )}
                        <span className="text-muted-foreground">{r.firstParty}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {r.firstPartyGood ? (
                          <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        ) : (
                          <Check className="mt-0.5 size-4 shrink-0 text-sky-500" />
                        )}
                        <span className="text-muted-foreground">{r.dataforseo}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sample current output */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold">Sample of current output</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A real run for seed “upsc pyqs” produced 252 keywords. Each keyword gets a daily metric snapshot like this:
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Keyword</th>
                  <th className="px-4 py-2 text-right font-medium">Impr. (volume)</th>
                  <th className="px-4 py-2 text-right font-medium">Position</th>
                  <th className="px-4 py-2 text-right font-medium">KD*</th>
                  <th className="px-4 py-2 text-right font-medium">Opportunity</th>
                  <th className="px-4 py-2 text-left font-medium">Intent</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {[
                  { k: "upsc pyqs", i: 4, p: "8.3", kd: 15, o: "14.9", intent: "unknown" },
                  { k: "an aspirant", i: 6, p: "49.7", kd: 58, o: "5.3", intent: "unknown" },
                  { k: "28th wii society meeting", i: 1, p: "5.0", kd: 34, o: "5.0", intent: "unknown" },
                ].map((r) => (
                  <tr key={r.k} className="border-t border-border">
                    <td className="px-4 py-2">{r.k}</td>
                    <td className="px-4 py-2 text-right">{r.i}</td>
                    <td className="px-4 py-2 text-right">{r.p}</td>
                    <td className="px-4 py-2 text-right">{r.kd}</td>
                    <td className="px-4 py-2 text-right">{r.o}</td>
                    <td className="px-4 py-2">{r.intent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            * KD is currently a word-count estimate. “Volume” is Search Console impressions,
            so it is only non-zero for keywords the site already appears for — which is why a
            paid provider is the only way to get absolute volume for brand-new topics.
          </p>
        </section>

      </div>
    </main>
  )
}
