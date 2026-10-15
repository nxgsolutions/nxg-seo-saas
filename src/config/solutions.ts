/**
 * Content for the public solution / use-case pages. Audience-specific copy —
 * genuine value per page, not thin doorway pages. No fabricated metrics.
 */
import {
  Boxes,
  Building2,
  FileText,
  Gauge,
  LineChart,
  Rocket,
  Search,
  ShoppingCart,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { FaqItem } from "@/components/marketing/faq"
import type { FeatureItem } from "@/config/feature-pages"

export interface Challenge {
  title: string
  body: string
}
export interface SolutionPage {
  slug: string
  icon: LucideIcon
  metaTitle: string
  metaDescription: string
  hero: { eyebrow: string; title: string; description: string }
  challenges: Challenge[]
  outcomesEyebrow: string
  outcomesTitle: string
  outcomes: FeatureItem[]
  faqs: FaqItem[]
}

export const solutionPages: Record<string, SolutionPage> = {
  agencies: {
    slug: "agencies",
    icon: Users,
    metaTitle: "SEO for Agencies",
    metaDescription:
      "Manage SEO for many clients from one workspace — first-party data, clear reporting and no per-keyword reseller fees.",
    hero: {
      eyebrow: "For Agencies",
      title: "Run every client's SEO from one workspace",
      description:
        "Keep research, tracking and reporting for all your clients in one place — with first-party data and pricing that doesn't punish you per keyword.",
    },
    challenges: [
      { title: "Tool costs scale with clients", body: "Per-keyword and per-seat pricing makes margins shrink as you add accounts." },
      { title: "Fragmented reporting", body: "Every client needs a clear story, but data lives across disconnected tools." },
      { title: "Onboarding overhead", body: "Spinning up a new client should take minutes, not a day of setup." },
    ],
    outcomesEyebrow: "How NXGSEO helps",
    outcomesTitle: "Built for multi-client work",
    outcomes: [
      { icon: Boxes, title: "Workspaces per client", body: "Isolate each client's sites, keywords and reports in their own workspace." },
      { icon: LineChart, title: "Clear rank reporting", body: "Show movement and traffic impact your clients actually understand." },
      { icon: Search, title: "First-party research", body: "Ground recommendations in each client's own Search Console data." },
    ],
    faqs: [
      { q: "Can I manage multiple clients?", a: "Yes — each client gets an isolated workspace with its own sites, keywords and reports." },
      { q: "How does pricing work for agencies?", a: "There are no per-keyword data-reseller fees, so costs stay predictable as you add clients. See Pricing for plan limits." },
    ],
  },

  enterprise: {
    slug: "enterprise",
    icon: Building2,
    metaTitle: "Enterprise SEO",
    metaDescription:
      "Scale organic search across large teams with roles, reporting and first-party data you control.",
    hero: {
      eyebrow: "For Enterprise",
      title: "SEO that scales with your organization",
      description:
        "Give large teams a shared source of truth for organic search — with roles, reporting and data governance built in.",
    },
    challenges: [
      { title: "Many stakeholders", body: "Content, product and leadership all need different views of the same data." },
      { title: "Data governance", body: "Sensitive performance data shouldn't be scattered across third-party tools." },
      { title: "Consistency at scale", body: "Dozens of sites and teams need one repeatable workflow." },
    ],
    outcomesEyebrow: "How NXGSEO helps",
    outcomesTitle: "Control and clarity at scale",
    outcomes: [
      { icon: Users, title: "Roles & permissions", body: "Give the right people the right access across workspaces." },
      { icon: Gauge, title: "Standardized workflow", body: "One repeatable process from research to reporting across every team." },
      { icon: Search, title: "First-party by design", body: "Built on data you own — not resold clickstream you can't verify." },
    ],
    faqs: [
      { q: "Do you support roles and permissions?", a: "Yes, on the Enterprise plan you can manage roles and access across workspaces." },
      { q: "Is SSO available?", a: "SSO is available on request for Enterprise customers." },
    ],
  },

  "seo-teams": {
    slug: "seo-teams",
    icon: Target,
    metaTitle: "SEO for SEO Teams",
    metaDescription:
      "A command center for organic growth — research, tracking, audits and competitor analysis in one workflow.",
    hero: {
      eyebrow: "For SEO Teams",
      title: "Your command center for organic growth",
      description:
        "Stop stitching together five tools. Run research, tracking, audits and competitor analysis from one workflow built on data you own.",
    },
    challenges: [
      { title: "Too many tools", body: "Switching between research, tracking and audit tools wastes hours every week." },
      { title: "Estimates you can't trust", body: "Modelled third-party volumes make prioritization a guessing game." },
      { title: "Hard to prove impact", body: "Connecting ranking changes to traffic and revenue is painful." },
    ],
    outcomesEyebrow: "How NXGSEO helps",
    outcomesTitle: "One workflow, end to end",
    outcomes: [
      { icon: Search, title: "Research to roadmap", body: "Turn first-party data into a prioritized keyword roadmap." },
      { icon: LineChart, title: "Prove what moved", body: "Tie ranking changes to traffic impact with gains & losses." },
      { icon: Gauge, title: "Fix what matters", body: "Audits ranked by impact keep the team focused on high-value work." },
    ],
    faqs: [
      { q: "Does it replace my other SEO tools?", a: "For research, tracking, audits and competitor gaps, yes — all in one workflow. It's built on first-party data rather than resold estimates." },
      { q: "Can I export data?", a: "Yes, keyword and reporting data is export-ready for your team." },
    ],
  },

  "content-teams": {
    slug: "content-teams",
    icon: FileText,
    metaTitle: "SEO for Content Teams",
    metaDescription:
      "Brief, write and optimize content with data — outlines from the SERP, target keywords and a clear content score.",
    hero: {
      eyebrow: "For Content Teams",
      title: "Brief, write and optimize with data",
      description:
        "Give writers a clear, data-backed brief and a score to optimize against — grounded in what actually ranks, not guesswork.",
    },
    challenges: [
      { title: "Briefs without data", body: "Writers get topics, not the structure and coverage that actually rank." },
      { title: "Optimization is vague", body: "\"Add more keywords\" isn't guidance a writer can act on." },
      { title: "No feedback loop", body: "It's hard to know if a page is improving before it's published." },
    ],
    outcomesEyebrow: "How NXGSEO helps",
    outcomesTitle: "From brief to publish-ready",
    outcomes: [
      { icon: FileText, title: "SERP-based briefs", body: "Outlines and questions to answer, drawn from the pages already ranking." },
      { icon: Target, title: "Target keywords", body: "The exact terms and entities to cover, prioritized by opportunity." },
      { icon: Gauge, title: "Content score", body: "A single score that tracks optimization as writers improve a page." },
    ],
    faqs: [
      { q: "Will writers find it usable?", a: "Yes — briefs are clean outlines with target keywords and questions to answer, and everything stays editable." },
      { q: "Does it grade my content?", a: "A content score tracks how well a page is optimized as you apply changes." },
    ],
  },

  ecommerce: {
    slug: "ecommerce",
    icon: ShoppingCart,
    metaTitle: "SEO for Ecommerce",
    metaDescription:
      "Win category and product search — keyword research, rank tracking and content optimization for online stores.",
    hero: {
      eyebrow: "For Ecommerce",
      title: "Win category and product search",
      description:
        "Find the queries shoppers actually use, track how you rank for them, and optimize category and product pages to convert.",
    },
    challenges: [
      { title: "Thousands of pages", body: "Category and product pages are hard to prioritize and keep optimized." },
      { title: "High-intent queries", body: "Commercial and transactional terms are competitive and change fast." },
      { title: "Seasonality", body: "Demand shifts constantly, and static estimates miss it." },
    ],
    outcomesEyebrow: "How NXGSEO helps",
    outcomesTitle: "Built for online stores",
    outcomes: [
      { icon: Search, title: "Commercial intent", body: "Surface transactional and commercial keywords worth targeting." },
      { icon: LineChart, title: "Track by market", body: "Follow rankings across locations and devices where shoppers buy." },
      { icon: FileText, title: "Optimize PDPs", body: "Improve product and category pages against what ranks and converts." },
    ],
    faqs: [
      { q: "Can it handle large catalogs?", a: "Yes — organize keywords into clusters by category and product to prioritize at scale." },
      { q: "Does it detect intent?", a: "Every keyword is classified so you can focus on commercial and transactional queries." },
    ],
  },

  startups: {
    slug: "startups",
    icon: Rocket,
    metaTitle: "SEO for Startups",
    metaDescription:
      "Punch above your weight in search — first-party SEO you can start free, with no per-keyword fees.",
    hero: {
      eyebrow: "For Startups",
      title: "Punch above your weight in search",
      description:
        "Get enterprise-grade SEO workflow without the enterprise bill. Start free on first-party data and grow into it.",
    },
    challenges: [
      { title: "Tight budgets", body: "Expensive SEO suites are hard to justify before you have traction." },
      { title: "Small teams", body: "You need results without a dedicated SEO department." },
      { title: "Need momentum fast", body: "Early organic wins compound — you can't afford to wait." },
    ],
    outcomesEyebrow: "How NXGSEO helps",
    outcomesTitle: "Start free, grow fast",
    outcomes: [
      { icon: Rocket, title: "Free to start", body: "Begin with first-party research and rank tracking at no cost." },
      { icon: Target, title: "Focus on wins", body: "Opportunity scoring points you at the keywords most likely to move." },
      { icon: Gauge, title: "One simple workflow", body: "Research, optimize and track without a steep learning curve." },
    ],
    faqs: [
      { q: "Is there a free plan?", a: "Yes — start free with no credit card and upgrade only when you need more." },
      { q: "Do I need SEO experience?", a: "No. Opportunity scoring and prioritized guidance make it approachable for small teams." },
    ],
  },
}

export const solutionSlugs = Object.keys(solutionPages)
