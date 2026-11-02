/**
 * Active workspace selection — the workspace every dashboard page is scoped to.
 *
 * This is pure client/UI state: which workspace the user has chosen. The list
 * of workspaces itself is server data and lives in TanStack Query
 * (`useWorkspacesQuery`), not here. The chosen id is persisted to localStorage
 * by the store's persist middleware (key `nxgseo:workspace`).
 */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

import type { RootState } from "@/store"

interface WorkspaceState {
  activeWorkspaceId: string | null
}

const initialState: WorkspaceState = {
  activeWorkspaceId: null,
}

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setActiveWorkspace(state, action: PayloadAction<string>) {
      state.activeWorkspaceId = action.payload
    },
    clearWorkspace(state) {
      state.activeWorkspaceId = null
    },
  },
})

export const { setActiveWorkspace, clearWorkspace } = workspaceSlice.actions

export const selectActiveWorkspaceId = (state: RootState) =>
  state.workspace.activeWorkspaceId

export default workspaceSlice.reducer
