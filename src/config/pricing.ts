/**
 * Pricing configuration — the single source of truth for plans. Change prices
 * and features here; every pricing component reads from this file.
 *
 * Prices are PLACEHOLDERS until finalized.
 */
export interface Plan {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: { label: string; href: string }
  highlighted?: boolean
  badge?: string
}

export const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For individuals getting started with first-party SEO.",
    features: [
      "1 workspace, 1 website",
      "Keyword research (first-party)",
      "Basic rank tracking",
      "Search Console connection",
      "Community support",
    ],
    cta: { label: "Start free", href: "/register" },
  },
  {
    name: "Pro",
    price: "$49",
    period: "/month",
    description: "For teams growing organic search across more sites.",
    features: [
      "Up to 5 websites",
      "Advanced keyword research & clustering",
      "Daily rank tracking (locations & devices)",
      "Content optimizer & briefs",
      "Competitor analysis",
      "Email support",
    ],
    cta: { label: "Start free", href: "/register" },
    highlighted: true,
    badge: "Most popular",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For larger teams with advanced scale and control needs.",
    features: [
      "Unlimited websites",
      "Roles & permissions",
      "Priority support & onboarding",
      "Custom integrations",
      "SSO (on request)",
    ],
    cta: { label: "Contact sales", href: "/contact" },
  },
]

export const billingNote = "Prices shown are placeholders and exclude any applicable taxes."

/**
 * Plan comparison matrix for the pricing page. Mirrors the plan feature lists
 * above — keep the two in sync. `true` = included, `false` = not included,
 * string = included with that qualifier. Columns follow `plans` order.
 */
export type MatrixCell = boolean | string
export interface MatrixGroup {
  label: string
  rows: { label: string; values: [MatrixCell, MatrixCell, MatrixCell] }[]
}

export const planMatrix: MatrixGroup[] = [
  {
    label: "Sites & data",
    rows: [
      { label: "Websites", values: ["1", "Up to 5", "Unlimited"] },
      { label: "Google Search Console connection", values: [true, true, true] },
      { label: "Google Trends & Autocomplete signals", values: [true, true, true] },
    ],
  },
  {
    label: "Research & tracking",
    rows: [
      { label: "First-party keyword research", values: [true, true, true] },
      { label: "Keyword clustering", values: [false, true, true] },
      { label: "Rank tracking", values: ["Basic", "Daily", "Daily"] },
      { label: "Location & device tracking", values: [false, true, true] },
    ],
  },
  {
    label: "Optimization & analysis",
    rows: [
      { label: "Content optimizer & briefs", values: [false, true, true] },
      { label: "Competitor analysis", values: [false, true, true] },
      { label: "Custom integrations", values: [false, false, true] },
    ],
  },
  {
    label: "Team & support",
    rows: [
      { label: "Roles & permissions", values: [false, false, true] },
      { label: "SSO", values: [false, false, "On request"] },
      { label: "Support", values: ["Community", "Email", "Priority + onboarding"] },
    ],
  },
]
