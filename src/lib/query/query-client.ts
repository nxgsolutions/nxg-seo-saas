/**
 * TanStack Query defaults for the dashboard.
 *
 * - Data is "fresh" for a minute: switching tabs/pages and coming back reuses
 *   the cache instead of re-calling the API.
 * - No refetch on window focus (several endpoints are slow / rate-limited).
 * - Retry once on network errors and 5xx; never on 4xx (a 404/403 won't fix itself).
 */

import { QueryClient } from "@tanstack/react-query"

import { ApiError } from "@/lib/api/client"

export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failures, error) =>
          failures < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
      },
      mutations: { retry: false },
    },
  })
}
