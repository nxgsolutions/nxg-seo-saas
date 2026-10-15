import {
  BarChart3,
  Bookmark,
  Bot,
  Code2,
  CreditCard,
  FileBarChart,
  FileText,
  Gauge,
  History,
  KeyRound,
  LayoutDashboard,
  LineChart,
  Link2,
  Settings,
  Sparkles,
  ScanSearch,
  Split,
  Swords,
  TrendingUp,
  Users,
  Wrench,
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
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    title: "Keywords",
    items: [
      { label: "Keyword Analysis", href: "/dashboard/keyword-analysis", icon: KeyRound },
      // Saved Keywords: a shortlist you save (no rank tracking). Paired with the
      // "Save keyword" action in components/keywords/keyword-actions-menu.tsx.
      { label: "Saved Keywords", href: "/dashboard/my-keywords", icon: Bookmark },
      { label: "Competitive Strategy", href: "/dashboard/competitive-strategy", icon: LineChart, match: ["/dashboard/competitors"] },
      { label: "Action Plan", href: "/dashboard/opportunity-research", icon: TrendingUp },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Content Optimization", href: "/dashboard/content-optimization", icon: FileText },
      { label: "Page Discovery", href: "/dashboard/page-discovery", icon: ScanSearch },
      { label: "Page Audit", href: "/dashboard/page-audit", icon: Gauge, match: ["/dashboard/page-optimization", "/dashboard/page-history"] },
      { label: "Title & Meta", href: "/dashboard/meta-tags", icon: Code2, match: ["/dashboard/serp-preview"] },
    ],
  },
  {
    // Off-page: who links to you, and who links to competitors but not you.
    title: "Backlinks",
    items: [
      { label: "Backlink Profile", href: "/dashboard/backlinks", icon: Link2, exact: true },
      { label: "Link Gap", href: "/dashboard/backlinks/gap", icon: Split },
    ],
  },
  {
    title: "Technical",
    items: [
      { label: "Crawlability", href: "/dashboard/robots", icon: Bot },
    ],
  },
  {
    title: "Monitor",
    items: [
      { label: "Search Performance", href: "/dashboard/search-performance", icon: LineChart },
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
export interface NavTab { label: string; href: string; icon: LucideIcon; description: string }
export const navTabGroups: NavTab[][] = [
  [
    { label: "Competitor keywords", href: "/dashboard/competitive-strategy", icon: Swords, description: "What their sites rank for" },
    { label: "Tracked competitors", href: "/dashboard/competitors", icon: Users, description: "Your competitor list" },
  ],
  [
    { label: "Audit", href: "/dashboard/page-audit", icon: Gauge, description: "Score a page" },
    { label: "Page history", href: "/dashboard/page-history", icon: History, description: "Changes & results over time" },
    { label: "Fix plan", href: "/dashboard/page-optimization", icon: Wrench, description: "What to fix first" },
  ],
  [
    { label: "Meta tags", href: "/dashboard/meta-tags", icon: Code2, description: "Titles & descriptions" },
    { label: "Search preview", href: "/dashboard/serp-preview", icon: ScanSearch, description: "How it looks on Google" },
  ],
]

/** The tab group the current page belongs to, if any. */
export function tabGroupFor(pathname: string): NavTab[] | null {
  return navTabGroups.find((g) => g.some((t) => pathname.startsWith(t.href))) ?? null
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
