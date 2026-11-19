"use client"

/**
 * Combobox — a reusable search-and-select dropdown (shadcn pattern, themed).
 *
 * The app's Base UI `Popover` hosts a cmdk `Command` list. Pick an option and
 * `onSelect(value)` fires — there is no internal "add"; the caller decides what
 * selecting means (e.g. push a chip). Already-selected / excluded values are
 * hidden, and the control renders explicit loading / error / empty / no-results
 * states.
 *
 * Reuse it anywhere a typed search over a known set of options is needed.
 */
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import * as React from "react"

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface ComboboxOption {
  value: string
  label?: string
  /** Muted note shown on the right of the row, e.g. "12.4%". */
  hint?: string
  icon?: React.ReactNode
  /** Section heading; when any option has one, the list is grouped. */
  group?: string
}

export function Combobox({
  options,
  onSelect,
  value,
  exclude,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyLabel = "No options.",
  noResultsLabel = "No matches found.",
  loading = false,
  error = null,
  disabled = false,
  className,
  contentClassName,
}: {
  options: ComboboxOption[]
  onSelect: (value: string) => void
  /** Current value shown in the trigger (optional — a pick-only combobox omits it). */
  value?: string | null
  /** Values to hide from the list (e.g. already-selected competitors). */
  exclude?: string[]
  placeholder?: string
  searchPlaceholder?: string
  emptyLabel?: string
  noResultsLabel?: string
  loading?: boolean
  error?: string | null
  disabled?: boolean
  className?: string
  contentClassName?: string
}) {
  const [open, setOpen] = React.useState(false)
  const excludeSet = React.useMemo(
    () => new Set(exclude ?? []),
    [exclude],
  )
  const visible = React.useMemo(
    () => options.filter((o) => !excludeSet.has(o.value)),
    [options, excludeSet],
  )
  const grouped = visible.some((o) => o.group)
  const groups = React.useMemo(() => {
    const map = new Map<string, ComboboxOption[]>()
    for (const o of visible) {
      const g = grouped ? (o.group ?? "Other") : ""
      map.set(g, [...(map.get(g) ?? []), o])
    }
    return [...map.entries()]
  }, [visible, grouped])

  const selectedLabel = value
    ? (options.find((o) => o.value === value)?.label ?? value)
    : null

  const handleSelect = (v: string) => {
    onSelect(v)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        render={
          <button
            type="button"
            aria-expanded={open}
            className={cn(
              "inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:border-primary disabled:cursor-not-allowed disabled:opacity-50",
              className,
            )}
          >
            <span
              className={cn(
                "truncate",
                selectedLabel ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {selectedLabel ?? placeholder}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <PopoverContent
        align="start"
        className={cn(
          "w-[max(var(--anchor-width),18rem)] p-0",
          contentClassName,
        )}
      >
        <Command
          // Values are unique domains; match on the row's own value/label text.
          filter={(itemValue, search) =>
            itemValue.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
          }
        >
          <CommandInput placeholder={searchPlaceholder} autoFocus />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading…
              </div>
            ) : error ? (
              <div className="px-3 py-6 text-center text-sm text-destructive">
                {error}
              </div>
            ) : visible.length === 0 ? (
              <CommandEmpty>{emptyLabel}</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>{noResultsLabel}</CommandEmpty>
                {groups.map(([heading, items]) => (
                  <CommandGroup key={heading || "_"} heading={heading || undefined}>
                    {items.map((o) => (
                      <CommandItem
                        key={o.value}
                        value={o.label ? `${o.value} ${o.label}` : o.value}
                        onSelect={() => handleSelect(o.value)}
                      >
                        {o.icon}
                        <span className="min-w-0 flex-1 truncate" title={o.value}>
                          {o.label ?? o.value}
                        </span>
                        {o.hint && (
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {o.hint}
                          </span>
                        )}
                        {value === o.value && (
                          <Check className="size-4 shrink-0 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
