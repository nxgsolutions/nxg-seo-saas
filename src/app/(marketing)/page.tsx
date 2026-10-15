import type { Metadata } from "next"
import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Database,
  Eye,
  FileBarChart,
  FileText,
  Gauge,
  LineChart,
  Radar,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

import { site } from "@/config/site"
import { createMetadata } from "@/config/seo"
import { solutionsMenu } from "@/config/navigation"
import { heroHighlights, workflowSteps } from "@/config/marketing"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { Section } from "@/components/layout/section"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { LogoStrip } from "@/components/marketing/logo-strip"
import { CtaSection } from "@/components/marketing/cta-section"
import { SectionHeading } from "@/components/marketing/section-heading"
import { HeroBackdrop } from "@/components/marketing/page-hero"
import { Steps } from "@/components/marketing/steps"
import { Comparison, type CompareRow } from "@/components/marketing/comparison"
import { FaqSection, type FaqItem } from "@/components/marketing/faq"
import { ProductTabs, type ProductTab } from "@/components/marketing/product-tabs"
import {
  AuditIssuesMock,
  CompetitorGapMock,
  ContentScoreMock,
  HeroDashboard,
  KeywordTableMock,
  MiniSpark,
  RankChartMock,
} from "@/components/marketing/visuals"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = createMetadata({ path: "/" })

const comparison: CompareRow[] = [
  { label: "Built on first-party data you own", note: "Search Console, your crawl, the live SERP", us: true, them: false },
  { label: "No per-keyword data-reseller fees", us: true, them: false },
  { label: "Transparent, explainable scoring", note: "See exactly why a keyword scores high", us: true, them: false },
  { label: "Keyword research & clustering", us: true, them: true },
  { label: "Rank tracking by location & device", us: true, them: true },
  { label: "Content optimization & briefs", us: true, them: true },
]

const faqs: FaqItem[] = [
  { q: "Where does NXGSEO get its data?", a: "From Google Search Console, Google Autocomplete, Google Trends, live SERP snapshots and your own site crawl — no paid data resellers." },
  { q: "Do I need Google Search Console?", a: "It's recommended, because it gives you real impressions and positions for your site. You can still start with Autocomplete and Trends signals before connecting it." },
  { q: "How is this different from Ahrefs or Semrush?", a: "Those tools resell licensed clickstream data. NXGSEO is built on first-party data you already own, so there's no per-keyword reseller cost and the scoring is fully explainable." },
  { q: "Can I analyze competitors?", a: "Yes — you can compare against rival domains. The depth of competitor data depends on what's available from first-party and public sources." },
  { q: "Is there a free plan?", a: "Yes. You can start free with no credit card, and upgrade when you need more." },
  { q: "Is my Search Console data shared with anyone?", a: "No. Your performance data stays in your workspace. We don't compile, pool or resell it." },
]

const facts = [
  { value: "6", label: "SEO tools in one workspace" },
  { value: "$0", label: "to start — no credit card" },
  { value: "0", label: "data-reseller fees, ever" },
  { value: "100%", label: "explainable, inspectable scores" },
]

const principles = [
  { icon: Database, title: "First-party by default", body: "Real impressions and positions from Search Console — not modelled estimates." },
  { icon: Eye, title: "Explainable scores", body: "Every opportunity and difficulty score shows the inputs behind it." },
  { icon: ShieldCheck, title: "Your data stays yours", body: "We never pool, compile or resell your performance data." },
]

const tabs: ProductTab[] = [
  {
    id: "research",
    label: "Research",
    icon: <Search />,
    title: "Find keywords worth winning — from your own data",
    body: "Expand seeds into hundreds of ideas using Search Console, Autocomplete and the live SERP. Every keyword gets an intent label and an explainable opportunity score.",
    bullets: ["Impressions and positions straight from Search Console", "Intent classification on every keyword", "Clustering into topics and sub-topics"],
    href: "/keyword-research",
    visual: <KeywordTableMock />,
  },
  {
    id: "track",
    label: "Rankings",
    icon: <LineChart />,
    title: "Track positions — and see what moved your traffic",
    body: "Daily positions by location and device, with gains and losses tied directly to estimated traffic so you know exactly what changed and why.",
    bullets: ["Clean daily position history per keyword", "Location and device segmentation", "Traffic impact of every gain and loss"],
    href: "/rank-tracker",
    visual: <RankChartMock />,
  },
  {
    id: "optimize",
    label: "Content",
    icon: <FileText />,
    title: "Optimize every page against what actually ranks",
    body: "Page-level guidance drawn from the current SERP: coverage gaps, questions to answer and structure — with a score that climbs as you improve.",
    bullets: ["Prioritized, specific on-page recommendations", "SERP-based briefs and outlines", "A content score writers can act on"],
    href: "/content-optimizer",
    visual: <ContentScoreMock />,
  },
  {
    id: "audit",
    label: "Site audit",
    icon: <Gauge />,
    title: "Fix the issues holding your site back, in order",
    body: "Technical and on-page checks ranked by the impact fixing them will have, so your team spends effort where it actually moves the needle.",
    bullets: ["Titles, canonicals, headings, images and more", "Robots, sitemap and indexability checks", "Impact-ranked fix list"],
    href: "/seo-audit",
    visual: <AuditIssuesMock />,
  },
  {
    id: "compete",
    label: "Competitors",
    icon: <Users />,
    title: "See the gaps between you and your rivals",
    body: "Find the keywords competitors rank for that you're missing, and the near-misses where you're only a few positions behind.",
    bullets: ["Keyword gap and overlap analysis", "Share of visibility across domains", "A shortlist of competitor keywords to pursue"],
    href: "/competitor-analysis",
    visual: <CompetitorGapMock />,
  },
]

export default function HomePage() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="relative isolate overflow-hidden">
        <HeroBackdrop />
        <Container className="pb-10 pt-16 sm:pt-24 lg:pt-28">
          <div className="mx-auto max-w-4xl text-center">
            <Reveal>
              <Link
                href="/keyword-research"
                className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/80 py-1 pl-1 pr-3 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-brand/40"
              >
                <span className="rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white" style={{ backgroundImage: "var(--grad-brand)" }}>
                  New
                </span>
                First-party keyword research is live
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-7 font-heading text-[clamp(2.6rem,6.5vw,5rem)] font-bold leading-[1.02] tracking-[-0.035em] text-balance">
                Rank higher with data you <span className="text-gradient">actually own</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty sm:text-xl">
                NXGSEO turns Search Console, the live SERP and your own crawl into keyword research, rank tracking
                and content optimization — without paying a data reseller.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button render={<Link href="/register" />} variant="brand" size="xl" className="h-12 px-7 text-base shadow-xl shadow-brand/30">
                  Start free <ArrowRight className="size-4" />
                </Button>
                <Button render={<Link href="/demo" />} variant="outline" size="xl" className="h-12 px-7 text-base">
                  Book a demo
                </Button>
              </div>
              <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {heroHighlights.map((h) => (
                  <li key={h} className="flex items-center gap-1.5">
                    <Check className="size-4 text-brand" /> {h}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          {/* Product visualization (illustrative UI, not customer data) */}
          <Reveal delay={0.2} amount={0.1}>
            <div className="relative mx-auto mt-16 max-w-6xl">
              <div aria-hidden className="absolute -inset-x-10 -top-10 bottom-10 -z-10 rounded-[3rem] bg-gradient-to-b from-brand/20 via-brand/5 to-transparent blur-2xl" />
              <div className="rounded-[1.4rem] border border-border/70 bg-card/40 p-1.5 shadow-2xl shadow-brand/15 backdrop-blur sm:p-2">
                <HeroDashboard />
              </div>

              {/* Floating callouts */}
              <div className="mk-float surface absolute -left-6 top-1/3 hidden w-56 rounded-2xl p-4 xl:block">
                <p className="flex items-center gap-2 text-xs font-semibold">
                  <span className="flex size-6 items-center justify-center rounded-lg bg-brand/10 text-brand"><Sparkles className="size-3.5" /></span>
                  Striking distance
                </p>
                <p className="mt-2 font-heading text-2xl font-bold tabular-nums">42 keywords</p>
                <p className="text-[11px] text-muted-foreground">ranking 11–20, ready to push</p>
              </div>
              <div className="mk-float-delay surface absolute -bottom-6 -right-6 hidden w-60 rounded-2xl p-4 xl:block">
                <p className="text-[11px] text-muted-foreground">“seo audit checklist”</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground line-through">#14</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                  <span className="font-heading text-2xl font-bold text-[var(--chart-pass)]">#6</span>
                </div>
                <MiniSpark values={[-14, -13, -13, -11, -10, -9, -9, -7, -6]} className="mt-1 h-10" />
              </div>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Illustrative preview · sample data
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ---------- Data sources ---------- */}
      <section className="py-12">
        <Container>
          <Reveal>
            <LogoStrip />
          </Reveal>
        </Container>
      </section>

      {/* ---------- Facts ---------- */}
      <section className="pb-8">
        <Container>
          <Stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-border bg-border lg:grid-cols-4">
            {facts.map((f) => (
              <StaggerItem key={f.label} className="bg-card p-6 text-center sm:p-8">
                <p className="text-gradient font-heading text-4xl font-bold tracking-tight sm:text-5xl">{f.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{f.label}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </Container>
      </section>

      {/* ---------- Capabilities bento ---------- */}
      <Section id="capabilities">
        <SectionHeading
          eyebrow="The platform"
          title="Everything you need to grow organic search"
          description="One workspace for research, tracking, optimization and analysis — every tool reading from the same first-party data."
        />
        <Stagger className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
          <BentoTile className="md:col-span-2" href="/keyword-research" icon={Search} title="Keyword Research" body="First-party keyword ideas with intent, difficulty and opportunity scoring — no data resellers.">
            <div className="mt-6 space-y-2">
              {[
                { k: "keyword research tool", i: "Commercial", s: 91 },
                { k: "how to find keywords", i: "Informational", s: 88 },
                { k: "keyword clustering", i: "Commercial", s: 79 },
              ].map((r) => (
                <div key={r.k} className="flex items-center gap-3 rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm">
                  <span className="flex-1 truncate font-medium">{r.k}</span>
                  <span className="hidden rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground sm:inline">{r.i}</span>
                  <span className="w-10 rounded-md bg-brand/10 py-0.5 text-center font-mono text-xs font-bold text-brand">{r.s}</span>
                </div>
              ))}
            </div>
          </BentoTile>
          <BentoTile href="/rank-tracker" icon={LineChart} title="Rank Tracker" body="Positions across locations and devices, tied to traffic.">
            <div className="mt-6 rounded-xl border border-border bg-background/70 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Avg. position</span>
                <span className="font-heading text-xl font-bold tabular-nums">8.6</span>
              </div>
              <MiniSpark values={[-12, -11.5, -12, -10.8, -10, -9.6, -9.8, -9, -8.6]} />
            </div>
          </BentoTile>
          <BentoTile href="/content-optimizer" icon={FileText} title="Content Optimizer" body="Optimize every page against what actually ranks.">
            <div className="mt-6 space-y-2.5 rounded-xl border border-border bg-background/70 p-4">
              {[
                { l: "Coverage", v: 82 },
                { l: "Structure", v: 74 },
                { l: "Readability", v: 88 },
              ].map((m) => (
                <div key={m.l}>
                  <div className="mb-1 flex justify-between text-[11px]">
                    <span className="text-muted-foreground">{m.l}</span>
                    <span className="font-mono font-semibold">{m.v}</span>
                  </div>
                  <span className="block h-1.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full" style={{ width: `${m.v}%`, backgroundImage: "var(--grad-brand)" }} />
                  </span>
                </div>
              ))}
            </div>
          </BentoTile>
          <BentoTile href="/seo-audit" icon={Gauge} title="SEO Audit" body="Technical and on-page issues, ranked by impact.">
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                { v: 20, l: "Critical", c: "text-[var(--chart-fail)] bg-[var(--chart-fail)]/10" },
                { v: 37, l: "Warnings", c: "text-[var(--chart-warn)] bg-[var(--chart-warn)]/10" },
                { v: 184, l: "Passed", c: "text-[var(--chart-pass)] bg-[var(--chart-pass)]/10" },
              ].map((s) => (
                <div key={s.l} className={cn("rounded-xl py-3", s.c)}>
                  <p className="font-heading text-lg font-bold tabular-nums">{s.v}</p>
                  <p className="text-[10px] font-medium opacity-80">{s.l}</p>
                </div>
              ))}
            </div>
          </BentoTile>
          <BentoTile href="/serp-analysis" icon={Radar} title="SERP Analysis" body="Features, intent and difficulty before you commit.">
            <div className="mt-6 flex flex-wrap gap-1.5">
              {["Featured snippet", "People also ask", "Videos", "Images", "Reviews"].map((f) => (
                <span key={f} className="rounded-full border border-border bg-background/70 px-2.5 py-1 text-[11px] font-medium">{f}</span>
              ))}
            </div>
          </BentoTile>
          <BentoTile className="md:col-span-2" href="/competitor-analysis" icon={Users} title="Competitor Analysis" body="Keyword gaps and overlap against rival domains — win the terms that matter.">
            <div className="mt-6 space-y-3 rounded-xl border border-border bg-background/70 p-4">
              {[
                { d: "yoursite.com", v: 34, c: "var(--brand)" },
                { d: "competitor-a.com", v: 29, c: "var(--aqua)" },
                { d: "competitor-b.com", v: 21, c: "var(--chart-warn)" },
              ].map((r) => (
                <div key={r.d} className="flex items-center gap-3 text-xs">
                  <span className="w-32 truncate font-medium">{r.d}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full" style={{ width: `${r.v * 2.5}%`, background: r.c }} />
                  </span>
                  <span className="w-9 text-right font-mono tabular-nums text-muted-foreground">{r.v}%</span>
                </div>
              ))}
            </div>
          </BentoTile>
          <BentoTile href="/integrations" icon={FileBarChart} title="Reports & integrations" body="Connect Google data sources and export client-ready reports.">
            <div className="mt-6 flex items-center gap-2">
              {["GSC", "Trends", "CSV", "PDF"].map((t) => (
                <span key={t} className="flex size-11 items-center justify-center rounded-xl border border-border bg-background/70 font-mono text-[10px] font-bold text-muted-foreground">
                  {t}
                </span>
              ))}
            </div>
          </BentoTile>
        </Stagger>
      </Section>

      {/* ---------- Product tour ---------- */}
      <Section id="tour" className="overflow-hidden border-y border-border bg-muted/25">
        <SectionHeading
          eyebrow="Product tour"
          title="One workflow, from first query to first page"
          description="Click through the core tools. Each one is built on the same first-party data, so insights flow from research to results."
        />
        <div className="mt-12">
          <ProductTabs tabs={tabs} />
        </div>
      </Section>

      {/* ---------- How it works ---------- */}
      <Section id="how-it-works">
        <SectionHeading
          eyebrow="How it works"
          title="From connected to ranking in four steps"
          description="No exports, no spreadsheets — one workflow from data to results."
        />
        <div className="mt-16">
          <Steps steps={workflowSteps} />
        </div>
      </Section>

      {/* ---------- Why NXGSEO ---------- */}
      <Section id="why" className="border-y border-border bg-muted/25">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Why NXGSEO"
              title="First-party data, not a reseller markup"
              description="Most tools resell licensed clickstream data and present modelled numbers as fact. NXGSEO turns the data you already own into research, tracking and optimization."
            />
            <Stagger className="mt-10 space-y-5">
              {principles.map((p) => (
                <StaggerItem key={p.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
                    <p.icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-heading font-semibold">{p.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
          <Reveal delay={0.1}>
            <Comparison rows={comparison} />
          </Reveal>
        </div>
      </Section>

      {/* ---------- Solutions ---------- */}
      <Section id="solutions">
        <SectionHeading
          eyebrow="Solutions"
          title="Built for every team that grows with search"
          description="Whether you run one site or a hundred client accounts, NXGSEO adapts to how your team works."
        />
        <Stagger className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {solutionsMenu.items.map((s) => {
            const Icon = s.icon!
            return (
              <StaggerItem key={s.href} className="h-full">
                <Link
                  href={s.href}
                  className="group flex h-full items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-lg hover:shadow-brand/[0.06]"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground/70 transition-colors group-hover:bg-brand/10 group-hover:text-brand">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between font-heading font-semibold">
                      {s.label}
                      <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">{s.description}</span>
                  </span>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      </Section>

      {/* ---------- FAQ ---------- */}
      <FaqSection items={faqs} />

      {/* ---------- Final CTA ---------- */}
      <CtaSection />

      {/* Structured data */}
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            name: site.name,
            url: site.url,
            description: site.description,
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: site.name,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            description: site.description,
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          },
        ]}
      />
    </>
  )
}

function BentoTile({
  icon: Icon,
  title,
  body,
  href,
  className,
  children,
}: {
  icon: React.ElementType
  title: string
  body: string
  href: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <StaggerItem className={cn("h-full", className)}>
      <Link
        href={href}
        className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-xl hover:shadow-brand/[0.07] sm:p-7"
      >
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-brand/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
        <div className="flex items-start justify-between">
          <span className="flex size-10 items-center justify-center rounded-xl border border-brand/15 bg-gradient-to-b from-brand/15 to-brand/5 text-brand">
            <Icon className="size-5" />
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" />
        </div>
        <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight">{title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-auto">{children}</div>
      </Link>
    </StaggerItem>
  )
}
