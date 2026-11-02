/**
 * Redux Toolkit store.
 *
 * Holds client/UI global state only (workspace + website selection). Server
 * data stays in TanStack Query. A fresh store is created per request/mount via
 * `makeStore()` (see `store-provider`), so no state leaks across requests on
 * the server.
 */
import { configureStore } from "@reduxjs/toolkit"

import { loadActiveWorkspaceId, persistMiddleware } from "./persist"
import domainReducer from "./slices/domain-slice"
import workspaceReducer from "./slices/workspace-slice"

export function makeStore() {
  return configureStore({
    reducer: {
      workspace: workspaceReducer,
      domain: domainReducer,
    },
    preloadedState: {
      workspace: { activeWorkspaceId: loadActiveWorkspaceId() },
      domain: { chosenByWorkspace: {} },
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(persistMiddleware),
  })
}

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore["getState"]>
export type AppDispatch = AppStore["dispatch"]
