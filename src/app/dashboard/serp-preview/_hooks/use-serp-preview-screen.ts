"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import type { InspectResult } from "@/lib/api/pages"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { Device, LIMITS, truncateToWidth } from "../_lib/serp-preview-helpers"
import { useTextWidth } from "./use-text-width"

export function useSerpPreviewScreen() {

  const { activeDomain } = useDashboard()

  const measure = useTextWidth()

  const [device, setDevice] = React.useState<Device>("desktop")

  // Start empty — filled from the live page (LivePageLoader) or typed in.
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [url, setUrl] = React.useState("")
  const initialUrl = useSearchParams().get("url")

  // Prefill the URL with the active website's home page once.
  const [prefilled, setPrefilled] = React.useState(false)
  if (!prefilled && activeDomain) {
    setPrefilled(true)
    setUrl(`https://${activeDomain.domain}/`)
  }

  function onLoaded(p: InspectResult) {
    setTitle(p.title)
    setDescription(p.meta)
    setUrl(p.canonical || p.url)
  }

  const titleFont = "700 20px Arial, sans-serif"

  const limit = LIMITS[device]

  const titlePx = Math.round(measure(title, titleFont))

  const shownTitle = truncateToWidth(title, titleFont, limit.titlePx, measure)

  const shownDesc =
    description.length > limit.descChars
      ? description.slice(0, limit.descChars).trimEnd() + "…"
      : description

  const display = (() => {
    try {
      const u = new URL(url || "https://example.com")
      const parts = u.pathname.split("/").filter(Boolean)
      return { host: u.hostname.replace(/^www\./, ""), crumbs: parts }
    } catch {
      return { host: "example.com", crumbs: [] }
    }
  })()
  return { initialUrl, onLoaded, device, setDevice, title, setTitle, description, setDescription, url, setUrl, limit, titlePx, shownTitle, shownDesc, display }
}
