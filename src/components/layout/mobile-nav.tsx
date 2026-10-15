"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronDown, Menu, X } from "lucide-react"

import { headerLinks, headerMenus } from "@/config/navigation"
import { Button } from "@/components/ui/button"
import { Logo } from "./logo"
import { cn } from "@/lib/utils"

/** Mobile navigation: hamburger trigger + full-screen drawer with accordions. */
export function MobileNav() {
  const [open, setOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState<string | null>(headerMenus[0]?.label ?? null)
  const pathname = usePathname()

  // Close on route change.
  const [prevPath, setPrevPath] = React.useState(pathname)
  if (pathname !== prevPath) {
    setPrevPath(pathname)
    if (open) setOpen(false)
  }

  // Lock body scroll + close on Escape while open.
  React.useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div className="lg:hidden">
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="size-5" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Logo />
            <Button variant="ghost" size="icon-lg" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="size-5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4" aria-label="Mobile">
            {headerMenus.map((menu) => {
              const isOpen = expanded === menu.label
              return (
                <div key={menu.label} className="border-b border-border/60">
                  <button
                    className="flex w-full items-center justify-between py-3.5 text-left text-base font-semibold"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : menu.label)}
                  >
                    {menu.label}
                    <ChevronDown className={cn("size-5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                  </button>
                  {isOpen ? (
                    <ul className="pb-3">
                      {menu.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            {item.icon ? (
                              <span className="flex size-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                                <item.icon className="size-4" />
                              </span>
                            ) : null}
                            <span className="font-medium text-foreground">{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )
            })}

            {headerLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block border-b border-border/60 py-3.5 text-base font-semibold"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="grid gap-2 border-t border-border p-4">
            <Button render={<Link href="/login" />} variant="outline" size="xl" className="w-full">
              Log in
            </Button>
            <Button render={<Link href="/register" />} variant="brand" size="xl" className="w-full">
              Start free
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
