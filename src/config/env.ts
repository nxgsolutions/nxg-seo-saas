/**
 * Public runtime configuration, read from NEXT_PUBLIC_* env vars (inlined at
 * build time). Change the backend address in `.env.local` / the deploy env —
 * nothing else in the code needs to change.
 */

const trimSlash = (url: string) => url.replace(/\/+$/, "")

export const env = {
  /**
   * Base URL every API call is sent to (the axios instance's `baseURL`).
   * - `next dev`: "" — requests go to this origin's /api/* and next.config.ts
   *   proxies them to NEXT_PUBLIC_API_URL, so auth cookies stay same-origin.
   * - production: NEXT_PUBLIC_API_URL, e.g. https://api.example.com
   */
  apiBaseUrl:
    process.env.NODE_ENV === "development"
      ? ""
      : trimSlash(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"),
} as const
