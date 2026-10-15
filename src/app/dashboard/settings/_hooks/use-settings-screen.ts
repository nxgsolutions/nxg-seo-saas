"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import * as React from "react"
import { toast } from "sonner"
import { workspacesApi } from "@/lib/api/workspaces"
import { describe } from "../_lib/settings-helpers"

export function useSettingsScreen() {
  const { user, activeWorkspace, refreshWorkspaces } = useDashboard()

  // ── Rename ────────────────────────────────────────────────────────────────
  const [name, setName] = React.useState(activeWorkspace?.name ?? "")
  const [savingName, setSavingName] = React.useState(false)
  const [nameError, setNameError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  // ── Workspace defaults ──────────────────────────────────────────────────────
  const [country, setCountry] = React.useState(activeWorkspace?.default_country ?? "in")
  const [language, setLanguage] = React.useState(activeWorkspace?.default_language ?? "en")
  const [timezone, setTimezone] = React.useState(activeWorkspace?.timezone ?? "UTC")
  const [savingDefaults, setSavingDefaults] = React.useState(false)
  const [defaultsSaved, setDefaultsSaved] = React.useState(false)

  // Reset the fields when the active workspace changes — during render (React's
  // recommended pattern) rather than in an effect.
  const sig = `${activeWorkspace?.id ?? ""}:${activeWorkspace?.name ?? ""}:${activeWorkspace?.default_country ?? ""}:${activeWorkspace?.default_language ?? ""}:${activeWorkspace?.timezone ?? ""}`
  const [prevSig, setPrevSig] = React.useState(sig)
  if (sig !== prevSig) {
    setPrevSig(sig)
    setName(activeWorkspace?.name ?? "")
    setCountry(activeWorkspace?.default_country ?? "in")
    setLanguage(activeWorkspace?.default_language ?? "en")
    setTimezone(activeWorkspace?.timezone ?? "UTC")
    setSaved(false)
    setNameError(null)
    setDefaultsSaved(false)
  }

  async function saveName(event: React.FormEvent) {
    event.preventDefault()
    setNameError(null)
    setSaved(false)
    const value = name.trim()
    if (!value || !activeWorkspace) { setNameError("Workspace name is required."); return }
    setSavingName(true)
    try {
      await workspacesApi.rename(activeWorkspace.id, value)
      await refreshWorkspaces()
      setSaved(true)
      toast.success("Workspace renamed.")
    } catch (err) {
      const msg = describe(err, "Could not save the name.")
      setNameError(msg)
      toast.error(msg)
    } finally {
      setSavingName(false)
    }
  }

  async function saveDefaults(event: React.FormEvent) {
    event.preventDefault()
    if (!activeWorkspace) return
    setSavingDefaults(true)
    setDefaultsSaved(false)
    try {
      await workspacesApi.update(activeWorkspace.id, {
        default_country: country, default_language: language, timezone,
      })
      await refreshWorkspaces()
      setDefaultsSaved(true)
      toast.success("Workspace defaults saved.")
    } catch (err) {
      toast.error(describe(err, "Could not save the defaults."))
    } finally {
      setSavingDefaults(false)
    }
  }

  const defaultsDirty = Boolean(activeWorkspace) && (
    country !== (activeWorkspace?.default_country ?? "in") ||
    language !== (activeWorkspace?.default_language ?? "en") ||
    timezone !== (activeWorkspace?.timezone ?? "UTC")
  )

  return {
    user, activeWorkspace,
    name, setName, savingName, nameError, setNameError, saved, setSaved, saveName,
    country, setCountry, language, setLanguage, timezone, setTimezone,
    savingDefaults, defaultsSaved, setDefaultsSaved, saveDefaults, defaultsDirty,
  }
}
