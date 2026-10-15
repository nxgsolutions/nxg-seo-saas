/** Page-type labels, colors and small formatters for Page Discovery. */

export interface TypeMeta {
  label: string
  color: string
}

/** Stable label + donut color per page type (order = legend/donut order). */
export const TYPE_META: Record<string, TypeMeta> = {
  content: { label: "Content pages", color: "var(--chart-1)" },
  blog: { label: "Blog posts", color: "var(--chart-2)" },
  category: { label: "Category pages", color: "var(--chart-3)" },
  tag: { label: "Tag pages", color: "var(--chart-4)" },
  home: { label: "Home", color: "var(--chart-5)" },
  other: { label: "Other pages", color: "var(--muted-foreground)" },
}

export const TYPE_ORDER = ["content", "blog", "category", "tag", "home", "other"] as const

export function typeMeta(type: string): TypeMeta {
  return TYPE_META[type] ?? { label: type, color: "var(--muted-foreground)" }
}

/** Filter options for the "All types" Select (built from the known types). */
export const TYPE_FILTERS = [
  { value: "all", label: "All types" },
  ...TYPE_ORDER.map((t) => ({ value: t, label: TYPE_META[t].label })),
]

export const STATUS_FILTERS = [
  { value: "all", label: "All status" },
  { value: "ok", label: "OK (200)" },
  { value: "error", label: "Errors (4xx/5xx)" },
]

export const INDEXABLE_FILTERS = [
  { value: "all", label: "Indexable: any" },
  { value: "yes", label: "Indexable" },
  { value: "no", label: "Noindex" },
]

/** How the discovered-pages list is ordered. "priority" groups the most
 * important pages first (home → content → blog → …) and sinks dynamic pages. */
export const SORT_OPTIONS = [
  { value: "priority", label: "Sort: Priority" },
  { value: "score", label: "Best score" },
  { value: "words", label: "Most words" },
  { value: "discovered", label: "Recently found" },
  { value: "lastmod", label: "Recently updated" },
  { value: "title", label: "Title A–Z" },
]

/** Ascending only for A–Z; everything else is descending (best/most/newest first). */
export function sortOrder(sort: string): "asc" | "desc" {
  return sort === "title" ? "asc" : "desc"
}

/** "Oct 1, 2026" or "—". */
export function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}
