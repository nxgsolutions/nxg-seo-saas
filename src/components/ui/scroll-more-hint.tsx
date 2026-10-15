"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Floating "more below" chevron for a pane whose scrollbar is hidden.
 * Render it inside a `relative` wrapper that does NOT scroll, as a sibling of
 * the scrolling element. Visible only while there is content below the fold;
 * clicking scrolls down most of one screen.
 */
export function ScrollMoreHint({ target, className }: { target: React.RefObject<HTMLElement | null>; className?: string }) {
  const [more, setMore] = React.useState(false)

  React.useEffect(() => {
    const el = target.current
    if (!el) return
    const update = () => setMore(el.scrollHeight - el.clientHeight - el.scrollTop > 8)
    // Content height changes after async loads (SERP, charts) without a scroll event,
    // so watch the pane and each of its children, re-attaching when children change.
    const resize = new ResizeObserver(update)
    const observeChildren = () => {
      resize.disconnect()
      resize.observe(el)
      for (const child of Array.from(el.children)) resize.observe(child)
      update()
    }
    const mutations = new MutationObserver(observeChildren)
    observeChildren()
    mutations.observe(el, { childList: true })
    el.addEventListener("scroll", update, { passive: true })
    return () => { el.removeEventListener("scroll", update); resize.disconnect(); mutations.disconnect() }
  }, [target])

  return <button
    type="button"
    tabIndex={-1}
    aria-hidden={!more}
    aria-label="Scroll down for more"
    title="More below"
    onClick={() => {
      const el = target.current
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      el?.scrollBy({ top: el.clientHeight * 0.8, behavior: reduce ? "auto" : "smooth" })
    }}
    className={cn(
      "absolute bottom-3 left-1/2 z-10 grid size-8 -translate-x-1/2 place-items-center rounded-full border bg-background/90 text-muted-foreground shadow-md backdrop-blur transition-all duration-200 hover:text-foreground",
      more ? "opacity-100" : "pointer-events-none translate-y-2 opacity-0",
      className,
    )}
  >
    <ChevronDown className="size-4 motion-safe:animate-bounce" />
  </button>
}
