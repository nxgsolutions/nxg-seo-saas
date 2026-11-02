"use client"

import * as React from "react"
import { Provider } from "react-redux"

import { makeStore, type AppStore } from "./index"

/**
 * Creates one Redux store per mount (via a lazy state initializer, so it is
 * stable across re-renders but never shared across requests on the server).
 * Mounted in the dashboard layout, alongside the QueryProvider.
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store] = React.useState<AppStore>(makeStore)
  return <Provider store={store}>{children}</Provider>
}
