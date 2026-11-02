import { FileText, Globe, Image as ImageIcon, Link2, Play, Search, Sparkles, Star, Swords, TrendingUp } from "lucide-react"

export const FEATURE_ICON: Record<string, typeof Link2> = {
  sitelinks: Link2,
  reviews: Star,
  image: ImageIcon,
  snippet: FileText,
  video: Play,
}

export const INTENTS = [
  "all",
  "informational",
  "commercial",
  "transactional",
  "navigational",
]

export const VOLUME_OPTS = [
  { value: "0", label: "Any volume" },
  { value: "10000", label: "10K+" },
  { value: "50000", label: "50K+" },
  { value: "100000", label: "100K+" },
  { value: "200000", label: "200K+" },
]

export const METRICS = [
  { key: "search_volume", label: "Search Volume" },
  { key: "organic_traffic", label: "Organic Traffic" },
  { key: "ranking_keywords", label: "Ranking Keywords" },
  { key: "serp_opportunities", label: "SERP Opportunities" },
] as const

export const TABS = [
  { key: "action", label: "Opportunity Research" },
  { key: "keywords", label: "Opportunity Keywords" },
  { key: "quickwins", label: "Quick Wins (#4–20)" },
] as const

export const PAGE_SIZE = 8

/** Where each action-plan keyword came from. The engine tags every item with a
 *  stable `source_key`; this maps it to a plain-language label (no vendor/tool
 *  names — see the no-developer-text-in-UI rule), an icon and a tone. */
export type SourceKey = "gsc" | "own_rank" | "competitor_rank" | "serp_gap" | "research"

export const SOURCE_META: Record<SourceKey, {
  label: string        // full, friendly name for badges/chips
  icon: typeof Search
  className: string     // chip/badge tone
  tip: string           // plain-language "what this source means"
  /** The list view this source belongs to — a source_key only ever appears in one. */
  view: "improve" | "gaps" | "targets"
}> = {
  gsc: {
    label: "Google Search Console", icon: Search, view: "improve",
    className: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    tip: "Keywords your site already gets impressions and clicks for on Google.",
  },
  own_rank: {
    label: "Your current rankings", icon: TrendingUp, view: "improve",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    tip: "Keywords your site already ranks for, with the page that ranks.",
  },
  competitor_rank: {
    label: "Competitors rank for this", icon: Swords, view: "gaps",
    className: "bg-primary/10 text-primary",
    tip: "A competitor ranks in Google's top 10 for this and your site doesn't.",
  },
  serp_gap: {
    label: "Seen in search results", icon: Globe, view: "gaps",
    className: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    tip: "Spotted in a saved snapshot of Google's results for your tracked keywords.",
  },
  research: {
    label: "Keyword research idea", icon: Sparkles, view: "targets",
    className: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
    tip: "A keyword-research suggestion with real demand that you aren't targeting yet.",
  },
}

/** Order the source chips appear in. */
export const SOURCE_ORDER: SourceKey[] = ["gsc", "own_rank", "competitor_rank", "serp_gap", "research"]

export function kdColor(kd: number) {
  return kd >= 55
    ? "text-red-500"
    : kd >= 40
      ? "text-amber-500"
      : "text-emerald-600"
}

export function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Opportunity-score band → label + colors for the score bar/badge. */
export function oppBand(score: number): {
  label: string
  bar: string
  chip: string
} {
  if (score >= 70)
    return {
      label: "High",
      bar: "bg-emerald-500",
      chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    }
  if (score >= 40)
    return {
      label: "Medium",
      bar: "bg-amber-500",
      chip: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    }
  return {
    label: "Low",
    bar: "bg-muted-foreground/50",
    chip: "bg-muted text-muted-foreground",
  }
}

/** KD band → pill colors. */
export function kdBand(kd: number): string {
  return kd >= 55
    ? "bg-red-500/10 text-red-600 dark:text-red-400"
    : kd >= 40
      ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
      : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
}

/** Current rank → short badge {label, tone}. */
export function positionBadge(pos: number | null): {
  label: string
  tone: string
} {
  if (pos == null)
    return { label: "Not ranking", tone: "bg-muted text-muted-foreground" }
  if (pos <= 3)
    return {
      label: `#${pos}`,
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    }
  if (pos <= 10)
    return {
      label: `#${pos}`,
      tone: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
    }
  if (pos <= 20)
    return {
      label: `#${pos}`,
      tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    }
  return { label: `#${pos}`, tone: "bg-muted text-muted-foreground" }
}

export function intentTone(intent: string): string {
  switch (intent) {
    case "transactional":
      return "bg-violet-500/10 text-violet-700 dark:text-violet-400"
    case "commercial":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400"
    case "navigational":
      return "bg-slate-500/10 text-slate-700 dark:text-slate-300"
    default:
      return "bg-teal-500/10 text-teal-700 dark:text-teal-400" // informational
  }
}

export const FEATURE_LABEL: Record<string, string> = {
  snippet: "Featured snippet",
  sitelinks: "Sitelinks",
  reviews: "Reviews",
  image: "Image pack",
  video: "Video",
}

/** Short, data-driven optimization points for one keyword (most important first). */
export function optimizationTips(r: {
  keyword: string
  search_volume: number
  yoy_change: number
  keyword_difficulty: number
  current_position: number | null
  intent: string
  opportunity_score: number
  page_url: string | null
  ranking_url: string | null
  serp_features: string[]
}): string[] {
  const tips: string[] = []
  const pos = r.current_position

  // Where it ranks now → the single biggest lever.
  if (pos == null)
    tips.push(
      "Not ranking yet — create a dedicated, in-depth page targeting this keyword.",
    )
  else if (pos <= 3)
    tips.push(
      `Already top 3 (#${pos}) — defend it: refresh content and keep internal links pointing here.`,
    )
  else if (pos <= 10)
    tips.push(
      `On page 1 (#${pos}) — small on-page tweaks (title, H1, intro) can push into the top 3.`,
    )
  else if (pos <= 20)
    tips.push(
      `Page 2 (#${pos}) — add depth and 3–5 internal links to break into page 1.`,
    )
  else
    tips.push(
      `Ranking low (#${pos}) — needs stronger content and more authority before it moves.`,
    )

  // Difficulty.
  if (r.keyword_difficulty >= 55)
    tips.push("High difficulty — win with topical depth and quality backlinks.")
  else if (r.keyword_difficulty < 40)
    tips.push("Low difficulty — realistic quick win; prioritize it.")

  // Demand & trend.
  if (r.search_volume >= 10000)
    tips.push(
      `High demand (${r.search_volume.toLocaleString()} searches/mo) — worth the effort.`,
    )
  if (r.yoy_change >= 20)
    tips.push(
      `Rising trend (+${r.yoy_change}% YoY) — act while momentum is building.`,
    )
  else if (r.yoy_change <= -20)
    tips.push(
      `Falling interest (${r.yoy_change}% YoY) — validate demand before investing.`,
    )

  // Intent → content format / CTA.
  if (r.intent === "transactional" || r.intent === "commercial")
    tips.push("Commercial intent — add clear CTAs, pricing or product details.")
  else if (r.intent === "informational")
    tips.push(
      "Informational intent — a comprehensive how-to / guide wins here.",
    )

  // SERP features to target.
  if (r.serp_features.includes("snippet"))
    tips.push(
      "Featured snippet shows — answer the query in a concise 40–55 word block or list.",
    )
  if (r.serp_features.includes("video"))
    tips.push(
      "Video results appear — embedding a short video can lift visibility.",
    )
  if (r.serp_features.includes("image"))
    tips.push(
      "Image pack present — add optimized images with descriptive alt text.",
    )
  if (r.serp_features.includes("reviews"))
    tips.push("Review stars show — add review / rating schema markup.")

  // Which page to work on.
  const url = r.page_url ?? r.ranking_url
  if (url)
    tips.push(
      `Optimize the page already associated: ${url.replace(/^https?:\/\//, "")}`,
    )

  return tips.slice(0, 6)
}
