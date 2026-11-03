import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Compact relative time, e.g. "just now", "5m ago", "3h ago", "2d ago". */
/** Whole days from now until an ISO timestamp, or null if it's already past. */
export function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return ms > 0 ? Math.ceil(ms / 86_400_000) : null
}

/**
 * The app's ONE calendar-date format: "2 Nov 2026". Accepts an ISO string,
 * Date, or epoch ms; returns "" for empty/invalid input. Use this (or the
 * <FormattedDate> component) everywhere a date is shown so every screen reads
 * the same. Locale is pinned to en-GB for a stable day-month-year order.
 */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value == null || value === "") return ""
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

/** Same format plus time — "2 Nov 2026, 14:30" — for tooltips and precise logs. */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (value == null || value === "") return ""
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const secs = Math.round((Date.now() - then) / 1000)
  if (secs < 45) return "just now"
  const mins = Math.round(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
