"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"

/** The standard search/filter field used across the dashboard: leading search
 * icon, consistent height, the theme's focus glow. */
export function SearchInput({
  value, onValueChange, placeholder = "Search…", className, "aria-label": ariaLabel, size = "md",
}: {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  "aria-label"?: string
  /** md = 36px (table filters), lg = 40px (page-level search) */
  size?: "md" | "lg"
}) {
  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" value={value} onChange={(e) => onValueChange(e.target.value)} placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder} className={cn("pl-9", size === "lg" ? "h-10" : "h-9")} />
    </div>
  )
}
