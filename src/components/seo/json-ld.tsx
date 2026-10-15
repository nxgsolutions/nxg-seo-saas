/**
 * Renders JSON-LD structured data. Only add schema a page genuinely qualifies
 * for (Organization, SoftwareApplication, FAQPage, BreadcrumbList, Article).
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      // Data is app-authored (not user input); safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
