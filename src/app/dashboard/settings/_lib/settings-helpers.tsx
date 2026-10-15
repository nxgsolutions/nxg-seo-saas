import { ApiError, NetworkError } from "@/lib/api/client"

export function describe(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.fieldErrors[0]?.message ?? err.message
  if (err instanceof NetworkError) return err.message
  return fallback
}

/** Default country for keyword/SERP tools (ISO-3166 alpha-2). */
export const COUNTRIES = [
  { code: "in", label: "India" },
  { code: "us", label: "United States" },
  { code: "gb", label: "United Kingdom" },
  { code: "ca", label: "Canada" },
  { code: "au", label: "Australia" },
  { code: "de", label: "Germany" },
  { code: "fr", label: "France" },
  { code: "ae", label: "United Arab Emirates" },
  { code: "sg", label: "Singapore" },
]

/** Default content language (ISO-639-1). */
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "ar", label: "Arabic" },
]

/** Curated timezone list (used for dates and reports). */
export const TIMEZONES = [
  "UTC",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Australia/Sydney",
]

export function labelFor(list: { code: string; label: string }[], code: string, fallback: string): string {
  return list.find((x) => x.code === code)?.label ?? fallback
}
