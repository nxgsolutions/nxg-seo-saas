"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { usePageAuditScreen } from "../_hooks/use-page-audit-screen"
import { TagItem } from "./tag-item"

type Props = Pick<ReturnType<typeof usePageAuditScreen>, "result">

export function AuditMetadata({ result }: Props) {
  if (!result) return null
  return (<Card>
    <CardHeader>
      <CardTitle className="text-base">Tags &amp; metadata</CardTitle>
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 [&>div]:border-b [&>div]:border-border">
      <TagItem label="Device" value={(result.metrics.device ?? "desktop") as string} />
      <TagItem label="Language" value={result.metrics.lang || undefined} />
      <TagItem label="Title" value={result.metrics.title} />
      <TagItem label="Meta description" value={result.metrics.description} />
      <TagItem label="Canonical URL" value={result.metrics.canonical_url || undefined} />
      <TagItem label="Charset" value={result.metrics.charset || undefined} />
      <TagItem label="H2 headings" value={`${result.metrics.h2_count ?? 0}`} />
      <TagItem label="hreflang tags" value={`${result.metrics.hreflang_count ?? 0}`} />
      <TagItem label="Open Graph title" present={!!result.metrics.og_title} />
      <TagItem label="Open Graph image" present={!!result.metrics.og_image} />
      <TagItem label="Twitter card" present={!!result.metrics.has_twitter_card} />
      <TagItem label="Structured data (JSON-LD)" present={!!result.metrics.has_structured_data} />
      <TagItem label="Favicon" present={!!result.metrics.has_favicon} />
      <TagItem label="Canonical link" present={!!result.metrics.has_canonical} />
    </CardContent>
  </Card>)
}
