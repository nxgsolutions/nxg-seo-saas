"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { ArrowRight, Check } from "lucide-react"

import { cn } from "@/lib/utils"

export interface ProductTab {
  id: string
  label: string
  /** Pre-rendered icon element (components can't cross the server/client boundary). */
  icon: React.ReactNode
  title: string
  body: string
  bullets: string[]
  href: string
  visual: React.ReactNode
}

/** Tabbed product tour: tab rail on top, copy + live-looking visual below. */
export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = React.useState(tabs[0]?.id)
  const reduce = useReducedMotion()
  const tab = tabs.find((t) => t.id === active) ?? tabs[0]
  const listRef = React.useRef<HTMLDivElement>(null)

  function onKeyDown(e: React.KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === active)
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null
    if (next === null) return
    e.preventDefault()
    const t = tabs[(next + tabs.length) % tabs.length]
    setActive(t.id)
    listRef.current?.querySelector<HTMLButtonElement>(`#tab-${t.id}`)?.focus()
  }

  return (
    <div>
      <div className="flex justify-center">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Product tour"
          onKeyDown={onKeyDown}
          className="scrollbar-hide flex max-w-full gap-1 overflow-x-auto rounded-2xl border border-border bg-muted/50 p-1.5"
        >
          {tabs.map((t) => {
            const selected = t.id === tab.id
            return (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(t.id)}
                className={cn(
                  "relative flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-brand",
                  selected ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId="product-tab-pill"
                    className="absolute inset-0 rounded-xl border border-border bg-card shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                ) : null}
                <span className={cn("relative [&_svg]:size-4", selected && "text-brand")}>{t.icon}</span>
                <span className="relative">{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_1.25fr] lg:gap-16"
          >
            <div>
              <h3 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">{tab.title}</h3>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">{tab.body}</p>
              <ul className="mt-7 space-y-3.5">
                {tab.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-[0.9375rem]">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                      <Check className="size-3" />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                href={tab.href}
                className="group mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-brand"
              >
                Explore {tab.label.toLowerCase()}
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <div className="relative">
              <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-brand/10 blur-2xl" />
              {tab.visual}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
