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

export function useCompetitorSelection(domainId: string | null) {
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
  const atLimit = draft.length >= MAX_COMPETITORS

  const add = React.useCallback(
    (domain: string): boolean => {
      if (!domainId || !domain) return false
      if (draft.includes(domain)) return false
      if (draft.length >= MAX_COMPETITORS) return false
      dispatch(addDraftCompetitor({ domainId, domain }))
      return true
    },
    [dispatch, domainId, draft],
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
      dispatch(
        setDraftCompetitors({
          domainId,
          domains: domains.slice(0, MAX_COMPETITORS),
        }),
      )
    },
    [dispatch, domainId],
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
    count: draft.length,
    max: MAX_COMPETITORS,
  }
}
