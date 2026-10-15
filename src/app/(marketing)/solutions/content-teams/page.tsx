import type { Metadata } from "next"

import { solutionPages } from "@/config/solutions"
import { createMetadata } from "@/config/seo"
import { SolutionPageTemplate } from "@/components/marketing/solution-page-template"

const data = solutionPages["content-teams"]

export const metadata: Metadata = createMetadata({
  title: data.metaTitle,
  description: data.metaDescription,
  path: `/solutions/${data.slug}`,
})

export default function Page() {
  return <SolutionPageTemplate data={data} />
}
