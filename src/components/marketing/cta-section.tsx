import Link from "next/link"
import { ArrowRight, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { Reveal } from "@/components/motion/reveal"

interface CtaSectionProps {
  title?: string
  description?: string
  primary?: { label: string; href: string }
  secondary?: { label: string; href: string }
}

const assurances = ["Free plan, no credit card", "Connect Search Console in minutes", "Cancel anytime"]

/** Final call-to-action band: deep indigo panel with grid, glow and assurances. */
export function CtaSection({
  title = "See what your site could rank for",
  description = "Start free with first-party keyword research, rank tracking and content optimization — no data resellers, no credit card.",
  primary = { label: "Start free", href: "/register" },
  secondary = { label: "Book a demo", href: "/demo" },
}: CtaSectionProps) {
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal amount={0.2}>
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[oklch(0.2_0.06_274)] px-6 py-16 text-center shadow-2xl shadow-brand/20 sm:px-16 sm:py-20">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.07)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(70%_80%_at_50%_0%,black,transparent)]" />
              <div className="absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-[oklch(0.6_0.22_274)] opacity-50 blur-3xl" />
              <div className="absolute -bottom-40 -right-20 h-72 w-72 rounded-full bg-[oklch(0.8_0.13_200)] opacity-25 blur-3xl" />
            </div>
            <h2 className="mx-auto max-w-2xl font-heading text-3xl font-bold tracking-tight text-balance text-white sm:text-5xl">
              {title}
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">{description}</p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                render={<Link href={primary.href} />}
                size="xl"
                className="bg-white px-6 text-[oklch(0.3_0.12_274)] shadow-lg shadow-black/20 hover:bg-white/90 focus-visible:ring-white/50"
              >
                {primary.label} <ArrowRight className="size-4" />
              </Button>
              <Button
                render={<Link href={secondary.href} />}
                size="xl"
                variant="outline"
                className="border-white/25 bg-white/5 px-6 text-white backdrop-blur hover:bg-white/10 hover:text-white dark:border-white/25 dark:bg-white/5"
              >
                {secondary.label}
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/70">
              {assurances.map((a) => (
                <li key={a} className="flex items-center gap-1.5">
                  <Check className="size-4 text-[oklch(0.82_0.13_200)]" /> {a}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  )
}
