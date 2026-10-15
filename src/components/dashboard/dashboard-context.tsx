"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { ApiError } from "@/lib/api/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { authApi, type UserResponse } from "@/lib/api/auth"
import { workspacesApi, type Domain, type Workspace } from "@/lib/api/workspaces"

const STORAGE_KEY = "nxgseo:workspace"
// Active website per workspace: "nxgseo:domain:<workspaceId>" -> domain id.
const DOMAIN_KEY = (workspaceId: string) => `nxgseo:domain:${workspaceId}`

interface DashboardContextValue {
  user: UserResponse
  workspaces: Workspace[]
  activeWorkspace: Workspace | null
  setActiveWorkspaceId: (id: string) => void
  refreshWorkspaces: () => Promise<Workspace[]>
  /** Websites (domains) of the active workspace. */
  domains: Domain[]
  /** true until the active workspace's websites have loaded. */
  domainsLoading: boolean
  /** The website every page works on — chosen in the sidebar, remembered per workspace. */
  activeDomain: Domain | null
  setActiveDomainId: (id: string) => void
  reloadDomains: () => Promise<Domain[]>
  /** Resolved market for the active domain: domain → workspace default → in/en. */
  activeCountry: string
  activeLanguage: string
  logout: () => Promise<void>
}

const DashboardContext = React.createContext<DashboardContextValue | undefined>(
  undefined
)

function readStored(key = STORAGE_KEY): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStored(id: string, key = STORAGE_KEY) {
  try {
    localStorage.setItem(key, id)
  } catch {
    // ignore
  }
}

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [attempt, setAttempt] = React.useState(0)
  const [ready, setReady] = React.useState(false)
  const [user, setUser] = React.useState<UserResponse | null>(null)
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([])
  const [activeId, setActiveId] = React.useState<string | null>(null)
  // Websites per workspace id — a late response can only ever update its own workspace.
  const [domainLists, setDomainLists] = React.useState<Record<string, Domain[]>>({})
  // Website picked this session, per workspace (localStorage is the fallback).
  const [chosenDomain, setChosenDomain] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    let alive = true
    authApi
      .me()
      .then((u) => {
        if (!alive) return
        if (!u.is_onboarded) {
          router.replace("/onboarding")
          return
        }
        setUser(u)
        return workspacesApi.list().then((list) => {
          if (!alive) return
          setWorkspaces(list)
          const stored = readStored()
          const initial =
            (stored && list.some((w) => w.id === stored) ? stored : null) ??
            list[0]?.id ??
            null
          setActiveId(initial)
          setReady(true)
        })
      })
      .catch((err: unknown) => {
        if (!alive) return
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login?next=/dashboard")
          return
        }
        setLoadError("We couldn’t load your workspace. Check your connection and try again.")
      })
    return () => {
      alive = false
    }
  }, [router, attempt])

  const setActiveWorkspaceId = React.useCallback((id: string) => {
    setActiveId(id)
    writeStored(id)
  }, [])

  React.useEffect(() => {
    if (!activeId) return
    let alive = true
    workspacesApi.domains(activeId)
      .then((list) => { if (alive) setDomainLists((prev) => ({ ...prev, [activeId]: list })) })
      .catch(() => { if (alive) setDomainLists((prev) => ({ ...prev, [activeId]: [] })) })
    return () => { alive = false }
  }, [activeId])

  const reloadDomains = React.useCallback(async () => {
    if (!activeId) return []
    const list = await workspacesApi.domains(activeId)
    setDomainLists((prev) => ({ ...prev, [activeId]: list }))
    return list
  }, [activeId])

  const setActiveDomainId = React.useCallback((domainId: string) => {
    if (!activeId) return
    setChosenDomain((prev) => ({ ...prev, [activeId]: domainId }))
    writeStored(domainId, DOMAIN_KEY(activeId))
  }, [activeId])

  const loadedDomains = activeId ? domainLists[activeId] : undefined
  const domainsLoading = !!activeId && loadedDomains === undefined
  const domains = React.useMemo(() => loadedDomains ?? [], [loadedDomains])
  const activeDomain = React.useMemo(() => {
    if (!activeId) return null
    const wanted = chosenDomain[activeId] ?? readStored(DOMAIN_KEY(activeId))
    // A deleted / unknown choice falls back to the first website.
    return domains.find((d) => d.id === wanted) ?? domains[0] ?? null
  }, [activeId, chosenDomain, domains])

  const refreshWorkspaces = React.useCallback(async () => {
    const list = await workspacesApi.list()
    setWorkspaces(list)
    return list
  }, [])

  const logout = React.useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // fall through to redirect regardless
    }
    router.replace("/login")
  }, [router])

  const activeWorkspace = React.useMemo(
    () => workspaces.find((w) => w.id === activeId) ?? null,
    [workspaces, activeId]
  )

  // Resolved market: the domain's own setting, else the workspace default, else in/en.
  const activeCountry = activeDomain?.country || activeWorkspace?.default_country || "in"
  const activeLanguage = activeDomain?.language || activeWorkspace?.default_language || "en"

  const value = React.useMemo<DashboardContextValue | null>(() => {
    if (!ready || !user) return null
    return {
      user,
      workspaces,
      activeWorkspace,
      setActiveWorkspaceId,
      refreshWorkspaces,
      domains,
      domainsLoading,
      activeDomain,
      setActiveDomainId,
      reloadDomains,
      activeCountry,
      activeLanguage,
      logout,
    }
  }, [
    ready,
    user,
    workspaces,
    activeWorkspace,
    setActiveWorkspaceId,
    refreshWorkspaces,
    domains,
    domainsLoading,
    activeDomain,
    setActiveDomainId,
    reloadDomains,
    activeCountry,
    activeLanguage,
    logout,
  ])

  if (loadError) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Alert className="max-w-md">
          <AlertTitle>Dashboard unavailable</AlertTitle>
          <AlertDescription>
            <p>{loadError}</p>
            <Button className="mt-3" onClick={() => { setLoadError(null); setAttempt((n) => n + 1) }}>Try again</Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!value) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
        <span className="sr-only">Loading…</span>
      </div>
    )
  }

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard(): DashboardContextValue {
  const ctx = React.useContext(DashboardContext)
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider")
  return ctx
}
