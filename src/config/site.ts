/**
 * Central site configuration for the public (marketing) website.
 *
 * Single source of truth for brand identity, canonical URL, and social/contact
 * handles. Components and SEO helpers read from here — never hardcode.
 *
 * Values marked PLACEHOLDER are safe defaults to be replaced with real ones.
 */
import { brand } from "./brand"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://nxgseo.com" // PLACEHOLDER

export const site = {
  name: brand.name, // "NXGSEO"
  shortName: brand.shortName,
  /** One-line positioning shown in metadata + hero eyebrow. */
  tagline: "SEO intelligence for teams who ship",
  description: brand.description,
  url: SITE_URL,
  /** Default social share image (place a real 1200×630 asset at /public/og.png). */
  ogImage: "/og.png",
  locale: "en_US",
  social: {
    twitter: "@nxgseo", // PLACEHOLDER
    twitterUrl: "https://x.com/nxgseo", // PLACEHOLDER
    linkedin: "https://www.linkedin.com/company/nxgseo", // PLACEHOLDER
    github: "https://github.com/nxgseo", // PLACEHOLDER
  },
  contact: {
    email: "hello@nxgseo.com", // PLACEHOLDER
    sales: "sales@nxgseo.com", // PLACEHOLDER
  },
} as const

export type Site = typeof site
