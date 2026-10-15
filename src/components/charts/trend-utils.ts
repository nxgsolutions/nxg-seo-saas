/** Pure helpers for the score-trend chart (no Recharts import, so importing
 *  these does not pull the charting bundle into a page). */

export interface TrendPoint {
  /** epoch ms, for ordering */
  t: number
  /** short axis label, e.g. "14:05" or "Sep 2" */
  label: string
  score: number
  url: string
}

interface AuditLike {
  url: string
  score: number
  created_at: string
}

/** Convert audit history (newest-first) into chronological trend points. */
export function toTrendPoints(audits: AuditLike[]): TrendPoint[] {
  const dayMs = 24 * 60 * 60 * 1000
  const now = Date.now()
  return [...audits]
    .map((a) => ({ ...a, t: new Date(a.created_at).getTime() }))
    .sort((a, b) => a.t - b.t)
    .map((a) => ({
      t: a.t,
      score: a.score,
      url: a.url,
      label:
        now - a.t < dayMs
          ? new Date(a.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : new Date(a.t).toLocaleDateString([], { month: "short", day: "numeric" }),
    }))
}

/** Powers of ten covering [min, max] — explicit log-axis ticks. Recharts' automatic
 * log ticks can repeat a value at the same spot (duplicate React keys "tick-10-40-…"). */
export function logTicks(min: number, max: number): number[] {
  const out: number[] = []
  for (let t = min; t < max * 10 && out.length < 10; t *= 10) { out.push(t); if (t >= max) break }
  return out
}
