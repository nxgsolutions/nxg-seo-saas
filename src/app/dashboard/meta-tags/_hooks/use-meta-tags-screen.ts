"use client"

import { errorMessage } from "@/lib/api/client"
import type { InspectResult } from "@/lib/api/pages"
import { toolsApi } from "@/lib/api/tools"
import { useSearchParams } from "next/navigation"
import * as React from "react"
import { Fields, buildTags } from "../_lib/meta-tags-helpers"

const EMPTY: Fields = { title: "", description: "", url: "", siteName: "", image: "", twitter: "" }

function fromLive(p: InspectResult): Fields {
  return {
    title: p.title,
    description: p.meta,
    url: p.canonical || p.url,
    siteName: p.og_site_name,
    image: p.og_image,
    twitter: p.twitter_site,
  }
}

/**
 * Title & Meta state. Fields start empty and are filled from the LIVE page
 * (LivePageLoader → /pages/inspect); `live` keeps the page's current values so
 * edits are marked and can be reset. AI suggestions (gpt-4o-mini) read the page.
 */
export function useMetaTagsScreen() {
  const params = useSearchParams()
  const initialUrl = params.get("url")

  const [f, setF] = React.useState<Fields>(EMPTY)
  const [live, setLive] = React.useState<Fields | null>(null)
  const [liveUrl, setLiveUrl] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)
  const [imgError, setImgError] = React.useState(false)
  const [aiRunning, setAiRunning] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [aiFilled, setAiFilled] = React.useState(false)

  function onLoaded(p: InspectResult) {
    const values = fromLive(p)
    setF(values)
    setLive(values)
    setLiveUrl(p.url)
    setImgError(false)
    setAiFilled(false)
    setAiError(null)
  }

  async function generate() {
    const input = liveUrl ?? f.url.trim()
    if (!input) {
      setAiError("Load a page first.")
      return
    }
    setAiError(null)
    setAiRunning(true)
    try {
      const r = await toolsApi.metaSuggest(input)
      setF((p) => ({ ...p, title: r.title || p.title, description: r.description || p.description }))
      setAiFilled(true)
    } catch (err) {
      setAiError(errorMessage(err, "Could not generate suggestions."))
    } finally {
      setAiRunning(false)
    }
  }

  function resetToLive() {
    if (live) setF(live)
    setAiFilled(false)
  }

  const set = (key: keyof Fields) => (v: string) => {
    setF((p) => ({ ...p, [key]: v }))
    if (key === "image") setImgError(false)
  }

  const edited = (key: keyof Fields) => live !== null && f[key].trim() !== live[key].trim()
  const anyEdited = live !== null && (Object.keys(EMPTY) as (keyof Fields)[]).some(edited)

  const code = buildTags(f)
  const host = (() => {
    try {
      return new URL(f.url || liveUrl || "https://example.com").hostname.replace(/^www\./, "")
    } catch {
      return "example.com"
    }
  })()

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard blocked — ignore
    }
  }

  return {
    initialUrl, f, live, liveUrl, onLoaded, copied, imgError, setImgError, aiRunning, aiError, aiFilled,
    generate, resetToLive, set, edited, anyEdited, code, host, copy,
  }
}
