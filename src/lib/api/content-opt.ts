/**
 * Content Optimization API (workspace-scoped, private).
 *
 * A run scores a page for a target keyword with fixed rules (same page = same
 * score), compares it with the pages ranking for that keyword (stored Google
 * results — never a paid call — and/or URLs you type) and adds AI writing
 * suggestions (OpenAI). Every run is saved as a session.
 */
import { apiClient } from "./client"
import { listParams, type ListParams, type Paged } from "./pagination"

export type CheckStatus = "pass" | "warn" | "fail"

export interface ContentCheck {
  id: string
  group: string
  label: string
  status: CheckStatus
  weight: number
  value: string
  tip: string
}

export interface PageFacts {
  title: string
  meta: string
  h1: string[]
  headings: { level: number; text: string }[]
  word_count: number
  paragraphs: number
  avg_paragraph_words: number | null
  lists: number
  images: number
  images_missing_alt: number
  internal_links: number
  external_links: number
  reading_ease: number | null
  has_schema: boolean
}

export interface CompetitorPage {
  position: number | null
  url: string
  host: string
  title: string
  word_count: number | null
  headings: number | null
  top_headings: string[]
  reading_ease: number | null
  images: number | null
  keyword_in_title: boolean | null
  keyword_in_h1: boolean | null
  error: string | null
}

export interface Benchmark {
  pages: number
  word_count: number | null
  headings: number | null
  reading_ease: number | null
  images: number | null
  /** Older runs: missing. */
  internal_links?: number | null
  h2?: number | null
  keyword_in_title: number
}

export interface TermRow {
  term: string
  competitors: number
  avg_count: number
  your_count: number
  status: "missing" | "low" | "ok"
}

export interface OptSuggestion {
  area: string
  recommendation: string
  /** Ready-to-use text to apply (e.g. a rewritten meta description); null when the action isn't a text change. */
  suggestion?: string | null
  priority: "high" | "medium" | "low" | string
}

export interface OutlineItem {
  heading: string
  level: number
  note: string
  is_new: boolean
}

export interface AiWriting {
  title_options: string[]
  meta_options: string[]
  outline: OutlineItem[]
  intro: string
  recommendations: OptSuggestion[]
}

export interface ContentOptResult {
  /** 2 = checklist + comparison + AI writing; 1 = older AI-only runs. */
  version: number
  content_score: number
  summary: string
  summary_source: "rules" | "ai"
  keyword: string | null
  country: string | null
  page: PageFacts | null
  checks: ContentCheck[]
  competitor_source: "serp" | "manual" | "serp+manual" | "none"
  serp_captured_at: string | null
  competitors: CompetitorPage[]
  /** Typed competitor URLs left out because they're on your own website (older runs: missing). */
  skipped_competitors?: string[]
  benchmark: Benchmark | null
  terms: TermRow[]
  ai: AiWriting | null
  ai_error: string | null
  // Version 1 fields (older sessions).
  suggestions: OptSuggestion[]
  target_keywords: string[]
  outline: string[]
  rewritten_intro: string
}

export interface ScorePoint {
  id: string
  content_score: number | null
  created_at: string
}

export interface ContentOptSessionSummary {
  id: string
  url: string
  title: string
  keyword: string | null
  model_used: string
  content_score: number | null
  created_at: string
}

export interface ContentOptSession extends ContentOptSessionSummary {
  result: ContentOptResult
  /** Runs for the same page + keyword, oldest → newest (this one last). */
  history: ScorePoint[]
}

export interface ContentOptRunInput {
  url: string
  keyword?: string | null
  country?: string
  domain_id?: string | null
  competitor_urls?: string[]
  use_ai?: boolean
}

export interface KeywordOption {
  keyword: string
  /** page = this URL already ranks for it · tracked · site = a website keyword */
  source: "page" | "tracked" | "site"
  search_volume: number | null
  position: number | null
  /** Google results are stored → free competitor comparison. */
  has_serp: boolean
}

export interface KeywordOptions {
  keywords: KeywordOption[]
  ai_available: boolean
}

const base = (wid: string) => `/api/workspaces/${wid}/content-optimization`

export const contentOptApi = {
  run: (wid: string, input: ContentOptRunInput) =>
    apiClient.post<ContentOptSession>(`${base(wid)}/run`, input),

  sessions: (wid: string, p: ListParams = {}) =>
    apiClient.get<Paged<ContentOptSessionSummary>>(`${base(wid)}/sessions`, { params: listParams(p) }),

  session: (wid: string, id: string) =>
    apiClient.get<ContentOptSession>(`${base(wid)}/sessions/${id}`),

  keywordOptions: (wid: string, params: { domain_id: string; url?: string; country?: string }) =>
    apiClient.get<KeywordOptions>(`${base(wid)}/keyword-options`, { params }),
}
