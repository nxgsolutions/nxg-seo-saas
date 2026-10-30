/** Shared colour/verdict helpers for the Overall Page Score view. */

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

/** Progress-bar fill colour (solid), matched to the score band. */
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

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "")
  } catch {
    return ""
  }
}
