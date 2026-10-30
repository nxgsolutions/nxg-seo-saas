/** Shared colour/label helpers for the whole-site (domain) score view. */

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500"
  if (score >= 50) return "text-amber-500"
  return "text-destructive"
}

export function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  if (score >= 50) return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return "bg-destructive/10 text-destructive"
}

export function scoreBar(score: number): string {
  if (score >= 80) return "bg-emerald-500"
  if (score >= 50) return "bg-amber-500"
  return "bg-destructive"
}

export function band(score: number): { label: string; cls: string } {
  if (score >= 80) return { label: "Good", cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" }
  if (score >= 50) return { label: "Needs work", cls: "bg-amber-500/12 text-amber-700 dark:text-amber-400" }
  return { label: "Poor", cls: "bg-destructive/10 text-destructive" }
}

/** Backend category ids → friendly labels, in display order. */
export const CATEGORY_ORDER = ["technical", "onpage", "content", "performance", "links_images", "structured"] as const
export const CATEGORY_LABELS: Record<string, string> = {
  technical: "Technical SEO",
  onpage: "On-page SEO",
  content: "Content quality",
  performance: "Performance & mobile",
  links_images: "Links & images",
  structured: "Structured data",
}

export function pageTypeLabel(t: string): string {
  const map: Record<string, string> = { home: "Home", blog: "Blog", content: "Content", category: "Category", tag: "Tag", other: "Page" }
  return map[t] ?? "Page"
}
