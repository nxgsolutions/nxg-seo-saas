import { Crosshair, FileSearch, Globe, Search, Sparkles, TrendingUp, type LucideIcon } from "lucide-react"

/**
 * "Built on" strip. Rather than placeholder customer logos, it lists the real
 * first-party data sources NXGSEO reads from, as a slow marquee.
 */
const sources: { icon: LucideIcon; label: string }[] = [
  { icon: Search, label: "Google Search Console" },
  { icon: TrendingUp, label: "Google Trends" },
  { icon: Sparkles, label: "Google Autocomplete" },
  { icon: Globe, label: "Live SERP snapshots" },
  { icon: FileSearch, label: "Your site crawl" },
  { icon: Crosshair, label: "On-page analysis" },
]

export function LogoStrip({ label = "Powered by first-party signals you already own" }: { label?: string }) {
  const items = [...sources, ...sources]
  return (
    <div>
      <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div className="mk-marquee-wrap relative mt-7 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="mk-marquee flex w-max gap-4">
          {items.map((s, i) => (
            <li
              key={i}
              aria-hidden={i >= sources.length}
              className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-border bg-card/70 px-5 py-2.5 text-sm font-semibold text-foreground/75"
            >
              <s.icon className="size-4 text-brand" />
              {s.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
