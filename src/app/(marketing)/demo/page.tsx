import type { Metadata } from "next"
import { Check, MonitorPlay, Target, Users } from "lucide-react"

import { createMetadata } from "@/config/seo"
import { ContactForm } from "@/components/marketing/contact-form"
import { ContactLayout } from "@/components/marketing/contact-layout"

export const metadata: Metadata = createMetadata({
  title: "Book a Demo",
  description: "See NXGSEO in action. Request a walkthrough tailored to your team and sites.",
  path: "/demo",
})

const points = [
  "A walkthrough tailored to your sites and goals",
  "How first-party keyword research works in practice",
  "Rank tracking, content optimization and reporting",
  "Answers on pricing, onboarding and rollout",
]

const facts = [
  { icon: Target, label: "Tailored to your sites" },
  { icon: MonitorPlay, label: "Live walkthrough" },
  { icon: Users, label: "Bring your team" },
]

export default function DemoPage() {
  return (
    <ContactLayout
      eyebrow="Book a demo"
      title={<>See NXGSEO <span className="text-gradient">in action</span></>}
      description="Request a walkthrough and we'll show you how NXGSEO fits your team — built on data you own."
      breadcrumbs={[{ label: "Book a demo" }]}
      form={<ContactForm demo />}
      aside={
        <>
          <div className="flex flex-wrap gap-2">
            {facts.map((f) => (
              <span key={f.label} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium">
                <f.icon className="size-4 text-brand" />
                {f.label}
              </span>
            ))}
          </div>
          <div className="mt-8 rounded-3xl border border-border bg-card p-6">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">What we&apos;ll cover</p>
            <ul className="mt-5 space-y-4">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground">
                    <Check className="size-3" />
                  </span>
                  <span className="text-foreground/90">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      }
    />
  )
}
