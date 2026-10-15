/**
 * Central typography scale.
 *
 * Reusable Tailwind class strings for consistent text styling across the app.
 * Components should reference these instead of ad-hoc font sizing.
 */
export const typography = {
  h1: "text-3xl font-semibold tracking-tight sm:text-4xl",
  h2: "text-2xl font-semibold tracking-tight",
  h3: "text-lg font-semibold tracking-tight",
  lead: "text-base text-muted-foreground",
  body: "text-sm text-foreground",
  muted: "text-sm text-muted-foreground",
  label: "text-sm font-medium",
  caption: "text-xs text-muted-foreground",
} as const

export type TypographyToken = keyof typeof typography
