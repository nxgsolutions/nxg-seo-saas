"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import * as React from "react"

/**
 * Reusable segmented tab switcher.
 *
 * - `variant="cards"`: icon chip + title + one-line description, for switching
 *   between PAGES of one section (reads as separate destinations).
 * - `variant="pills"`: compact icon + label, for VIEWS inside a page/panel.
 *
 * Each tab is a link when it has `href` (page navigation, gets
 * aria-current="page"), otherwise a button that calls `onChange(value)`
 * (role="tab" inside a tablist). Scrolls horizontally on narrow screens.
 *
 * @example Pages
 *   <SegmentedTabs variant="cards" value={pathname} items={[
 *     { value: "/a", href: "/a", label: "Audit", description: "Score a page", icon: Gauge },
 *   ]} />
 * @example Views
 *   <SegmentedTabs value={tab} onChange={setTab} items={[{ value: "metrics", label: "Metrics", icon: BarChart3 }]} />
 */
export interface SegmentedTabItem<T extends string = string> {
  value: T
  label: string
  icon?: LucideIcon
  /** Shown under the label in the "cards" variant. */
  description?: string
  /** Optional count badge after the label. */
  count?: number
  /** Makes the tab a link (page navigation) instead of a button. */
  href?: string
}

export function SegmentedTabs<T extends string>({
  items, value, onChange, variant = "pills", label = "Tabs", fill = false, className,
}: {
  items: SegmentedTabItem<T>[]
  value: T
  onChange?: (value: T) => void
  variant?: "cards" | "pills"
  /** Accessible name of the tab group. */
  label?: string
  /** Stretch tabs to fill the width equally. */
  fill?: boolean
  className?: string
}) {
  const asLinks = items.some((i) => i.href)
  const cards = variant === "cards"

  return (
    <div
      role={asLinks ? undefined : "tablist"}
      aria-label={label}
      className={cn(
        "segmented-tabs flex max-w-full gap-1 overflow-x-auto rounded-2xl border p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        fill ? "w-full" : "w-fit",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.value === value
        const Icon = item.icon
        const body = (
          <>
            {Icon && (
              <span data-chip={cards || undefined}
                className={cn("segmented-tabs-icon flex shrink-0 items-center justify-center", cards ? "size-8 rounded-lg" : "size-4")}>
                <Icon className="size-4" aria-hidden="true" />
              </span>
            )}
            <span className="min-w-0 text-left">
              <span className="flex items-center gap-1.5 whitespace-nowrap font-semibold">
                {item.label}
                {item.count != null && (
                  <span className="segmented-tabs-count rounded-full px-1.5 text-xs font-medium tabular-nums">{item.count}</span>
                )}
              </span>
              {cards && item.description && (
                <span className="block whitespace-nowrap text-xs font-normal text-muted-foreground">{item.description}</span>
              )}
            </span>
          </>
        )
        const cls = cn(
          "segmented-tab flex min-w-0 items-center gap-2.5 rounded-xl text-sm outline-none transition-[background-color,color,box-shadow]",
          cards ? "px-3 py-2 pr-5" : "px-3 py-1.5",
          fill && "flex-1 justify-center",
        )
        return item.href ? (
          <Link key={item.value} href={item.href} aria-current={active ? "page" : undefined}
            data-active={active || undefined} className={cls}>
            {body}
          </Link>
        ) : (
          <button key={item.value} type="button" role="tab" aria-selected={active}
            data-active={active || undefined} onClick={() => onChange?.(item.value)} className={cls}>
            {body}
          </button>
        )
      })}
    </div>
  )
}
