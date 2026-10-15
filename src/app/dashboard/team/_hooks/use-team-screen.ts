"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useMembers } from "@/hooks/api/use-members"
import { ApiError, NetworkError } from "@/lib/api/client"
import * as React from "react"
import { workspacesApi } from "@/lib/api/workspaces"

export function useTeamScreen() {

  const { user, activeWorkspace } = useDashboard()

  const workspaceId = activeWorkspace?.id ?? null
  // Members list (TanStack Query); setMembers edits the cached list.
  const membersQuery = useMembers(workspaceId)
  const { members, setMembers } = membersQuery
  const loading = membersQuery.isPending && Boolean(workspaceId)

  const canManage =
    activeWorkspace?.role === "owner" || activeWorkspace?.role === "admin"

  const [inviting, setInviting] = React.useState(false)

  const [email, setEmail] = React.useState("")

  const [role, setRole] = React.useState("member")

  const [submitting, setSubmitting] = React.useState(false)

  const [error, setError] = React.useState<string | null>(null)

  const [removingId, setRemovingId] = React.useState<string | null>(null)

  async function invite(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    const value = email.trim()
    if (!value || !workspaceId) {
      setError("Enter an email address.")
      return
    }
    setSubmitting(true)
    try {
      const member = await workspacesApi.addMember(workspaceId, value, role)
      setMembers((prev) => [...prev, member])
      setEmail("")
      setInviting(false)
    } catch (err) {
      if (err instanceof ApiError) {
        setError(
          err.status === 404
            ? "No account exists with that email. They need to sign up first."
            : err.fieldErrors[0]?.message ?? err.message
        )
      } else if (err instanceof NetworkError) {
        setError(err.message)
      } else {
        setError("Could not add the member.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(userId: string) {
    if (!workspaceId) return
    setRemovingId(userId)
    try {
      await workspacesApi.removeMember(workspaceId, userId)
      setMembers((prev) => prev.filter((m) => m.user_id !== userId))
    } catch {
      // leave the list as-is on failure
    } finally {
      setRemovingId(null)
    }
  }

  async function changeRole(userId: string, role: string) {
    if (!workspaceId) return
    const previous = members
    // Optimistic update.
    setMembers((prev) => prev.map((m) => (m.user_id === userId ? { ...m, role } : m)))
    try {
      await workspacesApi.setMemberRole(workspaceId, userId, role)
    } catch {
      setMembers(previous) // revert on failure
    }
  }
  return { user, activeWorkspace, members, loading, canManage, inviting, setInviting, email, setEmail, role, setRole, submitting, error, setError, removingId, invite, remove, changeRole }
}
