export type ImpactFilter = "all" | "high" | "medium" | "low"

export function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-500"
  if (score >= 50) return "text-amber-500"
  return "text-destructive"
}

export function impactStyle(impact: string): string {
  if (impact === "high") return "bg-destructive/10 text-destructive"
  if (impact === "medium") return "bg-amber-500/12 text-amber-600 dark:text-amber-400"
  return "bg-sky-500/12 text-sky-600 dark:text-sky-400"
}

export function effortLabel(effort: string): string {
  if (effort === "quick") return "Quick win"
  if (effort === "moderate") return "Moderate"
  return "Bigger effort"
}
