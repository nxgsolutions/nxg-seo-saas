"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/** A labelled input with an optional length guide ("52 / 30–60") and an "Edited" mark vs the live page. */
export function Field({
  id, label, value, onChange, placeholder, textarea, range, edited, disabled,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  textarea?: boolean
  /** Recommended length [min, max] in characters. */
  range?: [number, number]
  /** Differs from the live page. */
  edited?: boolean
  disabled?: boolean
}) {
  const n = value.trim().length
  const ok = range ? n >= range[0] && n <= range[1] : true
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id} className="flex items-center gap-2">
          {label}
          {edited && <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Edited</span>}
        </Label>
        {range && (
          <span className={cn("text-xs tabular-nums", n === 0 ? "text-muted-foreground" : ok ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
            {n} / {range[0]}–{range[1]} chars
          </span>
        )}
      </div>
      {textarea ? (
        <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          disabled={disabled}
          className="flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30" />
      ) : (
        <Input id={id} value={value} onValueChange={onChange} placeholder={placeholder} disabled={disabled} />
      )}
    </div>
  )
}
