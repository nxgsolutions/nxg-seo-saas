import Link from "next/link"
import { ArrowRight, ChevronDown } from "lucide-react"

import { headerLinks, headerMenus, type NavGroup } from "@/config/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Container } from "./container"
import { Logo } from "./logo"
import { MobileNav } from "./mobile-nav"

/** Per-menu layout: wide two-column panels for Product/Solutions. */
const menuLayout: Record<string, { width: string; cols: string; feature?: { title: string; body: string; href: string; cta: string } }> = {
  Product: {
    width: "w-[46rem]",
    cols: "grid-cols-2",
    feature: {
      title: "First-party keyword research",
      body: "Ideas, intent and opportunity scores from Search Console, Autocomplete and the live SERP.",
      href: "/keyword-research",
      cta: "Explore",
    },
  },
  Solutions: { width: "w-[34rem]", cols: "grid-cols-2" },
  Resources: {
    width: "w-[30rem]",
    cols: "grid-cols-1",
    feature: { title: "Integrations", body: "Connect Google Search Console, Trends and more.", href: "/integrations", cta: "See all" },
  },
}

/**
 * Public site header. Server component — desktop mega-menus are CSS-only
 * (hover + focus-within), so no client JS is shipped for them. Only the mobile
 * drawer (<MobileNav>) is a client island.
 */
export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {headerMenus.map((menu) => (
            <MegaMenu key={menu.label} menu={menu} />
          ))}
          {headerLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button render={<Link href="/login" />} variant="ghost" size="lg" className="px-3">
            Log in
          </Button>
          <Button render={<Link href="/register" />} variant="brand" size="lg" className="px-4 shadow-md shadow-brand/25">
            Start free <ArrowRight className="size-3.5" />
          </Button>
        </div>

        <MobileNav />
      </Container>
    </header>
  )
}

function MegaMenu({ menu }: { menu: NavGroup }) {
  const layout = menuLayout[menu.label] ?? { width: "w-[26rem]", cols: "grid-cols-1" }
  return (
    <div className="group relative">
      <button
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand group-hover:bg-muted/60 group-hover:text-foreground"
        aria-haspopup="true"
      >
        {menu.label}
        <ChevronDown className="size-3.5 opacity-70 transition-transform duration-200 group-hover:rotate-180" />
      </button>
      {/* Panel — `pt-3` keeps a hover bridge to the trigger. */}
      <div
        className={cn(
          "invisible absolute left-1/2 top-full z-50 -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-200 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100",
          layout.width,
        )}
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-popover shadow-2xl shadow-black/10">
          <ul className={cn("grid gap-1 p-2", layout.cols)}>
            {menu.items.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="group/item flex gap-3 rounded-xl p-3 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                  >
                    {Icon ? (
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors group-hover/item:border-brand/30 group-hover/item:bg-brand/10 group-hover/item:text-brand">
                        <Icon className="size-4" />
                      </span>
                    ) : null}
                    <span>
                      <span className="block text-sm font-semibold">{item.label}</span>
                      {item.description ? (
                        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{item.description}</span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          {layout.feature ? (
            <Link
              href={layout.feature.href}
              className="group/f flex items-center justify-between gap-4 border-t border-border bg-muted/40 px-5 py-3.5 transition-colors hover:bg-muted"
            >
              <span>
                <span className="block text-sm font-semibold">{layout.feature.title}</span>
                <span className="block text-xs text-muted-foreground">{layout.feature.body}</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-brand">
                {layout.feature.cta} <ArrowRight className="size-3.5 transition-transform group-hover/f:translate-x-0.5" />
              </span>
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  )
}
