export function hostOf(u: string): string {
  try {
    return new URL(u).hostname.replace(/^www\./, "")
  } catch {
    return u.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]
  }
}
