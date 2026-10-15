export function scoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
  if (score >= 50) return "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return "bg-destructive/10 text-destructive"
}

export function auditHost(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "")
  } catch {
    return u.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  }
}
