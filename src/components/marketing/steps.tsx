import type { LucideIcon } from "lucide-react"

import { Stagger, StaggerItem } from "@/components/motion/reveal"

export interface Step {
  icon: LucideIcon
  title: string
  body: string
}

/** Numbered "how it works" workflow with a connecting rail on large screens. */
export function Steps({ steps }: { steps: Step[] }) {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent lg:block"
      />
      <Stagger className="relative grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => {
          const Icon = step.icon
          return (
            <StaggerItem key={step.title}>
              <div className="flex h-full flex-col items-center text-center">
                <div className="relative flex size-14 items-center justify-center rounded-2xl border border-brand/20 bg-card text-brand shadow-lg shadow-brand/10">
                  <Icon className="size-6" />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-brand font-mono text-[10px] font-bold text-brand-foreground ring-4 ring-background">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight">{step.title}</h3>
                <p className="mt-2 max-w-60 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </StaggerItem>
          )
        })}
      </Stagger>
    </div>
  )
}
