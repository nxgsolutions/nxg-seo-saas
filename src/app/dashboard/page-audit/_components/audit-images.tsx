"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { usePageAuditScreen } from "../_hooks/use-page-audit-screen"

type Props = Pick<ReturnType<typeof usePageAuditScreen>, "result">

export function AuditImages({ result }: Props) {
  if (!result?.metrics.image_details) return null
  return (<Card>
    <CardHeader>
      <CardTitle>Image review · {result.metrics.images_total} images</CardTitle>
      <CardDescription>Source attributes and conditional recommendations. Image file sizes and actual rendered dimensions have not been measured.</CardDescription>
    </CardHeader>
    <CardContent className="flex flex-col gap-4">
      {!result.metrics.image_details.length ? <p>No img elements found in the source HTML.</p> : null}
      {result.metrics.image_details_truncated ? <p>Showing the first 200 images.</p> : null}
      {result.metrics.image_details.map((img) => (
        <details key={img.position} className="rounded-lg border p-3 text-sm">
          <summary className="cursor-pointer break-all font-medium">Image {img.position} · {img.fixes.length} review items · {img.src || "Missing source"}</summary>
          <div className="mt-3 flex flex-col gap-2">
            <p className="break-words">Alt: {img.alt === null ? "Missing attribute" : img.alt || 'Empty (decorative)'} · Dimensions: {img.width || "unset"} × {img.height || "unset"} · Loading: {img.loading}</p>
            {img.fixes.length ? <ul className="ml-5 list-disc">{img.fixes.map((fix) => <li key={fix}>{fix}</li>)}</ul> : <p>No source attribute issues detected.</p>}
          </div>
        </details>
      ))}
    </CardContent>
  </Card>)
}
