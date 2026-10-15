/**
 * Shared marketing content reused across the home, feature and solution pages.
 * Factual product statements only — no invented metrics or customers.
 */
import { FileText, LineChart, LinkIcon, Search } from "lucide-react"

import type { Step } from "@/components/marketing/steps"

export const workflowSteps: Step[] = [
  { icon: LinkIcon, title: "Connect", body: "Link Google Search Console and add the domains you want to grow. Setup takes minutes." },
  { icon: Search, title: "Research", body: "Surface keywords from your own data, Google Autocomplete and the live SERP — scored for opportunity." },
  { icon: FileText, title: "Optimize", body: "Get prioritized, page-level guidance for the terms most likely to move traffic." },
  { icon: LineChart, title: "Track", body: "Watch positions and clicks change — and see exactly which keywords caused it." },
]

export const heroHighlights = ["Free plan available", "No per-keyword fees", "Built on Search Console"]

/** Which product pages to cross-link from each solution page. */
export const solutionTools: Record<string, string[]> = {
  agencies: ["/rank-tracker", "/keyword-research", "/seo-audit"],
  enterprise: ["/seo-audit", "/rank-tracker", "/competitor-analysis"],
  "seo-teams": ["/keyword-research", "/rank-tracker", "/seo-audit"],
  "content-teams": ["/content-optimizer", "/serp-analysis", "/keyword-research"],
  ecommerce: ["/keyword-research", "/rank-tracker", "/content-optimizer"],
  startups: ["/keyword-research", "/content-optimizer", "/rank-tracker"],
}
