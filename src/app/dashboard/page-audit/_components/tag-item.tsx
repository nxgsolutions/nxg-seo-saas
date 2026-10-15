"use client"

import {
  CheckCircle2,
  XCircle
} from "lucide-react"

export function TagItem({
  label,
  value,
  present,
}: {
  label: string
  value?: string
  present?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      {present === undefined ? (
        <span className="min-w-0 truncate text-right font-medium" title={value}>
          {value || "—"}
        </span>
      ) : present ? (
        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-4" /> Present
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <XCircle className="size-4" /> Missing
        </span>
      )}
    </div>
  )
}
