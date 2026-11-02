/**
 * localStorage persistence for the UI-selection slices.
 *
 * Keys are kept identical to the pre-Redux DashboardContext so existing users
 * keep their last workspace/website:
 *   - `nxgseo:workspace`            -> active workspace id
 *   - `nxgseo:domain:<workspaceId>` -> chosen website id for that workspace
 *
 * The active workspace id is loaded into the store's preloadedState. The
 * per-workspace website ids are read lazily when resolving the active website
 * (see `use-active-domain`), so an unbounded set of workspace keys never has to
 * be enumerated up front.
 */
import type { Middleware } from "@reduxjs/toolkit"

import { setActiveDomain } from "@/store/slices/domain-slice"
import { setActiveWorkspace } from "@/store/slices/workspace-slice"

const WORKSPACE_KEY = "nxgseo:workspace"
const DOMAIN_KEY = (workspaceId: string) => `nxgseo:domain:${workspaceId}`

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // ignore (private mode / storage disabled)
  }
}

/** Active workspace id persisted from a previous session, if any. */
export function loadActiveWorkspaceId(): string | null {
  return read(WORKSPACE_KEY)
}

/** Website id remembered for a workspace in a previous session, if any. */
export function readStoredDomainId(workspaceId: string): string | null {
  return read(DOMAIN_KEY(workspaceId))
}

/** Mirrors workspace/website selection changes into localStorage. */
export const persistMiddleware: Middleware = () => (next) => (action) => {
  const result = next(action)
  if (setActiveWorkspace.match(action)) {
    write(WORKSPACE_KEY, action.payload)
  } else if (setActiveDomain.match(action)) {
    write(DOMAIN_KEY(action.payload.workspaceId), action.payload.domainId)
  }
  return result
}
