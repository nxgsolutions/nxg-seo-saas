import Link from "next/link"

import { site } from "@/config/site"
import { footerColumns, legalLinks } from "@/config/navigation"
import { Container } from "./container"
import { Logo } from "./logo"

const social = [
  {
    label: "X (Twitter)",
    href: site.social.twitterUrl,
    path: "M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8.1-9.3L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.7L6.4 3.9H4.6L17.7 20Z",
  },
  {
    label: "LinkedIn",
    href: site.social.linkedin,
    path: "M20.4 20.5h-3.6v-5.6c0-1.3 0-3-1.8-3s-2.1 1.4-2.1 2.9v5.7H9.3V9h3.4v1.6h.1c.5-.9 1.6-1.8 3.4-1.8 3.6 0 4.3 2.4 4.3 5.5v6.2ZM5.3 7.4a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2ZM7.1 20.5H3.5V9h3.6v11.5Z",
  },
  {
    label: "GitHub",
    href: site.social.github,
    path: "M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.4 9.4 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z",
  },
]

/** Public site footer — server component. */
export function Footer() {
  return (
    <footer className="relative border-t border-border bg-muted/30">
      <Container className="pt-4">
        <div className="grid grid-cols-2 gap-10 py-14 sm:grid-cols-3 lg:grid-cols-6">
          {/* Brand column */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {site.tagline}. Rank higher across search and AI answers with first-party data you own.
            </p>
            <ul className="mt-6 flex items-center gap-2">
              {social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    aria-label={s.label}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
                      <path d={s.path} />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Link columns */}
          {footerColumns.map((col) => (
            <nav key={col.label} aria-label={col.label}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/70">{col.label}</h3>
              <ul className="mt-4 space-y-3">
                {col.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col items-start justify-between gap-4 border-t border-border py-6 sm:flex-row sm:items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
          <ul className="flex items-center gap-5">
            {legalLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-sm text-muted-foreground hover:text-foreground">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>

      {/* Oversized wordmark */}
      <div aria-hidden className="pointer-events-none select-none overflow-hidden">
        <p className="-mb-[0.22em] text-center font-heading text-[clamp(5rem,20vw,17rem)] font-bold leading-none tracking-tighter bg-gradient-to-b from-foreground/[0.07] to-transparent bg-clip-text text-transparent">
          {site.name}
        </p>
      </div>
    </footer>
  )
}
