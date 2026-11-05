import {
  BarChart3,
  Bookmark,
  Bot,
  Code2,
  CreditCard,
  FileBarChart,
  FileText,
  Gauge,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Link2,
  Settings,
  Sparkles,
  ScanSearch,
  Split,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react"

export interface NavItem {
  label: string
  /** Optional for parent items that only group children. */
  href?: string
  icon: LucideIcon
  /** Match exactly (true) or by prefix (false). */
  exact?: boolean
  soon?: boolean
  /** Other path prefixes that also highlight this item (pages merged under it as tabs). */
  match?: string[]
  /** Sub-items rendered as a collapsible dropdown group. */
  children?: NavItem[]
}

export interface NavSection {
  /** Section heading; omit for the top (ungrouped) items. */
  title?: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    items: [
      {
        label: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        exact: true,
      },
    ],
  },
  {
    title: "Keywords",
    items: [
      {
        label: "Keyword Analysis",
        href: "/dashboard/keyword-analysis",
        icon: KeyRound,
      },
      // Saved Keywords: a shortlist you save (no rank tracking). Paired with the
      // "Save keyword" action in components/keywords/keyword-actions-menu.tsx.
      {
        label: "Saved Keywords",
        href: "/dashboard/my-keywords",
        icon: Bookmark,
      },
      // Competitor Analysis is the single entry point. Clicking a competitor
      // opens its keyword detail at the NESTED route /dashboard/competitors/keywords,
      // which this item highlights automatically via the prefix match on its href.
      {
        label: "Competitor Analysis",
        href: "/dashboard/competitors",
        icon: Users,
      },
      {
        label: "Competitive Strategy",
        href: "/dashboard/competitive-strategy",
        icon: Split,
      },
      {
        label: "Action Plan",
        href: "/dashboard/opportunity-research",
        icon: TrendingUp,
      },
    ],
  },
  {
    title: "Content",
    items: [
      // Flow: discover your pages first, then open one in the editor to optimize.
      {
        label: "Page Discovery",
        href: "/dashboard/page-discovery",
        icon: ScanSearch,
      },
      {
        label: "Content Optimization",
        href: "/dashboard/content-optimization",
        icon: FileText,
      },
      // Per-page audit + a slim SEO Score that links to the full
      // breakdown at /dashboard/site-score (both highlight this sidebar item).
      // The old page-score / fix-plan / history routes still redirect here.
      {
        label: "Page Audit",
        href: "/dashboard/page-audit",
        icon: Gauge,
        match: [
          "/dashboard/site-score",
          "/dashboard/page-score",
          "/dashboard/page-optimization",
          "/dashboard/page-history",
        ],
      },
      {
        label: "Title & Meta",
        href: "/dashboard/meta-tags",
        icon: Code2,
        match: ["/dashboard/serp-preview"],
      },
    ],
  },
  {
    // Off-page: who links to you, who links to competitors but not you, and link-building.
    title: "Backlinks",
    items: [
      // Overview + Anchors & Quality + New & Lost live here as in-page tabs; the
      // site/page drill-downs highlight this item too.
      {
        label: "Overview",
        href: "/dashboard/backlinks",
        icon: Link2,
        exact: true,
        match: ["/dashboard/backlinks/site", "/dashboard/backlinks/page"],
      },
      {
        label: "Explorer",
        href: "/dashboard/backlinks/explorer",
        icon: ScanSearch,
      },
      // Link Gap + Reclamation as in-page tabs.
      { label: "Opportunities", href: "/dashboard/backlinks/gap", icon: Split },
    ],
  },
  {
    title: "Technical",
    items: [{ label: "Crawlability", href: "/dashboard/robots", icon: Bot }],
  },
  {
    title: "Monitor",
    items: [
      {
        label: "Search Performance",
        href: "/dashboard/search-performance",
        icon: LineChart,
      },
      { label: "Rank Tracking", href: "/dashboard/rankings", icon: BarChart3 },
      { label: "AI Visibility", href: "/dashboard/ai-search", icon: Sparkles },
      { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
    ],
  },
  {
    title: "Workspace",
    items: [
      { label: "Team", href: "/dashboard/team", icon: Users },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
]

/** Pages that share one menu item are linked by tabs at the top of each page. */
/** A page inside a tab group; rendered by SectionTabs as a "cards" segmented tab. */
export interface NavTab {
  label: string
  href: string
  icon: LucideIcon
  description: string
}
export const navTabGroups: NavTab[][] = [
  // The score/audit pages are now nested in the sidebar (see navSections),
  // not a tab bar. Only Title & Meta still shares a small two-tab bar.
  [
    {
      label: "Meta tags",
      href: "/dashboard/meta-tags",
      icon: Code2,
      description: "Titles & descriptions",
    },
    {
      label: "Search preview",
      href: "/dashboard/serp-preview",
      icon: ScanSearch,
      description: "How it looks on Google",
    },
  ],
]

/** The tab group the current page belongs to, if any. */
export function tabGroupFor(pathname: string): NavTab[] | null {
  return (
    navTabGroups.find((g) => g.some((t) => pathname.startsWith(t.href))) ?? null
  )
}

/** Flat list of every navigable item (used by the topbar command search). */
export const allNavItems: NavItem[] = navSections
  .flatMap((s) => s.items)
  .flatMap((item) => (item.children ? item.children : [item]))
  .filter((item) => item.href)

export function isActive(pathname: string, item: NavItem): boolean {
  if (!item.href) {
    return (item.children ?? []).some((c) => isActive(pathname, c))
  }
  if (item.match?.some((p) => pathname.startsWith(p))) return true
  return item.exact ? pathname === item.href : pathname.startsWith(item.href)
}

export interface Crumb {
  label: string
  href: string
}

/**
 * Nested routes that live under a sidebar item's path but have no entry of
 * their own, mapped to the label shown as the final breadcrumb crumb. The
 * parent crumb is resolved from the matching sidebar item, so clicking it
 * returns to the parent page.
 */
export const nestedRouteLabels: Record<string, string> = {
  "/dashboard/competitors/keywords": "Competitor Keywords",
  // Full whole-site breakdown opened from the Page Audit page.
  "/dashboard/site-score": "SEO Score",
}

/**
 * Breadcrumb trail for the topbar: the matching sidebar item, then (for a known
 * nested route) a child crumb. Every crumb but the last is a link back.
 */
export function breadcrumbTrail(pathname: string): Crumb[] {
  const parent = allNavItems
    .filter((i) => isActive(pathname, i))
    .sort((a, b) => (b.href?.length ?? 0) - (a.href?.length ?? 0))[0]
  const trail: Crumb[] = [
    parent?.href
      ? { label: parent.label, href: parent.href }
      : { label: "Dashboard", href: "/dashboard" },
  ]
  const childLabel = nestedRouteLabels[pathname]
  if (childLabel && trail[0].href !== pathname) {
    trail.push({ label: childLabel, href: pathname })
  }
  return trail
}
