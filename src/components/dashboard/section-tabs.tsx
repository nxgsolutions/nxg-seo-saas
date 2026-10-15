"use client"

import { usePathname } from "next/navigation"

import { SegmentedTabs } from "@/components/ui/segmented-tabs"
import { tabGroupFor } from "@/config/nav"

/** Page switcher for pages that share one menu item (e.g. Audit · Fix plan),
 * styled as "cards" so each tab reads as its own page. Renders nothing on
 * pages that aren't part of a group (groups live in config/nav.ts). */
export function SectionTabs() {
  const pathname = usePathname()
  const tabs = tabGroupFor(pathname)
  if (!tabs) return null
  const active = tabs.find((t) => pathname.startsWith(t.href))?.href ?? tabs[0].href
  return (
    <nav aria-label="Section pages" className="mb-6">
      <SegmentedTabs variant="cards" label="Section pages" value={active}
        items={tabs.map((t) => ({ value: t.href, href: t.href, label: t.label, description: t.description, icon: t.icon }))} />
    </nav>
  )
}
