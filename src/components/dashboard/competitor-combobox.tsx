"use client"

import { Autocomplete } from "@base-ui/react/autocomplete"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Globe, Loader2 } from "lucide-react"
import * as React from "react"

export type CompetitorTag = "you" | "competitor" | "stored" | "suggested"

export interface CompetitorOption {
  domain: string
  tag?: CompetitorTag
  /** Short muted note on the right, e.g. "120 kw · 3d ago". */
  hint?: string
  /** Section heading. When any option has one, the list is grouped (in first-seen
   * order) like a command menu, and per-row tags are hidden — the heading says it. */
  group?: string
}

const TAG_LABEL: Record<CompetitorTag, string> = {
  you: "you",
  competitor: "your competitor",
  stored: "saved ✓",
  suggested: "suggested",
}

/** "https://www.Example.com/path" -> "example.com" */
export function normalizeDomain(raw: string): string {
  return raw.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#\s]/)[0]
}

/**
 * Competitor domain picker: type any domain, or pick from your competitors /
 * stored domains. Enter (or the action button) submits the typed domain;
 * choosing a suggestion submits it immediately. Renders its own <form>.
 *
 * Pass `value` (the domain currently open) to keep it shown in the field: it
 * follows outside changes, the list still shows every option while the field
 * holds that value, and leaving the field without picking restores it.
 */
export function CompetitorCombobox({
  options, onPick, placeholder = "Type or pick a competitor, e.g. drishtiias.com",
  actionLabel, actionIcon, disabled = false, busy = false, className, clearOnPick = false, value,
}: {
  options: CompetitorOption[]
  onPick: (domain: string) => void
  placeholder?: string
  /** Submit button label. Omit for no button: picking a suggestion or pressing
   * Enter on a typed domain already submits. */
  actionLabel?: string
  actionIcon?: React.ReactNode
  disabled?: boolean
  busy?: boolean
  className?: string
  /** Clear the field after a pick (e.g. "Add competitor"). */
  clearOnPick?: boolean
  /** The domain currently selected/open, shown in the field (see above). */
  value?: string | null
}) {
  const selected = value ?? ""
  const [text, setText] = React.useState(selected)
  // Follow selection changes made outside the field (adjusted during render).
  const [prevSelected, setPrevSelected] = React.useState(selected)
  if (selected !== prevSelected) {
    setPrevSelected(selected)
    setText(selected)
  }
  const listRef = React.useRef<HTMLDivElement>(null)
  const justFocused = React.useRef(false)
  const byDomain = React.useMemo(() => new Map(options.map((o) => [o.domain, o])), [options])
  const grouped = options.some((o) => o.group)
  const items = React.useMemo(() => {
    // Always groups for Base UI; ungrouped lists are one group with no heading.
    const domains = [...new Set(options.map((o) => o.domain))]
    const groups = new Map<string, string[]>()
    for (const d of domains) {
      const g = grouped ? byDomain.get(d)?.group ?? "Other" : ""
      groups.set(g, [...(groups.get(g) ?? []), d])
    }
    return [...groups].map(([value, list]) => ({ value, items: list }))
  }, [options, grouped, byDomain])

  function pick(value: string) {
    const domain = normalizeDomain(value)
    if (!domain || !domain.includes(".")) return
    onPick(domain)
    setText(clearOnPick ? "" : domain)
  }

  // Case-insensitive "contains", except that the selected value itself shows
  // every option — opening a filled field should offer the whole list.
  const filter = React.useCallback((item: string, query: string) => {
    const q = query.trim().toLowerCase()
    return !q || (!!selected && q === selected.toLowerCase()) || item.toLowerCase().includes(q)
  }, [selected])

  function renderItem(domain: string) {
    const { tag, hint } = byDomain.get(domain) ?? {}
    return (
      <Autocomplete.Item key={domain} value={domain}
        className="flex cursor-pointer select-none items-center justify-between gap-4 rounded-md px-2.5 py-1.5 text-sm outline-none data-highlighted:bg-muted">
        <span className="truncate" title={domain}>{domain}</span>
        <span className="flex shrink-0 items-center gap-2">
          {hint && <span className="text-xs tabular-nums text-muted-foreground">{hint}</span>}
          {tag && !grouped && (
            <span className={cn("rounded px-1.5 py-px text-xs font-medium",
              tag === "competitor" ? "bg-primary/10 text-primary"
                : tag === "stored" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground")}>
              {TAG_LABEL[tag]}
            </span>
          )}
        </span>
      </Autocomplete.Item>
    )
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); pick(text) }} className={cn("flex w-full gap-2", className)}>
      <Autocomplete.Root
        items={items}
        value={text}
        filter={filter}
        openOnInputClick
        onOpenChange={(open) => {
          // Always open at the top of the list, not where it was last scrolled to.
          if (open) requestAnimationFrame(() => listRef.current?.scrollTo({ top: 0 }))
          // Closed without a pick (Esc, click away, invalid text): show the open
          // domain again. After a pick the parent's new `value` replaces this.
          else if (value !== undefined) setText(selected)
        }}
        onValueChange={(value, details) => {
          setText(value)
          if (details.reason === "item-press") pick(value)
        }}
      >
        <div className="relative min-w-0 flex-1">
          <Globe aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Autocomplete.Input
            data-slot="input"
            placeholder={placeholder}
            aria-label="Competitor domain"
            disabled={disabled || busy}
            // With a selected value shown, focusing selects it so typing replaces it.
            // The mouseup that follows a click-to-focus would collapse the selection,
            // so that one mouseup is cancelled.
            onFocus={value !== undefined ? (e) => { e.currentTarget.select(); justFocused.current = true } : undefined}
            onMouseUp={value !== undefined ? (e) => { if (justFocused.current) { e.preventDefault(); justFocused.current = false } } : undefined}
            onBlur={() => { justFocused.current = false }}
            className="flex h-9 w-full min-w-0 rounded-lg border border-border bg-background py-1 pl-9 pr-3 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30"
          />
        </div>
        <Autocomplete.Portal>
          <Autocomplete.Positioner sideOffset={4} align="start" className="z-50 outline-none">
            <Autocomplete.Popup className="w-[max(var(--anchor-width),20rem)] max-w-[var(--available-width)] overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
              <Autocomplete.Empty>
                <p className="px-3 py-2.5 text-xs text-muted-foreground">
                  {text.trim() ? <>Press Enter to open <strong className="text-foreground">{normalizeDomain(text)}</strong></> : "Type a domain"}
                </p>
              </Autocomplete.Empty>
              <Autocomplete.List ref={listRef} className="max-h-[min(20rem,var(--available-height))] overflow-y-auto overscroll-contain p-1 outline-none empty:p-0">
                {(group: { value: string; items: string[] }) => (
                  <Autocomplete.Group key={group.value} items={group.items} className="pb-1 last:pb-0">
                    {group.value && (
                      <Autocomplete.GroupLabel className="px-2.5 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                        {group.value}
                      </Autocomplete.GroupLabel>
                    )}
                    <Autocomplete.Collection>{(domain: string) => renderItem(domain)}</Autocomplete.Collection>
                  </Autocomplete.Group>
                )}
              </Autocomplete.List>
              {grouped && (
                <p className="border-t border-border px-3 py-1.5 text-xs text-muted-foreground">
                  ↑↓ to move · Enter to open · or type any domain
                </p>
              )}
            </Autocomplete.Popup>
          </Autocomplete.Positioner>
        </Autocomplete.Portal>
      </Autocomplete.Root>
      {actionLabel && (
        <Button type="submit" variant="outline" className="shrink-0" disabled={disabled || busy || !text.trim()}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : actionIcon} {actionLabel}
        </Button>
      )}
    </form>
  )
}
