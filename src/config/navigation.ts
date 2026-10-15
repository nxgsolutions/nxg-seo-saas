/**
 * Public marketing navigation — header menus + footer columns.
 *
 * Kept separate from the authenticated dashboard nav (`config/nav.ts`).
 * Only links to routes that exist or are planned in the redesign roadmap.
 */
import {
  BookOpen,
  Building2,
  FileText,
  Gauge,
  Library,
  LineChart,
  Newspaper,
  Radar,
  Rocket,
  Search,
  ShoppingCart,
  Target,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react"

export interface NavLink {
  label: string
  href: string
  description?: string
  icon?: LucideIcon
}

export interface NavGroup {
  label: string
  items: NavLink[]
}

/** Header dropdown menus (desktop mega-nav / mobile accordion). */
export const productMenu: NavGroup = {
  label: "Product",
  items: [
    { label: "Keyword Research", href: "/keyword-research", icon: Search, description: "First-party keyword ideas, intent & opportunity scoring." },
    { label: "Rank Tracker", href: "/rank-tracker", icon: LineChart, description: "Track positions across locations and devices over time." },
    { label: "Content Optimizer", href: "/content-optimizer", icon: FileText, description: "Optimize pages against what actually ranks." },
    { label: "SEO Audit", href: "/seo-audit", icon: Gauge, description: "Find and prioritize technical and on-page issues." },
    { label: "Competitor Analysis", href: "/competitor-analysis", icon: Users, description: "See gaps and overlap against rival domains." },
    { label: "SERP Analysis", href: "/serp-analysis", icon: Radar, description: "Understand the SERP: features, intent and difficulty." },
  ],
}

export const solutionsMenu: NavGroup = {
  label: "Solutions",
  items: [
    { label: "Agencies", href: "/solutions/agencies", icon: Users, description: "Manage many clients from one workspace." },
    { label: "Enterprise", href: "/solutions/enterprise", icon: Building2, description: "Scale, roles and reporting for large teams." },
    { label: "SEO Teams", href: "/solutions/seo-teams", icon: Target, description: "A command center for organic growth." },
    { label: "Content Teams", href: "/solutions/content-teams", icon: FileText, description: "Brief, write and optimize with data." },
    { label: "Ecommerce", href: "/solutions/ecommerce", icon: ShoppingCart, description: "Win category and product search." },
    { label: "Startups", href: "/solutions/startups", icon: Rocket, description: "Punch above your weight in search." },
  ],
}

export const resourcesMenu: NavGroup = {
  label: "Resources",
  items: [
    { label: "Blog", href: "/blog", icon: Newspaper, description: "Playbooks, product news and SEO thinking." },
    { label: "Guides", href: "/guides", icon: BookOpen, description: "In-depth, practical SEO guides." },
    { label: "Glossary", href: "/glossary", icon: Library, description: "Plain-English SEO definitions." },
    { label: "Resources", href: "/resources", icon: Wrench, description: "Templates, checklists and tools." },
  ],
}

/** Top-level header links shown as simple links (not dropdowns). */
export const headerLinks: NavLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Customers", href: "/customers" },
]

export const headerMenus: NavGroup[] = [productMenu, solutionsMenu, resourcesMenu]

/** Footer columns. */
export const footerColumns: NavGroup[] = [
  {
    label: "Product",
    items: [
      { label: "Keyword Research", href: "/keyword-research" },
      { label: "Rank Tracker", href: "/rank-tracker" },
      { label: "Content Optimizer", href: "/content-optimizer" },
      { label: "SEO Audit", href: "/seo-audit" },
      { label: "Competitor Analysis", href: "/competitor-analysis" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    label: "Solutions",
    items: [
      { label: "Agencies", href: "/solutions/agencies" },
      { label: "Enterprise", href: "/solutions/enterprise" },
      { label: "SEO Teams", href: "/solutions/seo-teams" },
      { label: "Ecommerce", href: "/solutions/ecommerce" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Blog", href: "/blog" },
      { label: "Guides", href: "/guides" },
      { label: "Glossary", href: "/glossary" },
      { label: "Integrations", href: "/integrations" },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Book a Demo", href: "/demo" },
    ],
  },
]

/** Utility/legal links in the footer bottom bar. */
export const legalLinks: NavLink[] = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
]
