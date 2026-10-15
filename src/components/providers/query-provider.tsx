"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import { makeQueryClient } from "@/lib/query/query-client"

/** One QueryClient per mount. Mounted in the dashboard layout, so the cache
 * is dropped when the user leaves the dashboard (e.g. logs out). */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(makeQueryClient)
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
