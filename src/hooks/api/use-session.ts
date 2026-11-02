"use client"

/**
 * Session (current user) as server state. The user used to be fetched
 * imperatively inside DashboardContext; it now lives in TanStack Query so the
 * whole app shares one cache entry and the dashboard gate can read its
 * loading/error state.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import * as React from "react"

import { authApi } from "@/lib/api/auth"
import { queryKeys } from "@/lib/query/keys"

/** The signed-in user. Retries are disabled so a 401 surfaces immediately. */
export function useCurrentUserQuery() {
  return useQuery({
    queryKey: queryKeys.session.me(),
    queryFn: () => authApi.me(),
    retry: false,
  })
}

/** Logs out and returns to /login. Clears the query cache on the way out. */
export function useLogout() {
  const router = useRouter()
  const qc = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      qc.clear()
      router.replace("/login")
    },
  })
  return React.useCallback(async () => {
    await mutation.mutateAsync().catch(() => {
      // redirect happens in onSettled regardless of API failure
    })
  }, [mutation])
}
