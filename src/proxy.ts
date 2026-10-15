import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Cookie names must match the backend (app/core/config.py).
const ACCESS_COOKIE = "access_token"
const REFRESH_COOKIE = "refresh_token"

const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"]

/**
 * Server-side route guard (runs before render).
 *
 * This is a cheap cookie-presence gate for good UX (no protected-page flash for
 * logged-out users). Cookie presence cannot prove a session is valid. It is NOT
 * the security boundary — the FastAPI API independently authorizes every
 * request, and the client re-checks the session via /me.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession =
    request.cookies.has(ACCESS_COOKIE) || request.cookies.has(REFRESH_COOKIE)

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.searchParams.set("next", pathname)
    return NextResponse.redirect(url)
  }

  // Keep login reachable when an expired/invalid cookie is still present.
  // Redirecting on cookie presence alone creates a dashboard/login loop.
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/onboarding/:path*", "/login", "/register"],
}
