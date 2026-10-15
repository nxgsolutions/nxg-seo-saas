export function scoreColor(score: number): string {
  if (score >= 70) return "text-emerald-500"
  if (score >= 40) return "text-amber-500"
  return "text-destructive"
}

export function priorityBadge(p: string): string {
  if (p === "high") return "bg-destructive/10 text-destructive"
  if (p === "medium") return "bg-amber-500/12 text-amber-600 dark:text-amber-400"
  return "bg-muted text-muted-foreground"
}

export function oppColor(o: string): string {
  if (o === "high") return "text-emerald-600 dark:text-emerald-400"
  if (o === "medium") return "text-amber-600 dark:text-amber-400"
  return "text-muted-foreground"
}
