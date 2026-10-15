export type Device = "desktop" | "mobile"

export const LIMITS = {
  desktop: { titlePx: 600, descChars: 160 },
  mobile: { titlePx: 460, descChars: 130 },
}

export function truncateToWidth(
  text: string,
  font: string,
  maxPx: number,
  measure: (t: string, f: string) => number
): { text: string; truncated: boolean } {
  if (measure(text, font) <= maxPx) return { text, truncated: false }
  let lo = 0
  let hi = text.length
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    if (measure(text.slice(0, mid) + "…", font) <= maxPx) lo = mid
    else hi = mid - 1
  }
  return { text: text.slice(0, lo).trimEnd() + "…", truncated: true }
}
