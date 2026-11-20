"use client"

/**
 * Competitor comparison selection for a website — the focused dashboard hook
 * over the `competitors` Redux slice.
 *
 * Manages a `draft` set (chips the user builds) and a `compared` set (what the
 * charts render, committed with `compare()`). Enforces the max of 4 competitors
 * (excluding the primary website) and dedupe, and restores a previously saved
 * selection from localStorage on first use for a website.
 */
import * as React from "react"

import { useAppDispatch, useAppSelector } from "@/store/hooks"
import {
  addDraftCompetitor,
  applyCompare,
  clearSelection,
  hydrateSelection,
  removeDraftCompetitor,
  selectDomainSelection,
  setDraftCompetitors,
} from "@/store/slices/competitors-slice"
import { readStoredCompetitorSelection } from "@/store/persist"

/** Maximum competitors compared at once, excluding the primary website. */
export const MAX_COMPETITORS = 4

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((x) => set.has(x))
}

export function useCompetitorSelection(
  domainId: string | null,
  primaryHost?: string | null,
) {
  const dispatch = useAppDispatch()
  const selection = useAppSelector(selectDomainSelection(domainId))

  // Restore a saved selection from localStorage the first time we see a website.
  const [checked, setChecked] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!domainId) return
    const stored = readStoredCompetitorSelection(domainId)
    if (stored && (stored.draft.length || stored.compared.length)) {
      dispatch(hydrateSelection({ domainId, selection: stored }))
    }
    setChecked(domainId)
  }, [domainId, dispatch])

  const { draft, compared } = selection
  const hydrated = checked === domainId
  // The cap and the count are about COMPETITORS only — the user's own website is
  // never counted, even if it somehow ends up in the stored draft.
  const primary = (primaryHost ?? "").toLowerCase()
  const competitors = React.useMemo(
    () => (primary ? draft.filter((d) => d !== primary) : draft),
    [draft, primary],
  )
  const atLimit = competitors.length >= MAX_COMPETITORS

  const add = React.useCallback(
    (domain: string): boolean => {
      if (!domainId || !domain) return false
      if (domain === primary) return false // never add your own website
      if (draft.includes(domain)) return false
      // Count only competitors toward the cap, not the primary.
      if (draft.filter((d) => d !== primary).length >= MAX_COMPETITORS) return false
      dispatch(addDraftCompetitor({ domainId, domain }))
      return true
    },
    [dispatch, domainId, draft, primary],
  )

  const remove = React.useCallback(
    (domain: string) => {
      if (!domainId) return
      dispatch(removeDraftCompetitor({ domainId, domain }))
    },
    [dispatch, domainId],
  )

  const setDraft = React.useCallback(
    (domains: string[]) => {
      if (!domainId) return
      // Drop the primary and cap to the competitor limit.
      const cleaned = domains
        .filter((d) => d && d !== primary)
        .slice(0, MAX_COMPETITORS)
      dispatch(setDraftCompetitors({ domainId, domains: cleaned }))
    },
    [dispatch, domainId, primary],
  )

  const compare = React.useCallback(() => {
    if (!domainId) return
    dispatch(applyCompare({ domainId }))
  }, [dispatch, domainId])

  const reset = React.useCallback(() => {
    if (!domainId) return
    dispatch(clearSelection({ domainId }))
  }, [dispatch, domainId])

  return {
    draft,
    compared,
    add,
    remove,
    setDraft,
    compare,
    reset,
    /** Whether the localStorage restore has run for this website. */
    hydrated,
    /** True when draft differs from the committed compared set. */
    isDirty: !sameSet(draft, compared),
    /** True once 4 competitors are drafted. */
    atLimit,
    /** Number of competitors drafted (never counts the primary website). */
    count: competitors.length,
    max: MAX_COMPETITORS,
  }
}
