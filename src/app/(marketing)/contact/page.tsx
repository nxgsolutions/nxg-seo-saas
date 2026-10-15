import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CalendarDays, LifeBuoy, Mail, MessageSquare } from "lucide-react"

import { site } from "@/config/site"
import { createMetadata } from "@/config/seo"
import { ContactForm } from "@/components/marketing/contact-form"
import { ContactLayout } from "@/components/marketing/contact-layout"

export const metadata: Metadata = createMetadata({
  title: "Contact",
  description: "Get in touch with the NXGSEO team — sales, support or general questions.",
  path: "/contact",
})

const channels = [
  { icon: MessageSquare, title: "Sales", body: "Plans, Enterprise quotes and rollouts.", href: `mailto:${site.contact.sales}`, cta: site.contact.sales },
  { icon: LifeBuoy, title: "Support", body: "Help with your workspace or data connections.", href: `mailto:${site.contact.email}`, cta: site.contact.email },
  { icon: CalendarDays, title: "Product demo", body: "A walkthrough tailored to your sites.", href: "/demo", cta: "Book a demo" },
]

export default function ContactPage() {
  return (
    <ContactLayout
      eyebrow="Contact"
      title="Talk to the NXGSEO team"
      description="Questions about the product, pricing or a rollout? Send a note and we'll get back to you."
      breadcrumbs={[{ label: "Contact" }]}
      form={<ContactForm />}
      aside={
        <ul className="grid gap-3">
          {channels.map((c) => {
            const external = c.href.startsWith("mailto:")
            const inner = (
              <>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-brand/20 bg-brand/10 text-brand">
                  <c.icon className="size-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-heading font-semibold">{c.title}</span>
                  <span className="block text-sm text-muted-foreground">{c.body}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-brand">
                    {external ? <Mail className="size-3.5" /> : null}
                    {c.cta}
                    {!external ? <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" /> : null}
                  </span>
                </span>
              </>
            )
            const cls = "group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-colors hover:border-brand/35"
            return (
              <li key={c.title}>
                {external ? (
                  <a href={c.href} className={cls}>{inner}</a>
                ) : (
                  <Link href={c.href} className={cls}>{inner}</Link>
                )}
              </li>
            )
          })}
        </ul>
      }
    />
  )
}
