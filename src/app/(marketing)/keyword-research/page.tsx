import type { Metadata } from "next"

import { featurePages } from "@/config/feature-pages"
import { createMetadata } from "@/config/seo"
import { FeaturePageTemplate } from "@/components/marketing/feature-page-template"

const data = featurePages["keyword-research"]

export const metadata: Metadata = createMetadata({
  title: data.metaTitle,
  description: data.metaDescription,
  path: `/${data.slug}`,
})

export default function Page() {
  return <FeaturePageTemplate data={data} />
}
