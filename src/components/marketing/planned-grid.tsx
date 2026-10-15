import { Clock, type LucideIcon } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion/reveal"

export interface PlannedItem {
  category: string
  title: string
  body: string
  icon?: LucideIcon
}

/**
 * Grid of upcoming content, clearly marked "In progress" — shows what's
 * coming without pretending the pieces are already published.
 */
export function PlannedGrid({ items }: { items: PlannedItem[] }) {
  return (
    <Stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <StaggerItem key={it.title} className="h-full">
          <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-card">
            <div className="relative h-36 overflow-hidden border-b border-border bg-muted/40">
              <div aria-hidden className="absolute inset-0 bg-grid opacity-60 [mask-image:radial-gradient(closest-side,black,transparent)]" />
              <div aria-hidden className="absolute -right-10 -top-10 size-40 rounded-full bg-brand/20 blur-2xl" />
              {it.icon ? (
                <span className="absolute left-6 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-brand/20 bg-card text-brand shadow-lg shadow-brand/10">
                  <it.icon className="size-6" />
                </span>
              ) : null}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand">{it.category}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <Clock className="size-3" /> In progress
                </span>
              </div>
              <h3 className="mt-3 font-heading text-lg font-semibold leading-snug tracking-tight">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.body}</p>
            </div>
          </article>
        </StaggerItem>
      ))}
    </Stagger>
  )
}
