/**
 * Central brand configuration.
 *
 * Keep the brand name/identity here so components never hardcode it.
 * Update this single file to rebrand the entire application.
 */
export const brand = {
  name: "NXGSEO",
  shortName: "NXGSEO",
  tagline: "Enterprise SEO & AI Search Intelligence",
  description:
    "Rank higher across traditional search and AI answer engines with one enterprise platform.",
} as const

export type Brand = typeof brand
