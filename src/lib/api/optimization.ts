/** Page Optimization API — prioritized fix plan from a page audit. */
import { apiClient } from "./client"

export interface OptimizationItem {
  id: string
  category: string
  title: string
  impact: string // high | medium | low
  effort: string // quick | moderate | high
  current: string
  fix: string
  severity: string // warn | fail
}

export interface OptimizationWin {
  id: string
  title: string
  category: string
}

export interface OptimizationSummary {
  high: number
  medium: number
  low: number
  total_issues: number
  passed: number
}

export interface OptimizeResult {
  url: string
  final_url: string
  score: number
  device: string
  summary: OptimizationSummary
  recommendations: OptimizationItem[]
  wins: OptimizationWin[]
}

export const optimizationApi = {
  optimize: (url: string, device: "desktop" | "mobile" = "desktop") =>
    apiClient.post<OptimizeResult>("/api/tools/optimize", { url, device }),
}
