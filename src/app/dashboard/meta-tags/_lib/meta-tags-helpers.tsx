export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export interface Fields {
  title: string
  description: string
  url: string
  siteName: string
  image: string
  twitter: string
}

export function buildTags(f: Fields): string {
  const t = esc(f.title.trim())
  const d = esc(f.description.trim())
  const u = esc(f.url.trim())
  const site = esc(f.siteName.trim())
  const img = esc(f.image.trim())
  const handle = f.twitter.trim().replace(/^@?/, "@")

  const lines: string[] = []
  if (t) lines.push(`<title>${t}</title>`)
  if (d) lines.push(`<meta name="description" content="${d}" />`)
  if (u) lines.push(`<link rel="canonical" href="${u}" />`)

  lines.push("")
  lines.push("<!-- Open Graph / Facebook -->")
  lines.push(`<meta property="og:type" content="domain" />`)
  if (t) lines.push(`<meta property="og:title" content="${t}" />`)
  if (d) lines.push(`<meta property="og:description" content="${d}" />`)
  if (u) lines.push(`<meta property="og:url" content="${u}" />`)
  if (site) lines.push(`<meta property="og:site_name" content="${site}" />`)
  if (img) lines.push(`<meta property="og:image" content="${img}" />`)

  lines.push("")
  lines.push("<!-- Twitter -->")
  lines.push(`<meta name="twitter:card" content="summary_large_image" />`)
  if (handle.length > 1) lines.push(`<meta name="twitter:site" content="${esc(handle)}" />`)
  if (t) lines.push(`<meta name="twitter:title" content="${t}" />`)
  if (d) lines.push(`<meta name="twitter:description" content="${d}" />`)
  if (img) lines.push(`<meta name="twitter:image" content="${img}" />`)

  return lines.join("\n")
}
