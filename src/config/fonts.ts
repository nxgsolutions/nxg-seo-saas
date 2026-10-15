/**
 * Central font configuration.
 *
 * Fonts (loaded once here, consumed by the root layout):
 * - Body / UI:  **Geist** (Vercel's neutral, highly legible sans) → `--font-sans`
 * - Headings:   **Space Grotesk** (technical grotesk display; gives NXGSEO its
 *               precise, data-driven "Signal Indigo" character) → `--font-heading`,
 *               exposed as the Tailwind `font-heading` utility (see globals.css @theme).
 * - Mono:       **Geist Mono** → `--font-geist-mono`
 *
 * To change a typeface, swap the import + variable here — everything else reads
 * the CSS variable, so no component needs editing.
 */
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google"

export const fontSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
})

// Display / headings — Space Grotesk gives NXGSEO its technical, precise
// "Signal Indigo" character. Consumed via `--font-heading` (see globals.css).
export const fontHeading = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
})

export const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
})

/** Combined className applied to <html> so the variables are available. */
export const fontVariables = `${fontSans.variable} ${fontHeading.variable} ${fontMono.variable}`
