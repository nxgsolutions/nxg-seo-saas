export function posColor(p: number) {
  return p <= 3 ? "text-emerald-600 dark:text-emerald-400"
    : p <= 10 ? "text-amber-500" : "text-muted-foreground"
}

export function compact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(Math.round(n))
}

export function rankColor(r: number | null) {
  if (r == null) return "text-muted-foreground"
  return r >= 60 ? "text-emerald-600 dark:text-emerald-400"
    : r >= 40 ? "text-amber-500" : "text-muted-foreground"
}

export function formatFetched(iso: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
}
