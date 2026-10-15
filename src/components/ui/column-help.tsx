"use client"

import { Tooltip } from "@base-ui/react/tooltip"
import { CircleHelp } from "lucide-react"
import type { ReactNode } from "react"

/** A small "?" after a column title; hover or keyboard focus shows what the
 * column means. Render it OUTSIDE any sort button (never a button in a button). */
export function ColumnHelp({ text, label }: { text: ReactNode; label?: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger
        render={<button type="button" />}
        aria-label={label ? `About ${label}` : "About this column"}
        className="inline-flex size-4 shrink-0 items-center justify-center rounded-full align-middle text-muted-foreground/70 outline-none transition-colors hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        <CircleHelp className="size-3.5" aria-hidden="true" />
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6} className="z-50">
          <Tooltip.Popup className="max-w-72 rounded-lg border border-border bg-popover px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-popover-foreground shadow-md">
            {text}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

/** Column title + its "?" help, for plain (non-sortable) headers. */
export function HeaderWithHelp({ children, help }: { children: ReactNode; help: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <ColumnHelp text={help} label={typeof children === "string" ? children : undefined} />
    </span>
  )
}
