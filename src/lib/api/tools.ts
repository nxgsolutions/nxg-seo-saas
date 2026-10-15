/** SEO tools API. Mirrors the FastAPI /api/tools routes. */
import { apiClient } from "./client"

export type CheckStatus = "pass" | "warn" | "fail"

export interface AuditCheck {
  id: string
  label: string
  status: CheckStatus
  detail: string
}

export interface AuditMetrics {
  findings?: { id: string; label: string; priority: string; evidence: string; fix: string }[]
  image_details?: { position: number; src: string; alt: string | null; width: string; height: string; loading: string; fixes: string[] }[]
  image_details_truncated?: boolean
  heading_outline?: { level: number; text: string }[]
  page_type?: string
  audit_scope?: string
  title: string
  title_length: number
  description: string
  description_length: number
  h1_count: number
  h1_text: string
  heading_count: number
  images_total: number
  images_missing_alt: number
  internal_links: number
  external_links: number
  word_count: number
  has_canonical: boolean
  has_viewport: boolean
  lang: string
  is_https: boolean
  // Richer tag/metadata analysis (present on newer audits)
  device?: string
  canonical_url?: string
  og_title?: string
  og_image?: string
  og_description?: string
  has_twitter_card?: boolean
  has_structured_data?: boolean
  charset?: string
  has_favicon?: boolean
  hreflang_count?: number
  h2_count?: number
}

export interface AuditResult {
  url: string
  final_url: string
  status_code: number
  load_time_ms: number
  page_size_bytes: number
  score: number
  checks: AuditCheck[]
  metrics: AuditMetrics
}

export interface RobotsInfo {
  found: boolean
  status_code: number
  sitemaps: string[]
  disallow_count: number
  allow_count: number
  blocks_all: boolean
  restricts_star: boolean
}

export interface SitemapInfo {
  url: string
  status_code: number
  found: boolean
  type: string | null
  url_count: number
  declared_in_robots: boolean
}

export interface RobotsCheckResult {
  url: string
  origin: string
  robots: RobotsInfo
  sitemap: SitemapInfo
  checks: AuditCheck[]
}

export interface Phrase {
  phrase: string
  count: number
  density: number
}

export interface KeywordPresence {
  term: string
  in_title: boolean
  in_h1: boolean
  in_meta_description: boolean
  occurrences: number
  density: number
  score: number
}

export interface KeywordAnalysis {
  url: string
  word_count: number
  unigrams: Phrase[]
  bigrams: Phrase[]
  trigrams: Phrase[]
  target: KeywordPresence | null
}

export interface PsiLabMetric {
  display: string | null
  score: number | null
  value: number | null
}

export interface PsiFieldMetric {
  percentile: number | null
  category: string | null // FAST | AVERAGE | SLOW
}

export interface PsiResult {
  url: string
  strategy: string
  performance_score: number | null
  lab: {
    lcp: PsiLabMetric
    cls: PsiLabMetric
    tbt: PsiLabMetric
    fcp: PsiLabMetric
    si: PsiLabMetric
    tti: PsiLabMetric
  }
  field: {
    overall: string | null
    lcp: PsiFieldMetric | null
    cls: PsiFieldMetric | null
    inp: PsiFieldMetric | null
    fcp: PsiFieldMetric | null
  } | null
}

export const toolsApi = {
  pageAudit: (url: string) =>
    apiClient.post<AuditResult>("/api/tools/page-audit", { url }),

  robotsCheck: (url: string) =>
    apiClient.post<RobotsCheckResult>("/api/tools/robots-check", { url }),

  keywordAnalysis: (url: string, term?: string) =>
    apiClient.post<KeywordAnalysis>("/api/tools/keyword-analysis", {
      url,
      term: term || null,
    }),

  pageSpeed: (url: string, strategy: "mobile" | "desktop" = "mobile") =>
    apiClient.post<PsiResult>("/api/tools/pagespeed", { url, strategy }),

  metaSuggest: (input: string) =>
    apiClient.post<{ is_sample: boolean; title: string; description: string }>(
      "/api/tools/meta-suggest",
      { input }
    ),
}
