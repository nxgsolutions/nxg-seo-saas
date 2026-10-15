"use client"

import { Popover } from "@base-ui/react/popover"
import { CircleHelp } from "lucide-react"
import type { ReactNode } from "react"

/**
 * A small "?" button next to a page title. Click (or keyboard-activate) opens a
 * popover with a brief "what this page does" explanation. Use for the one-line
 * orientation a first-time user needs — keep the content short.
 */
export function PageHelp({ title, children, label }: {
  /** Bold heading shown at the top of the popover (e.g. the page name). */
  title?: ReactNode
  /** The explanation body. */
  children: ReactNode
  /** Accessible name for the trigger; defaults to "About this page". */
  label?: string
}) {
  return (
    <Popover.Root>
      <Popover.Trigger
        render={<button type="button" />}
        aria-label={label ? `About ${label}` : "About this page"}
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground/70 outline-none transition-colors hover:bg-muted hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-ring/50 data-[popup-open]:bg-muted data-[popup-open]:text-primary"
      >
        <CircleHelp className="size-[18px]" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="start" className="z-50 outline-none">
          <Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] origin-[var(--transform-origin)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg outline-none transition-[opacity,transform] duration-150 data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CircleHelp className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                {title ? <p className="text-sm font-semibold leading-tight">{title}</p> : null}
                <div className="text-[13px] font-normal leading-relaxed tracking-normal text-muted-foreground">
                  {children}
                </div>
              </div>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
