import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * Slim announcement bar above the header. Server component — static content.
 * Keep it optional and low-noise; one message, one link.
 */
export function AnnouncementBar() {
  return (
    <div className="relative z-40 overflow-hidden bg-[oklch(0.2_0.06_274)] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(40% 200% at 50% 0%, oklch(0.55 0.21 274 / 0.6), transparent)" }}
      />
      <Link
        href="/keyword-research"
        className="group relative mx-auto flex max-w-7xl items-center justify-center gap-2.5 px-4 py-2 text-center text-[13px]"
      >
        <span className="hidden rounded-full bg-white/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider sm:inline">
          New
        </span>
        <span className="font-medium text-white/90">
          First-party keyword research<span className="hidden sm:inline"> — no data resellers, no per-keyword fees</span>.
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-[oklch(0.85_0.11_200)]">
          Learn more <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </div>
  )
}
