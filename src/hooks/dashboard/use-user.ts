"use client"

import { useCurrentUserQuery } from "@/hooks/api/use-session"
import type { UserResponse } from "@/lib/api/auth"

/**
 * The signed-in user. Only valid inside the dashboard, where `DashboardGate`
 * has already loaded the session — mirrors the old `useDashboard().user`, which
 * was always present once the provider was ready.
 */
export function useUser(): UserResponse {
  const { data } = useCurrentUserQuery()
  if (!data) {
    throw new Error("useUser was called before the session finished loading")
  }
  return data
}
