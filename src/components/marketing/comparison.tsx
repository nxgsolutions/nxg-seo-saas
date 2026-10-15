import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/layout/logo"

export interface CompareRow {
  label: string
  us: boolean
  them: boolean
  /** Optional clarifying note shown under the label. */
  note?: string
}

interface ComparisonProps {
  rows: CompareRow[]
  usLabel?: string
  themLabel?: string
}

/** Factual "us vs typical tools" table. Our column is raised and highlighted. */
export function Comparison({ rows, usLabel = "NXGSEO", themLabel = "Typical SEO suites" }: ComparisonProps) {
  return (
    <div className="mx-auto max-w-4xl overflow-x-auto pb-2">
      <div className="min-w-[560px] rounded-3xl border border-border bg-card p-2">
        <div className="grid grid-cols-[1fr_9rem_9rem] items-end sm:grid-cols-[1fr_11rem_11rem]">
          <div className="px-5 pb-4 pt-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capability</div>
          <div className="rounded-t-2xl bg-brand/[0.08] px-3 pb-4 pt-5 text-center">
            <span className="inline-flex items-center gap-2 font-heading text-sm font-bold text-brand">
              <BrandMark className="size-6 rounded-md [&_svg]:size-4" />
              {usLabel}
            </span>
          </div>
          <div className="px-3 pb-4 pt-5 text-center text-sm font-semibold text-muted-foreground">{themLabel}</div>
        </div>
        {rows.map((r, i) => (
          <div
            key={r.label}
            className="grid grid-cols-[1fr_9rem_9rem] items-center border-t border-border sm:grid-cols-[1fr_11rem_11rem]"
          >
            <div className="px-5 py-4">
              <p className="text-sm font-medium">{r.label}</p>
              {r.note ? <p className="mt-0.5 text-xs text-muted-foreground">{r.note}</p> : null}
            </div>
            <div className={cn("flex h-full items-center justify-center bg-brand/[0.08]", i === rows.length - 1 && "rounded-b-2xl")}>
              <Cell on={r.us} strong />
            </div>
            <div className="flex items-center justify-center">
              <Cell on={r.them} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Cell({ on, strong }: { on: boolean; strong?: boolean }) {
  return on ? (
    <span
      className={cn(
        "flex size-7 items-center justify-center rounded-full",
        strong ? "bg-brand text-brand-foreground shadow-md shadow-brand/30" : "bg-muted text-foreground/70",
      )}
    >
      <Check className="size-4" aria-label="Included" />
    </span>
  ) : (
    <Minus className="size-5 text-muted-foreground/40" aria-label="Not included" />
  )
}
