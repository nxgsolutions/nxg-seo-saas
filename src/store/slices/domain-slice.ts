/**
 * Active website (domain) selection, remembered per workspace.
 *
 * Pure client/UI state: which website the user picked within each workspace.
 * The website lists themselves are server data (TanStack Query). The chosen id
 * per workspace is persisted to localStorage by the store's persist middleware
 * (key `nxgseo:domain:<workspaceId>`), matching the pre-Redux behaviour.
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { RootState } from "@/store"

interface DomainState {
  /** workspace id -> chosen domain id */
  chosenByWorkspace: Record<string, string>
}

const initialState: DomainState = {
  chosenByWorkspace: {},
}

const domainSlice = createSlice({
  name: "domain",
  initialState,
  reducers: {
    setActiveDomain(
      state,
      action: PayloadAction<{ workspaceId: string; domainId: string }>
    ) {
      state.chosenByWorkspace[action.payload.workspaceId] =
        action.payload.domainId
    },
  },
})

export const { setActiveDomain } = domainSlice.actions

/** The domain id chosen for a workspace this session (undefined = none yet). */
export const selectChosenDomainId =
  (workspaceId: string | null) => (state: RootState) =>
    workspaceId ? state.domain.chosenByWorkspace[workspaceId] : undefined

export default domainSlice.reducer
