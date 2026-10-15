"use client"

import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAddToRankTracking, useSaveKeyword, useSavedKeywordKeys } from "@/hooks/api/use-keyword-actions"
import { normalizeKeyword } from "@/lib/api/my-keywords"
import { ApiError, errorMessage } from "@/lib/api/client"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bookmark, BookmarkCheck, Copy, Lightbulb, LineChart, Plus, Wand2 } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import * as React from "react"
import { toast } from "sonner"
import { KeywordBreakdownSheet, type BreakdownTab } from "./keyword-breakdown-sheet"

/** Google "G" mark for the "Search results" item. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 shrink-0">
      <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.2a11 11 0 0 0 0 9.8l3.6-2.8Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.2 7.1l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
    </svg>
  )
}

/** Copy text: the Clipboard API, or a hidden-textarea fallback when the browser blocks it. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const el = document.createElement("textarea")
      el.value = text
      el.setAttribute("readonly", "")
      el.style.position = "fixed"
      el.style.opacity = "0"
      document.body.appendChild(el)
      el.select()
      const ok = document.execCommand("copy")
      el.remove()
      return ok
    } catch {
      return false
    }
  }
}

/** Set false to hide the "Save keyword" / Saved Keywords feature (also remove its nav entry in config/nav.ts). */
const SHOW_MY_KEYWORDS = true

export function keywordAnalysisHref(keyword: string) {
  return `/dashboard/keyword-analysis?q=${encodeURIComponent(keyword)}`
}

/** Content Optimization prefilled with the keyword (and the page, when known). */
export function contentOptimizationHref(keyword: string, pageUrl?: string | null) {
  const p = new URLSearchParams()
  if (keyword) p.set("keyword", keyword)
  if (pageUrl) p.set("url", pageUrl)
  return `/dashboard/content-optimization?${p.toString()}`
}

/**
 * "+" menu shown before a keyword: copy, Google results, save keyword,
 * track its rank, more ideas, optimize content. (Clicking the keyword itself opens
 * its metrics, so there is no separate "overview" item.) Used by every keyword
 * table (Keyword Analysis + Competitive Strategy) so the actions stay the same.
 * "Search results" / "Keyword overview" open the Keyword Breakdown panel.
 */
export function KeywordActionsMenu({
  keyword, workspaceId, domainId, country = "in", language = "en", label, inBreakdown = false, className, pageUrl,
}: {
  keyword: string
  workspaceId: string | null | undefined
  /** Your domain — needed for the two "Add to…" actions. */
  domainId: string | null | undefined
  country?: string
  language?: string
  /** Show text next to the "+" (e.g. "Options"). */
  label?: string
  /** Rendered inside the breakdown panel itself — hide the items that open it. */
  inBreakdown?: boolean
  className?: string
  /** Your page that ranks for the keyword (prefills Content Optimization). */
  pageUrl?: string | null
}) {
  const router = useRouter()
  const [sheet, setSheet] = React.useState<BreakdownTab | null>(null)
  const canAdd = Boolean(workspaceId && domainId)
  const saveKeyword = useSaveKeyword(workspaceId ?? null, domainId ?? null)
  // One shared cached request for every menu on the page (TanStack de-duplicates it).
  const savedKeys = useSavedKeywordKeys(SHOW_MY_KEYWORDS ? workspaceId ?? null : null, domainId ?? null).data
  const isSaved = savedKeys?.has(normalizeKeyword(keyword)) ?? false
  const pathname = usePathname()
  const addRank = useAddToRankTracking(workspaceId ?? null, domainId ?? null)

  async function copy() {
    if (await copyText(keyword)) toast.success(`Copied “${keyword}”`)
    else toast.error("Your browser blocked copying. Select the keyword and press Ctrl+C.")
  }

  function saveToMyKeywords() {
    if (!canAdd) return
    if (isSaved) {
      router.push("/dashboard/my-keywords")
      return
    }
    const source = pathname.split("/")[2] || "dashboard" // e.g. keyword-analysis, competitive-strategy
    saveKeyword.mutate({ keyword, country, language, source }, {
      onSuccess: (r) => toast.success(r.created ? `Saved “${keyword}”` : `“${keyword}” is already saved`, {
        action: { label: "View saved", onClick: () => router.push("/dashboard/my-keywords") },
      }),
      onError: (err) => toast.error(errorMessage(err, "Could not save the keyword.")),
    })
  }

  // Adds the keyword to rank tracking (the tracked_keywords table), which
  // records its Google position over time on the Rank Tracking page
  // (/dashboard/rankings). Distinct from "Save keyword", a no-tracking shortlist.
  function trackRank() {
    if (!canAdd) return
    addRank.mutate(keyword, {
      onSuccess: () => toast.success(`Now tracking “${keyword}”`, {
        action: { label: "View tracking", onClick: () => router.push("/dashboard/rankings") },
      }),
      onError: (err) => {
        if (err instanceof ApiError && err.status === 409) toast.info(`“${keyword}” is already tracked`)
        else toast.error(errorMessage(err, "Could not start tracking the keyword."))
      },
    })
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Actions for ${keyword}`}
        title="Keyword actions"
        onClick={(e) => e.stopPropagation()}
        // Same xs / icon-xs sizes as other in-row actions.
        className={cn(
          buttonVariants({ variant: "outline", size: label ? "xs" : "icon-xs" }),
          "bg-card shadow-xs", label ? "text-foreground" : "text-muted-foreground",
          "hover:border-primary/40 hover:bg-accent hover:text-primary data-[popup-open]:border-primary/40 data-[popup-open]:bg-accent data-[popup-open]:text-primary",
          className,
        )}
      >
        <Plus className="size-3.5" />{label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel className="truncate" title={keyword}>{keyword}</DropdownMenuLabel>
        <DropdownMenuItem onClick={copy}><Copy /> Copy keyword</DropdownMenuItem>
        {!inBreakdown && (
          <DropdownMenuItem onClick={() => setSheet("results")}><GoogleIcon /> Google results</DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {SHOW_MY_KEYWORDS && (
          <DropdownMenuItem onClick={saveToMyKeywords} disabled={!canAdd}>
            {isSaved ? <><BookmarkCheck className="!text-primary" /> Saved</> : <><Bookmark /> Save keyword</>}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={trackRank} disabled={!canAdd}><LineChart /> Track rank</DropdownMenuItem>
        {!canAdd && <p className="px-2.5 pb-1 text-[11px] text-muted-foreground">Add a website to use these.</p>}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(keywordAnalysisHref(keyword))}>
          <Lightbulb /> View more ideas like this
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(contentOptimizationHref(keyword, pageUrl))}>
          <Wand2 /> Optimize content for this
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    {sheet && (
      <KeywordBreakdownSheet keyword={keyword} open tab={sheet} onOpenChange={(o) => { if (!o) setSheet(null) }}
        workspaceId={workspaceId} domainId={domainId} country={country} language={language}
        options={<KeywordActionsMenu keyword={keyword} workspaceId={workspaceId} domainId={domainId}
          country={country} language={language} label="Options" inBreakdown />} />
    )}
    </>
  )
}
