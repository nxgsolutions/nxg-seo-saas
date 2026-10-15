/**
 * SEO helpers for the public site — one place to build consistent metadata.
 *
 * Every marketing page calls `createMetadata()` for a unique title, description,
 * canonical URL, and Open Graph / Twitter cards. Uses the Next.js Metadata API.
 */
import type { Metadata } from "next"

import { site } from "./site"

/** Base for resolving relative URLs (canonical, OG images). */
export const metadataBase = new URL(site.url)

interface CreateMetadataOptions {
  title?: string
  description?: string
  /** Absolute path, e.g. "/pricing". Becomes the canonical URL. */
  path?: string
  /** Override the share image (absolute path or URL). */
  ogImage?: string
  /** Keep the page out of the index (e.g. thank-you pages). */
  noIndex?: boolean
  type?: "website" | "article"
}

export function createMetadata({
  title,
  description = site.description,
  path = "/",
  ogImage = site.ogImage,
  noIndex = false,
  type = "website",
}: CreateMetadataOptions = {}): Metadata {
  // Home uses the brand as the title; inner pages get "Page · NXGSEO".
  const resolvedTitle = title ? `${title} · ${site.name}` : `${site.name} — ${site.tagline}`
  const canonical = path

  return {
    // Absolute so the root layout's title template doesn't double-append the brand.
    title: { absolute: resolvedTitle },
    description,
    alternates: { canonical },
    openGraph: {
      title: resolvedTitle,
      description,
      url: canonical,
      siteName: site.name,
      type,
      locale: site.locale,
      images: [{ url: ogImage, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description,
      site: site.social.twitter,
      images: [ogImage],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  }
}
