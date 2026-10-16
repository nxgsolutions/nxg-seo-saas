"use client"

import { Autocomplete } from "@base-ui/react/autocomplete"
import { Link2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

/** Lowercase + strip accents so matching ignores case and diacritics. */
function fold(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

/**
 * Substring match: every whitespace-separated word the user typed must appear
 * somewhere in the URL. Typing "syllabus" lists every URL containing it, and
 * "upsc syllabus" matches "…/upsc-cse-syllabus" (words can be apart) — unlike a
 * strict prefix or contiguous match.
 */
function matchesQuery(item: string, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  const hay = fold(item)
  return fold(q).split(/\s+/).every((word) => hay.includes(word))
}

/**
 * A searchable URL field: free text is always allowed (type any URL), and the
 * `items` are shown as filtered suggestions you can pick with mouse or keyboard.
 * Replaces the native <datalist>, whose dropdown can't be searched or styled.
 */
export function UrlCombobox({
  value,
  onValueChange,
  items,
  placeholder,
  disabled,
  invalid,
  id,
  "aria-label": ariaLabel,
}: {
  value: string
  onValueChange: (value: string) => void
  items: string[]
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  id?: string
  "aria-label"?: string
}) {
  return (
    <Autocomplete.Root
      items={items}
      value={value}
      onValueChange={(v) => onValueChange(v)}
      filter={(item, query) => matchesQuery(String(item), query)}
      openOnInputClick
      disabled={disabled}
    >
      <div className="relative">
        <Link2 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        {/* Render the shared Input so the focus ring is identical to the
            Target keyword field; only height and the left padding differ. */}
        <Autocomplete.Input
          render={<Input />}
          id={id}
          aria-label={ariaLabel}
          placeholder={placeholder}
          inputMode="url"
          autoComplete="off"
          aria-invalid={invalid || undefined}
          className="h-11 pr-3 pl-9"
        />
      </div>

      <Autocomplete.Portal>
        <Autocomplete.Positioner className="z-50 outline-none" sideOffset={6}>
          <Autocomplete.Popup
            className={cn(
              "flex max-h-[min(22rem,var(--available-height))] w-[var(--anchor-width)] max-w-[var(--available-width)] flex-col overflow-hidden",
              "rounded-xl border border-border bg-popover text-popover-foreground shadow-lg outline-none",
              "origin-[var(--transform-origin)] transition-[transform,opacity] data-[starting-style]:scale-95 data-[starting-style]:opacity-0 data-[ending-style]:scale-95 data-[ending-style]:opacity-0",
            )}
          >
            <div className="shrink-0 border-b border-border/70 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Select a page
            </div>
            {/* Empty must stay mounted for screen readers; the padded message is
                an inner node so the wrapper collapses to 0 height when matches exist. */}
            <Autocomplete.Empty>
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matching pages. Press Enter to use what you typed.
              </p>
            </Autocomplete.Empty>
            <Autocomplete.List className="min-h-0 overflow-y-auto overscroll-contain p-1">
              {(item: string) => (
                <Autocomplete.Item
                  key={item}
                  value={item}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-sm outline-none select-none",
                    "data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground",
                  )}
                >
                  <Link2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  {/* Full URL: wrap to up to two lines (breaking long paths) before truncating. */}
                  <span className="line-clamp-2 break-all leading-snug">{item}</span>
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  )
}
