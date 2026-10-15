export const LANGUAGES = [
  { label: "English", code: "en" },
  { label: "Hindi", code: "hi" },
  { label: "Spanish", code: "es" },
  { label: "French", code: "fr" },
  { label: "German", code: "de" },
]

export const LOCATIONS = [
  { label: "India", code: "in", cur: "₹" },
  { label: "United States", code: "us", cur: "$" },
  { label: "United Kingdom", code: "gb", cur: "£" },
  { label: "Canada", code: "ca", cur: "$" },
  { label: "Australia", code: "au", cur: "$" },
  { label: "Germany", code: "de", cur: "€" },
]

export const CATEGORY_LABELS: Record<string, string> = {
  autocomplete: "Autocomplete",
  related: "Related",
  questions: "Questions",
  prepositions: "Prepositions",
  comparisons: "Comparisons",
}

export const INTENT_STYLES: Record<string, string> = {
  informational: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  commercial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  transactional: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  navigational: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  unknown: "bg-muted text-muted-foreground",
}

export const INTENT_ABBR: Record<string, string> = {
  informational: "I", commercial: "C", transactional: "T", navigational: "N", unknown: "—",
}

export const INTENTS = ["all", "informational", "commercial", "transactional", "navigational"] as const

export function cur(code: string) { return LOCATIONS.find((l) => l.code === code)?.cur ?? "$" }

export function num(v: number | null | undefined) { return v == null ? "—" : v.toLocaleString() }

export function kd(v: number | null | undefined) { return v == null ? "—" : Math.round(v).toString() }

export function kdColor(v: number | null | undefined) {
  if (v == null) return "text-muted-foreground"
  if (v >= 60) return "text-red-500"
  if (v >= 40) return "text-amber-500"
  return "text-emerald-500"
}
