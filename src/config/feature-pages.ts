/**
 * Content for the public feature pages. Each entry has genuinely unique copy —
 * not a re-headed template — driving the shared FeaturePageTemplate.
 *
 * Only describe capabilities that exist or are on the roadmap. No fake metrics.
 */
import {
  BarChart3,
  Braces,
  FileText,
  Gauge,
  GitBranch,
  Globe,
  LineChart,
  Radar,
  Search,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react"

import type { FaqItem } from "@/components/marketing/faq"

export interface FeatureItem {
  icon: LucideIcon
  title: string
  body: string
}
export interface SplitBlock {
  eyebrow: string
  title: string
  description: string
  bullets: string[]
  reverse?: boolean
}
export interface FeaturePage {
  slug: string
  metaTitle: string
  metaDescription: string
  hero: { eyebrow: string; title: string; description: string }
  featuresEyebrow: string
  featuresTitle: string
  features: FeatureItem[]
  splits: SplitBlock[]
  faqs: FaqItem[]
}

export const featurePages: Record<string, FeaturePage> = {
  "keyword-research": {
    slug: "keyword-research",
    metaTitle: "Keyword Research",
    metaDescription:
      "First-party keyword research built on Google Search Console, Autocomplete and the live SERP — with intent, difficulty and opportunity scoring.",
    hero: {
      eyebrow: "Keyword Research",
      title: "Keyword research from data you already own",
      description:
        "Find the terms worth targeting using your own Search Console data, Google Autocomplete and the live SERP — scored for intent, difficulty and opportunity, with no data-reseller fees.",
    },
    featuresEyebrow: "What you get",
    featuresTitle: "Everything you need to pick the right keywords",
    features: [
      { icon: Search, title: "Idea discovery", body: "Expand a seed into hundreds of ideas from Autocomplete, related searches and your ranked queries." },
      { icon: Target, title: "Intent & opportunity", body: "Every keyword is classified by intent and scored for opportunity so you know what to chase first." },
      { icon: GitBranch, title: "Clustering", body: "Group related keywords into topics and sub-topics to plan pillar and supporting content." },
    ],
    splits: [
      {
        eyebrow: "Grounded in your data",
        title: "Real demand from Search Console",
        description:
          "Instead of modelled estimates, NXGSEO reads the impressions and positions your site already earns — the most accurate demand signal there is for pages you rank for.",
        bullets: [
          "Impressions, clicks and average position per query",
          "Google Trends for relative demand on new topics",
          "Provenance on every keyword — know where it came from",
        ],
      },
      {
        eyebrow: "Prioritize with confidence",
        title: "Opportunity, not vanity metrics",
        description:
          "Opportunity blends real demand, striking-distance position and difficulty into one explainable score, so your roadmap targets the keywords most likely to move traffic.",
        bullets: [
          "Transparent scoring you can inspect",
          "Striking-distance keywords surfaced automatically",
          "Export-ready lists for your content team",
        ],
        reverse: true,
      },
    ],
    faqs: [
      { q: "Do you provide absolute search volume?", a: "For your own site we use real Search Console impressions; for new topics we show Google Trends' relative demand. Absolute third-party volume is optional and not required to prioritize well." },
      { q: "Where do keyword ideas come from?", a: "Google Autocomplete, related searches, your ranked queries and the live SERP — all first-party or public sources." },
      { q: "Can I cluster keywords into topics?", a: "Yes. Keywords group into hierarchical clusters so you can plan pillar pages and supporting content." },
    ],
  },

  "rank-tracker": {
    slug: "rank-tracker",
    metaTitle: "Rank Tracker",
    metaDescription:
      "Track keyword positions across locations and devices over time, and understand exactly what moved your organic traffic.",
    hero: {
      eyebrow: "Rank Tracker",
      title: "Track rankings — and understand what moved them",
      description:
        "Follow positions across locations and devices, spot gains and losses early, and connect ranking changes to the traffic they drive.",
    },
    featuresEyebrow: "What you get",
    featuresTitle: "Rank tracking that explains itself",
    features: [
      { icon: LineChart, title: "Position history", body: "A clean daily position series per keyword, so you can see trends instead of noise." },
      { icon: Globe, title: "Location & device", body: "Track how you rank by market and on mobile vs desktop." },
      { icon: BarChart3, title: "Gains & losses", body: "See which keywords moved and how that changed your estimated traffic." },
    ],
    splits: [
      {
        eyebrow: "Signal over noise",
        title: "See the trend, not the jitter",
        description:
          "Daily snapshots build a smooth position-over-time series, so a single volatile check never sends you chasing ghosts.",
        bullets: [
          "One point per keyword per day",
          "Rank-distribution buckets (top 3, 4–10, 11–20…)",
          "Alerts for meaningful movements",
        ],
      },
      {
        eyebrow: "Connect ranks to traffic",
        title: "Know why traffic changed",
        description:
          "Gains & losses ties position changes to estimated traffic impact, so you can separate a real win from a seasonal blip.",
        bullets: [
          "Month-over-month change contribution",
          "Top gainers and losers at a glance",
          "GSC clicks and impressions alongside position",
        ],
        reverse: true,
      },
    ],
    faqs: [
      { q: "How often are rankings updated?", a: "Positions are captured on a daily cadence to build a reliable trend line." },
      { q: "Can I track different locations?", a: "Yes — track positions by market and by device." },
      { q: "Does it use my Search Console data?", a: "Yes, GSC clicks, impressions and average position sit alongside tracked positions for context." },
    ],
  },

  "content-optimizer": {
    slug: "content-optimizer",
    metaTitle: "Content Optimizer",
    metaDescription:
      "Optimize pages against what actually ranks, with clear, prioritized on-page guidance and AI-assisted briefs.",
    hero: {
      eyebrow: "Content Optimizer",
      title: "Optimize content against what actually ranks",
      description:
        "Turn a target keyword into a clear, prioritized plan — headings, coverage and on-page fixes — grounded in the pages already winning the SERP.",
    },
    featuresEyebrow: "What you get",
    featuresTitle: "From target keyword to publish-ready page",
    features: [
      { icon: FileText, title: "On-page guidance", body: "Prioritized, specific recommendations for titles, headings, structure and coverage." },
      { icon: Sparkles, title: "AI-assisted briefs", body: "Generate an outline and brief from the SERP and your own site — a strong first draft, not a black box." },
      { icon: Gauge, title: "Content score", body: "A single score that tracks how well a page is optimized as you improve it." },
    ],
    splits: [
      {
        eyebrow: "Learn from the SERP",
        title: "Match the intent that ranks",
        description:
          "NXGSEO reads the current top results to understand the structure, subtopics and intent Google is rewarding — then shows where your page falls short.",
        bullets: [
          "Coverage gaps vs ranking pages",
          "Heading and structure suggestions",
          "Internal-linking opportunities",
        ],
      },
      {
        eyebrow: "Ship faster",
        title: "Briefs your writers will actually use",
        description:
          "Generate a clean outline and brief you can hand to a writer, with the target keywords and questions to answer — all editable.",
        bullets: [
          "Outline + questions to answer",
          "Target keywords and entities",
          "Editable, never locked to a template",
        ],
        reverse: true,
      },
    ],
    faqs: [
      { q: "Does it write content for me?", a: "It generates briefs and outlines to accelerate writing. You stay in control of the final content." },
      { q: "What powers the recommendations?", a: "The live SERP for the target keyword plus your own page — so guidance reflects what's actually ranking." },
      { q: "Is there a content score?", a: "Yes, a single score tracks optimization progress as you apply changes." },
    ],
  },

  "seo-audit": {
    slug: "seo-audit",
    metaTitle: "SEO Audit",
    metaDescription:
      "Find technical and on-page SEO issues and fix them in priority order, ranked by the impact each fix will have.",
    hero: {
      eyebrow: "SEO Audit",
      title: "Find the issues holding your site back",
      description:
        "Run a fast audit that surfaces technical and on-page problems, then work a prioritized list ordered by the impact fixing each one will have.",
    },
    featuresEyebrow: "What you get",
    featuresTitle: "A clear, prioritized fix list",
    features: [
      { icon: Gauge, title: "Page audits", body: "Check titles, metadata, headings, canonicals, images and more against best practice." },
      { icon: Globe, title: "Crawl signals", body: "Review robots, sitemaps and indexability so search engines can reach your pages." },
      { icon: Target, title: "Prioritized fixes", body: "Issues are ranked by impact, so you spend effort where it moves the needle." },
    ],
    splits: [
      {
        eyebrow: "Impact-first",
        title: "Fix what matters, in order",
        description:
          "Every audit ends with a prioritized list — critical issues first — so a long report becomes a short, actionable plan.",
        bullets: [
          "Severity and impact on each finding",
          "Plain-English explanations and fixes",
          "Re-audit to confirm issues are resolved",
        ],
      },
      {
        eyebrow: "Technical foundations",
        title: "Make sure you're crawlable and indexable",
        description:
          "Check the technical basics that quietly cap performance — robots rules, sitemaps, canonical tags and mobile readiness.",
        bullets: [
          "Robots & sitemap review",
          "Canonical and indexability checks",
          "Core on-page metadata validation",
        ],
        reverse: true,
      },
    ],
    faqs: [
      { q: "What does the audit check?", a: "On-page metadata, headings, images, canonicals and technical signals like robots and sitemaps." },
      { q: "Are fixes prioritized?", a: "Yes — findings are ranked by impact so you can work the highest-value items first." },
      { q: "Can I re-run it after fixing?", a: "Yes, re-audit any page to confirm issues are resolved." },
    ],
  },

  "competitor-analysis": {
    slug: "competitor-analysis",
    metaTitle: "Competitor Analysis",
    metaDescription:
      "See keyword gaps and overlap against rival domains and find the terms worth targeting next.",
    hero: {
      eyebrow: "Competitor Analysis",
      title: "See the gaps between you and your rivals",
      description:
        "Compare against competing domains to find the keywords they win that you don't — and the overlap where a small push moves you ahead.",
    },
    featuresEyebrow: "What you get",
    featuresTitle: "Turn competitors into a keyword roadmap",
    features: [
      { icon: Users, title: "Gap analysis", body: "Find keywords competitors rank for that you're missing entirely." },
      { icon: BarChart3, title: "Overlap & share", body: "See where you already compete and how visibility is split." },
      { icon: Target, title: "Opportunity shortlist", body: "Prioritize the competitor keywords most worth pursuing." },
    ],
    splits: [
      {
        eyebrow: "Find the whitespace",
        title: "The keywords you're not even in the race for",
        description:
          "Gap analysis highlights terms rivals rank for that you don't, turning competitive research into a concrete content plan.",
        bullets: [
          "Missing-keyword discovery",
          "Prioritized by opportunity, not raw volume",
          "Grouped into topics you can action",
        ],
      },
      {
        eyebrow: "Win the near-misses",
        title: "Push ahead where you already overlap",
        description:
          "See the keywords where you and a competitor both rank, and focus on the ones where you're one improvement away from overtaking them.",
        bullets: [
          "Head-to-head position comparison",
          "Striking-distance overlap surfaced",
          "Clear next actions per keyword",
        ],
        reverse: true,
      },
    ],
    faqs: [
      { q: "Which competitors can I compare?", a: "Enter rival domains to compare visibility and keyword overlap." },
      { q: "How complete is competitor data?", a: "Depth depends on first-party and public sources; it's designed to surface actionable gaps, not to resell licensed clickstream data." },
      { q: "Can I turn gaps into a plan?", a: "Yes — missing keywords group into topics and feed straight into research and content." },
    ],
  },

  "serp-analysis": {
    slug: "serp-analysis",
    metaTitle: "SERP Analysis",
    metaDescription:
      "Read the SERP before you commit — features, intent and difficulty — so you target keywords you can realistically win.",
    hero: {
      eyebrow: "SERP Analysis",
      title: "Read the SERP before you commit",
      description:
        "Understand who ranks, which SERP features appear and what intent Google rewards — so you only chase keywords you can realistically win.",
    },
    featuresEyebrow: "What you get",
    featuresTitle: "Everything the SERP is telling you",
    features: [
      { icon: Radar, title: "SERP features", body: "See featured snippets, People Also Ask, video and more for any query." },
      { icon: Braces, title: "Intent read", body: "Understand whether a query is informational, commercial or transactional." },
      { icon: Gauge, title: "Difficulty signal", body: "Gauge how contested a SERP is from who ranks and how they're structured." },
    ],
    splits: [
      {
        eyebrow: "Know the battlefield",
        title: "See the features before you write",
        description:
          "Different SERP features demand different content. NXGSEO shows which features appear so you can format a page to win them.",
        bullets: [
          "Featured snippet and PAA visibility",
          "Video, images and other rich results",
          "Feature distribution across your keywords",
        ],
      },
      {
        eyebrow: "Target what you can win",
        title: "Match intent, judge difficulty",
        description:
          "Reading intent and difficulty up front stops you writing the wrong type of page for a keyword you were never going to rank for.",
        bullets: [
          "Intent classification per keyword",
          "Difficulty signal from the live results",
          "Clear go / no-go on each target",
        ],
        reverse: true,
      },
    ],
    faqs: [
      { q: "Which SERP features do you detect?", a: "Common features like featured snippets, People Also Ask, video, images and top stories." },
      { q: "How is difficulty estimated?", a: "From the live results — who ranks and how their pages are structured — rather than a licensed metric." },
      { q: "Can I see intent per keyword?", a: "Yes, each keyword is classified so you build the right kind of page." },
    ],
  },
}

export const featureSlugs = Object.keys(featurePages)
