/**
 * Query key factory — the single place cache keys are built.
 *
 * Every key that holds tenant data starts with ["ws", workspaceId] (and the
 * domain id when it's per website), so one workspace's cache can never be
 * served to another. Global, public data (keyword planner history) is keyed
 * without a workspace.
 */

const ws = (wid: string) => ["ws", wid] as const
const dom = (wid: string, did: string) => ["ws", wid, "domain", did] as const

export const queryKeys = {
  keywordSearch: {
    all: (wid: string) => [...ws(wid), "keyword-search"] as const,
    recent: (wid: string) => [...ws(wid), "keyword-search", "recent"] as const,
    detail: (wid: string, id: string) => [...ws(wid), "keyword-search", "detail", id] as const,
  },
  pageAudits: {
    list: (wid: string) => [...ws(wid), "page-audits"] as const,
    detail: (wid: string, id: string) => [...ws(wid), "page-audits", "detail", id] as const,
  },
  members: (wid: string) => [...ws(wid), "members"] as const,
  pages: {
    all: (wid: string) => [...ws(wid), "pages"] as const,
    list: (wid: string, domainId: string, page: number, q: string, sort: string) =>
      [...ws(wid), "pages", "list", domainId, page, q, sort] as const,
    timeline: (wid: string, pageId: string) => [...ws(wid), "pages", "timeline", pageId] as const,
    performance: (wid: string, pageId: string, days: number) => [...ws(wid), "pages", "performance", pageId, days] as const,
  },
  contentOpt: {
    all: (wid: string) => [...ws(wid), "content-optimization"] as const,
    sessions: (wid: string, page: number, q: string) => [...ws(wid), "content-optimization", "sessions", page, q] as const,
    session: (wid: string, id: string) => [...ws(wid), "content-optimization", "session", id] as const,
    keywordOptions: (wid: string, did: string, url: string) =>
      [...ws(wid), "content-optimization", "keyword-options", did, url] as const,
  },
  keywordBreakdown: (wid: string, keyword: string, country: string, language: string) =>
    [...ws(wid), "keyword-breakdown", country, language, keyword.toLowerCase()] as const,
  keywordPlannerHistory: (keyword: string, country: string, language: string) =>
    ["keyword-planner", "history", country, language, keyword.toLowerCase()] as const,
  aiOverviewAll: (wid: string) => [...ws(wid), "ai-overview"] as const,
  aiOverview: (wid: string, key: string) => [...ws(wid), "ai-overview", key] as const,
  competitors: (wid: string, did: string) => [...dom(wid, did), "competitors"] as const,
  rankedKeywords: {
    options: (wid: string, did: string) => [...dom(wid, did), "ranked-keywords", "options"] as const,
    detail: (wid: string, did: string, target: string, scope: string | null) =>
      [...dom(wid, did), "ranked-keywords", target, scope ?? "latest"] as const,
  },
  strategy: (wid: string, did: string, scope: string) => [...dom(wid, did), "strategy", scope] as const,
  competitorAnalytics: (wid: string, did: string) => [...dom(wid, did), "competitor-analytics"] as const,
  competitorKeywords: (wid: string, did: string, competitor: string, kind: string) =>
    [...dom(wid, did), "competitor-keywords", competitor, kind] as const,
  actionPlan: (wid: string, did: string) => [...dom(wid, did), "action-plan"] as const,
  rankings: (wid: string, did: string) => [...dom(wid, did), "rankings"] as const,
  myKeywords: {
    all: (wid: string, did: string) => [...dom(wid, did), "my-keywords"] as const,
    list: (wid: string, did: string, page: number, q: string, sort: string, order: string) =>
      [...dom(wid, did), "my-keywords", "list", page, q, sort, order] as const,
    keys: (wid: string, did: string) => [...dom(wid, did), "my-keywords", "keys"] as const,
  },
  /** Action Plan tabs: quick wins, tracked keywords, overview, pages. */
  opportunity: (wid: string, did: string) => [...dom(wid, did), "opportunity"] as const,
  pageDiscovery: (wid: string, did: string) => [...dom(wid, did), "page-discovery"] as const,
  pageInsight: (wid: string, did: string, keyword: string, url: string | null, competitorUrl: string | null) =>
    [...dom(wid, did), "page-insight", keyword, url ?? "", competitorUrl ?? ""] as const,
}
