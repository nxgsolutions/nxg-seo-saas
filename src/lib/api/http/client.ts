/**
 * Typed helpers over the axios instance. API modules (src/lib/api/*.ts) use
 * these with a path only — the base URL, cookies, timeouts, session refresh
 * and error handling all live in ./axios-instance.
 *
 * Pass `{ signal }` (e.g. from TanStack Query) to cancel a stale request.
 */

import type { AxiosRequestConfig } from "axios"

import { http } from "./axios-instance"

type Config = Pick<AxiosRequestConfig, "signal" | "timeout" | "params">

export const apiClient = {
  get: <T>(path: string, config?: Config) => http.get<T>(path, config).then((r) => r.data),
  post: <T>(path: string, data?: unknown, config?: Config) => http.post<T>(path, data ?? {}, config).then((r) => r.data),
  patch: <T>(path: string, data?: unknown, config?: Config) => http.patch<T>(path, data ?? {}, config).then((r) => r.data),
  del: <T>(path: string, config?: Config) => http.delete<T>(path, config).then((r) => r.data),
}
