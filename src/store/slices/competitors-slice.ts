/**
 * Competitor comparison selection, remembered per website.
 *
 * Pure client/UI state: which competitor domains the user is comparing on the
 * Competitive Strategy page. Two sets per website:
 *   - `draft`    — the chips the user is building up (edited as they add/remove);
 *   - `compared` — the set the charts actually render, committed via "Compare".
 *
 * The analytics/history server data (TanStack Query) already returns every
 * competitor; these arrays are just the client-side selection filter. Persisted
 * to localStorage by the store's persist middleware (key
 * `nxgseo:competitors:<domainId>`), so selection survives navigation and refresh.
 *
 * The primary (own) website is never stored here — it is always pinned by the
 * screen. The cap (max 4 competitors) is enforced by the selection hook/UI.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { RootState } from "@/store"

export interface DomainSelection {
  draft: string[]
  compared: string[]
}

interface CompetitorsState {
  /** website (domain) id -> its draft + compared competitor sets */
  byDomain: Record<string, DomainSelection>
}

const initialState: CompetitorsState = {
  byDomain: {},
}

function slot(state: CompetitorsState, domainId: string): DomainSelection {
  if (!state.byDomain[domainId]) {
    state.byDomain[domainId] = { draft: [], compared: [] }
  }
  return state.byDomain[domainId]
}

const competitorsSlice = createSlice({
  name: "competitors",
  initialState,
  reducers: {
    /** Add a competitor to the draft set (deduped; no cap here — UI enforces it). */
    addDraftCompetitor(
      state,
      action: PayloadAction<{ domainId: string; domain: string }>,
    ) {
      const s = slot(state, action.payload.domainId)
      if (!s.draft.includes(action.payload.domain)) {
        s.draft.push(action.payload.domain)
      }
    },
    /** Remove a competitor from the draft set. */
    removeDraftCompetitor(
      state,
      action: PayloadAction<{ domainId: string; domain: string }>,
    ) {
      const s = slot(state, action.payload.domainId)
      s.draft = s.draft.filter((d) => d !== action.payload.domain)
    },
    /** Replace the whole draft set (e.g. seeding the default top competitors). */
    setDraftCompetitors(
      state,
      action: PayloadAction<{ domainId: string; domains: string[] }>,
    ) {
      slot(state, action.payload.domainId).draft = [
        ...new Set(action.payload.domains),
      ]
    },
    /** Commit the draft set — the charts now render exactly these competitors. */
    applyCompare(state, action: PayloadAction<{ domainId: string }>) {
      const s = slot(state, action.payload.domainId)
      s.compared = [...s.draft]
    },
    /** Clear both sets for a website. */
    clearSelection(state, action: PayloadAction<{ domainId: string }>) {
      state.byDomain[action.payload.domainId] = { draft: [], compared: [] }
    },
    /** Hydrate a website's selection from persisted storage. */
    hydrateSelection(
      state,
      action: PayloadAction<{ domainId: string; selection: DomainSelection }>,
    ) {
      state.byDomain[action.payload.domainId] = {
        draft: [...new Set(action.payload.selection.draft)],
        compared: [...new Set(action.payload.selection.compared)],
      }
    },
  },
})

export const {
  addDraftCompetitor,
  removeDraftCompetitor,
  setDraftCompetitors,
  applyCompare,
  clearSelection,
  hydrateSelection,
} = competitorsSlice.actions

const EMPTY: DomainSelection = { draft: [], compared: [] }

/** The full selection (draft + compared) for a website. */
export const selectDomainSelection =
  (domainId: string | null) =>
  (state: RootState): DomainSelection =>
    (domainId ? state.competitors.byDomain[domainId] : undefined) ?? EMPTY

export default competitorsSlice.reducer
