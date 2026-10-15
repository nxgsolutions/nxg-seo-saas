"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowRight, ArrowUpRight, ChevronDown, ScanSearch, Sparkles } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { brand } from "@/config/brand"
import { cn } from "@/lib/utils"

const productGroups = [
  {
    title: "AI Search & AEO",
    featured: true,
    description: "Explore the next chapter of search.",
    items: [
      { name: "AI Visibility", description: "Explore visibility in AI answer engines.", href: "/dashboard/ai-search" },
      { name: "Content Optimization", description: "Turn content insights into stronger pages.", href: "/dashboard/content-optimization" },
    ],
  },
  {
    title: "Analyze",
    items: [
      { name: "Keyword Analysis", description: "Find the terms your audience searches for.", href: "/dashboard/keyword-analysis" },
      { name: "Competitive Strategy", description: "Discover gaps and new opportunities.", href: "/dashboard/competitive-strategy" },
      { name: "Page Audit", description: "Find SEO issues and prioritize your fixes.", href: "/dashboard/page-audit" },
    ],
  },
  {
    title: "Optimize",
    items: [
            { name: "Title & Meta", description: "Write titles and meta tags with a live search preview.", href: "/dashboard/meta-tags" },
      { name: "Crawlability", description: "Review crawling and indexing signals.", href: "/dashboard/robots" },
    ],
  },
  {
    title: "Measure",
    items: [
      { name: "Search Performance", description: "Bring Search Console insights together.", href: "/dashboard/search-performance" },
      { name: "Rank Tracking", description: "Follow your keyword positions over time.", href: "/dashboard/rankings" },
      { name: "Reports", description: "Turn audit results into shareable reports.", href: "/dashboard/reports" },
    ],
  },
  {
    title: "Your workspace",
    items: [
      { name: "Overview", description: "Your search health, all in one place.", href: "/dashboard" },
            { name: "Team", description: "Bring your team into the workspace.", href: "/dashboard/team" },
      { name: "Settings & Integrations", description: "Connect services and set preferences.", href: "/dashboard/settings" },
    ],
  },
]

export function PublicHeader() {
  const [productsOpen, setProductsOpen] = React.useState(false)
  const headerRef = React.useRef<HTMLElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const [previousPath, setPreviousPath] = React.useState(pathname)
  const menuId = React.useId()

  if (pathname !== previousPath) {
    setPreviousPath(pathname)
    setProductsOpen(false)
  }

  function cancelClose() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }

  function closeProducts() {
    cancelClose()
    setProductsOpen(false)
  }

  React.useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }, [])

  React.useEffect(() => {
    if (!productsOpen) return
    const dismiss = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setProductsOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setProductsOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener("pointerdown", dismiss)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", dismiss)
      document.removeEventListener("keydown", escape)
    }
  }, [productsOpen])

  return (
    <header
      ref={headerRef}
      onPointerEnter={cancelClose}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse" && !headerRef.current?.contains(document.activeElement)) {
          cancelClose()
          closeTimer.current = setTimeout(() => setProductsOpen(false), 180)
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) closeProducts()
      }}
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl"
    >
      <a href="#main-content" className="absolute left-4 top-3 -translate-y-24 rounded-lg bg-primary px-4 py-3 text-sm text-primary-foreground focus:translate-y-0">Skip to content</a>
      <div className="mx-auto flex min-h-20 w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-4 px-4 sm:px-8 lg:min-h-24 lg:px-12">
        <Link href="/" onClick={closeProducts} aria-label={`${brand.name} home`} className="flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <span className="flex size-10 items-center justify-center rounded-xl bg-brand text-brand-foreground"><ScanSearch className="size-6" aria-hidden="true" /></span>
          <span className="font-heading text-base font-extrabold tracking-tight sm:text-xl">{brand.name}</span>
        </Link>
        <nav aria-label="Main navigation" className="order-3 flex w-full items-center justify-between gap-2 border-t border-border py-1 text-sm font-medium text-muted-foreground lg:order-none lg:w-auto lg:justify-start lg:gap-7 lg:border-0 lg:py-0">
          <button
            ref={triggerRef}
            type="button"
            aria-expanded={productsOpen}
            aria-controls={menuId}
            onClick={() => { cancelClose(); setProductsOpen((open) => !open) }}
            onPointerEnter={(event) => { if (event.pointerType === "mouse") { cancelClose(); setProductsOpen(true) } }}
            className={cn("inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg px-2 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand", productsOpen && "text-brand")}
          >
            Products <ChevronDown aria-hidden="true" className={cn("size-3.5 transition-transform motion-reduce:transition-none", productsOpen && "rotate-180")} />
          </button>
          {/* Keep the panel after its trigger in DOM order for keyboard navigation. */}
          <div id={menuId} hidden={!productsOpen} className="absolute inset-x-3 top-full pt-2 sm:inset-x-6 lg:inset-x-10">
            <div className="mx-auto max-h-[calc(100dvh-10rem)] max-w-[1320px] overflow-y-auto overscroll-contain rounded-2xl border border-border bg-popover text-popover-foreground shadow-[0_20px_60px_-16px_rgb(0_0_0/0.3)]">
              <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7 lg:grid-cols-5 lg:gap-0 lg:p-6">
                {productGroups.map((group) => (
                  <section key={group.title} aria-label={group.title} className={cn("min-w-0 lg:px-5", group.featured ? "rounded-xl bg-brand/5 p-4 lg:p-5" : "lg:border-l lg:border-border lg:first:border-0", group.title === "Analyze" && "lg:border-l-0")}>
                    <h2 className="mb-4 flex items-center gap-1.5 text-xs font-bold tracking-wide text-brand">
                      {group.featured && <Sparkles className="size-4" aria-hidden="true" />}{group.title}
                    </h2>
                    <ul className="flex flex-col gap-1">
                      {group.items.map((item) => (
                        <li key={item.href}>
                          <Link href={item.href} prefetch={false} onClick={closeProducts} className="group -mx-2 block rounded-lg px-2 py-2.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-2 focus-visible:outline-brand">
                            <span className="flex items-center justify-between gap-1 text-[13px] font-semibold leading-5 text-foreground group-hover:text-brand">{item.name}<ArrowUpRight aria-hidden="true" className="size-3.5 shrink-0 text-brand opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" /></span>
                            <span className="mt-1 block text-xs font-normal leading-relaxed text-muted-foreground">{item.description}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {group.featured && <p className="mt-6 border-t border-brand/15 pt-4 text-xs font-normal leading-relaxed text-muted-foreground">{group.description}</p>}
                  </section>
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-4 sm:px-7">
                <Link href="/#tools" onClick={closeProducts} className="inline-flex min-h-9 items-center gap-2 rounded-md text-xs font-semibold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-brand">Explore all tools <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
                <div className="flex flex-wrap items-center gap-3"><span className="text-xs font-normal text-muted-foreground">Your next opportunity starts here.</span><Link href="/register" onClick={closeProducts} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:opacity-85">Get started <ArrowUpRight className="size-3.5" aria-hidden="true" /></Link></div>
              </div>
            </div>
          </div>
          <Link href="/#why" onClick={closeProducts} onPointerEnter={closeProducts} className="inline-flex min-h-11 items-center rounded-md px-2 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">Solutions</Link>
          <Link href="/#pricing" onClick={closeProducts} onPointerEnter={closeProducts} className="inline-flex min-h-11 items-center rounded-md px-2 hover:text-brand focus-visible:outline-2 focus-visible:outline-brand">Pricing</Link>
          <Link href="/login" onClick={closeProducts} className="inline-flex min-h-11 items-center px-2 text-foreground sm:hidden">Log in <ArrowUpRight className="ml-1 size-3" aria-hidden="true" /></Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle prominent />
          <Link href="/login" onClick={closeProducts} className="hidden rounded-lg px-2 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground sm:inline-flex">Log in</Link>
          <Link href="/register" onClick={closeProducts} className="hidden min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-85 sm:inline-flex">Get started <ArrowUpRight className="size-4" aria-hidden="true" /></Link>
        </div>
      </div>
    </header>
  )
}
