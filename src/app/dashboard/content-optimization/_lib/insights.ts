/**
 * Turns a saved run into what the result screen shows: per-category scores,
 * one prioritized recommendation list (rule checks + AI suggestions), and the
 * "top pages do better" comparison. Pure functions — no fetching.
 */
import type { ContentCheck, ContentOptResult } from "@/lib/api/content-opt"

const CREDIT = { pass: 1, warn: 0.5, fail: 0 } as const

/** Weighted 0-100 score of a set of checks (null when none apply). */
function scoreOf(checks: ContentCheck[]): number | null {
  const w = checks.reduce((a, c) => a + c.weight, 0)
  return w ? Math.round((checks.reduce((a, c) => a + c.weight * CREDIT[c.status], 0) / w) * 100) : null
}

export interface CategoryScore {
  key: string
  label: string
  score: number | null
  hint: string
}

/** The six areas of the "SEO score breakdown". */
export function categoryScores(r: ContentOptResult): CategoryScore[] {
  const by = (ids: string[]) => r.checks.filter((c) => ids.includes(c.id))
  const terms = r.terms.length ? Math.round((r.terms.filter((t) => t.status !== "missing").length / r.terms.length) * 100) : null
  const re = r.page?.reading_ease
  return [
    { key: "structure", label: "Content structure", score: scoreOf(by(["subheadings", "paragraphs", "lists", "h1_single", "words"])), hint: "Headings, paragraphs, lists and length" },
    { key: "keyword", label: "Keyword usage", score: r.keyword ? scoreOf(r.checks.filter((c) => c.group === "Keyword placement")) : null, hint: "Target keyword in title, H1, intro, meta, subheadings" },
    { key: "topics", label: "Topic coverage", score: terms, hint: "Terms most top-ranking pages use" },
    { key: "readability", label: "Readability", score: re == null ? null : Math.round(Math.max(0, Math.min(100, re))), hint: "Flesch reading ease (higher is easier)" },
    { key: "links", label: "Links & media", score: scoreOf(by(["internal_links", "external_links", "img_alt"])), hint: "Internal links, sources and image alt text" },
    { key: "meta", label: "Meta information", score: scoreOf(by(["title_len", "meta_len"])), hint: "Title and meta description" },
  ]
}

export type RecPriority = "high" | "opportunity" | "good"

export interface Recommendation {
  id: string
  priority: RecPriority
  title: string
  text: string
  /** Shown as "Current → Suggested" with a copy button. */
  current?: string | null
  suggested?: string | null
  source: "check" | "ai"
}

/** Action-style titles for failing / weak checks. */
const ACTION: Record<string, string> = {
  kw_title: "Add your target keyword to the title",
  kw_h1: "Use the keyword in your H1 heading",
  kw_intro: "Mention the keyword in the first paragraph",
  kw_meta: "Add the keyword to the meta description",
  kw_sub: "Use the keyword in a subheading",
  kw_url: "Put the keyword in the URL (new pages)",
  kw_density: "Adjust how often the keyword appears",
  title_len: "Fix the title length",
  meta_len: "Fix the meta description length",
  h1_single: "Use exactly one H1 heading",
  subheadings: "Add more subheadings",
  paragraphs: "Shorten long paragraphs",
  lists: "Add a bulleted or numbered list",
  words: "Expand your content",
  readability: "Make the text easier to read",
  terms: "Cover the topics top pages include",
  img_alt: "Add alt text to your images",
  internal_links: "Add internal links",
  external_links: "Cite a trustworthy source",
}

/** The topic area each rule check belongs to — used to drop AI recommendations
 *  that just restate a failing check. */
const CHECK_BUCKET: Record<string, string> = {
  kw_title: "title", title_len: "title",
  kw_meta: "meta", meta_len: "meta",
  kw_h1: "headings", h1_single: "headings", kw_sub: "headings", subheadings: "headings",
  kw_intro: "content", words: "content", terms: "content", lists: "content",
  kw_density: "keywords", kw_url: "keywords",
  paragraphs: "readability", readability: "readability",
  internal_links: "links", external_links: "links",
  img_alt: "media",
}
/** AI recommendation `area` → the same topic buckets as the rule checks. */
const AI_BUCKET: Record<string, string> = {
  title: "title", meta: "meta", headings: "headings", content: "content",
  keywords: "keywords", readability: "readability", links: "links", media: "media",
}

export function recommendations(r: ContentOptResult): Recommendation[] {
  const ai = r.ai
  const out: Recommendation[] = []
  for (const c of r.checks) {
    if (c.status === "pass") continue
    const rec: Recommendation = {
      id: c.id, priority: c.status === "fail" ? "high" : "opportunity", source: "check",
      title: ACTION[c.id] ?? c.label, text: [c.tip, c.value && `Now: ${c.value}.`].filter(Boolean).join(" "),
    }
    if ((c.id === "kw_title" || c.id === "title_len") && ai?.title_options[0]) {
      rec.current = r.page?.title || null
      rec.suggested = ai.title_options[0]
    } else if ((c.id === "kw_meta" || c.id === "meta_len") && ai?.meta_options[0]) {
      rec.current = r.page?.meta || null
      rec.suggested = ai.meta_options[0]
    } else if (c.id === "kw_intro" && ai?.intro) {
      rec.suggested = ai.intro
    }
    out.push(rec)
  }
  // Keep only one title / one meta suggestion card.
  const seen = new Set<string>()
  const deduped = out.filter((x) => {
    const k = x.suggested ? `s:${x.suggested}` : `i:${x.id}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
  // AI recommendations often restate the rule checks ("add an H1", "shorten the
  // title"). Add only the ones that bring something new: drop any AI rec whose
  // area a failing check already covers, and drop near-identical AI recs.
  const covered = new Set<string>()
  for (const x of deduped) {
    const b = CHECK_BUCKET[x.id]
    if (b) covered.add(b)
  }
  const aiSeen = new Set<string>()
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
  ai?.recommendations.forEach((a, i) => {
    const text = (a.recommendation || "").trim()
    const key = normalize(text)
    if (!key || aiSeen.has(key)) return
    aiSeen.add(key)
    const bucket = AI_BUCKET[(a.area || "").toLowerCase()]
    if (bucket && covered.has(bucket)) return
    deduped.push({
      id: `ai-${i}`, priority: a.priority === "high" ? "high" : "opportunity", source: "ai",
      title: text, text: "", suggested: a.suggestion || undefined,
    })
  })
  for (const c of r.checks) {
    if (c.status === "pass") deduped.push({ id: `ok-${c.id}`, priority: "good", source: "check", title: c.label, text: c.value })
  }
  const rank = { high: 0, opportunity: 1, good: 2 }
  return deduped.sort((a, b) => rank[a.priority] - rank[b.priority])
}

export function headline(score: number, open: number): { title: string; text: string } {
  const fix = open ? `Fix ${open} remaining recommendation${open === 1 ? "" : "s"} to improve it further.` : "Keep it up to date to stay ahead."
  if (score >= 80) return { title: "Your page is well optimized!", text: `You're close to an excellent score. ${fix}` }
  if (score >= 50) return { title: "Your page needs some work", text: `Good foundations, but important gaps remain. ${fix}` }
  return { title: "Your page needs significant improvement", text: `Start with the high-priority items below. ${fix}` }
}

export function barTone(score: number | null): string {
  if (score == null) return "bg-muted-foreground/30"
  if (score >= 80) return "bg-emerald-500"
  if (score >= 60) return "bg-primary"
  if (score >= 40) return "bg-amber-500"
  return "bg-destructive"
}
