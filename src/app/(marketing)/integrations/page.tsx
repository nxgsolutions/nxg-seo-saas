import type { Metadata } from "next"
import Link from "next/link"
import {
  BarChart3,
  Bell,
  CheckCircle2,
  Clock,
  KeyRound,
  LineChart,
  MousePointerClick,
  PlugZap,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from "lucide-react"

import { createMetadata } from "@/config/seo"
import { cn } from "@/lib/utils"
import { Section } from "@/components/layout/section"
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal"
import { PageHero } from "@/components/marketing/page-hero"
import { SectionHeading } from "@/components/marketing/section-heading"
import { Steps, type Step } from "@/components/marketing/steps"
import { CtaSection } from "@/components/marketing/cta-section"

export const metadata: Metadata = createMetadata({
  title: "Integrations",
  description: "NXGSEO connects to the Google data you already use — Search Console, Trends and more — with more integrations on the way.",
  path: "/integrations",
})

interface Integration {
  icon: LucideIcon
  name: string
  category: string
  description: string
  status: "available" | "planned"
}

const integrations: Integration[] = [
  { icon: Search, name: "Google Search Console", category: "Performance data", description: "Your real impressions, clicks and positions — the core first-party signal.", status: "available" },
  { icon: TrendingUp, name: "Google Trends", category: "Demand", description: "Relative demand for any keyword, including brand-new topics.", status: "available" },
  { icon: Sparkles, name: "Google Autocomplete", category: "Keyword ideas", description: "Keyword ideas and real question phrasing, straight from search.", status: "available" },
  { icon: BarChart3, name: "Google Keyword Planner", category: "Demand", description: "Optional volume ranges via the Google Ads API.", status: "planned" },
  { icon: LineChart, name: "Looker Studio", category: "Reporting", description: "Push reporting data into your dashboards.", status: "planned" },
  { icon: Bell, name: "Slack", category: "Alerts", description: "Get ranking and audit alerts where your team works.", status: "planned" },
]

const connectSteps: Step[] = [
  { icon: MousePointerClick, title: "Choose a source", body: "Pick Search Console from your workspace's integrations panel." },
  { icon: KeyRound, title: "Authorize with Google", body: "Sign in with the Google account that owns your properties." },
  { icon: CheckCircle2, title: "Select properties", body: "Pick the sites to bring into this workspace." },
  { icon: RefreshCw, title: "Data flows in", body: "Queries, pages and positions power every NXGSEO tool." },
]

export default function IntegrationsPage() {
  const available = integrations.filter((i) => i.status === "available")
  const planned = integrations.filter((i) => i.status === "planned")
  return (
    <>
      <PageHero
        eyebrow="Integrations"
        title={<>Connects to the data <span className="text-gradient">you already use</span></>}
        description="NXGSEO plugs into your Google data sources first — with more integrations on the way."
        breadcrumbs={[{ label: "Integrations" }]}
        highlights={[`${available.length} live integrations`, `${planned.length} on the roadmap`]}
      />

      <Section>
        <SectionHeading eyebrow="Available now" title="Live integrations" description="Ready to connect from any workspace." />
        <IntegrationGrid items={available} />

        <div className="mt-24">
          <SectionHeading eyebrow="Roadmap" title="Coming soon" description="Integrations we're building next." />
          <IntegrationGrid items={planned} />
        </div>

        <Reveal className="mt-14 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <PlugZap className="size-4 text-brand" />
          Need a specific integration?{" "}
          <Link href="/contact" className="font-semibold text-brand underline-offset-4 hover:underline">
            Let us know
          </Link>
          .
        </Reveal>
      </Section>

      <Section className="border-t border-border bg-muted/25">
        <SectionHeading eyebrow="Setup" title="Connecting Search Console" description="The first-party signal behind most of NXGSEO takes a few clicks to connect." />
        <div className="mt-16">
          <Steps steps={connectSteps} />
        </div>
      </Section>

      <CtaSection />
    </>
  )
}

function IntegrationGrid({ items }: { items: Integration[] }) {
  return (
    <Stagger className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => {
        const live = it.status === "available"
        return (
          <StaggerItem key={it.name} className="h-full">
            <div
              className={cn(
                "flex h-full flex-col rounded-3xl border bg-card p-6 transition-all duration-300",
                live ? "border-border hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-xl hover:shadow-brand/[0.07]" : "border-dashed border-border",
              )}
            >
              <div className="flex items-start justify-between">
                <div
                  className={cn(
                    "flex size-12 items-center justify-center rounded-2xl border",
                    live ? "border-brand/20 bg-gradient-to-b from-brand/15 to-brand/5 text-brand" : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  <it.icon className="size-6" />
                </div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                    live ? "bg-[var(--chart-pass)]/12 text-[var(--chart-pass)]" : "bg-muted text-muted-foreground",
                  )}
                >
                  {live ? <span className="size-1.5 rounded-full bg-current" /> : <Clock className="size-3" />}
                  {live ? "Available" : "Coming soon"}
                </span>
              </div>
              <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{it.category}</p>
              <h3 className="mt-1 font-heading text-lg font-semibold tracking-tight">{it.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.description}</p>
            </div>
          </StaggerItem>
        )
      })}
    </Stagger>
  )
}
