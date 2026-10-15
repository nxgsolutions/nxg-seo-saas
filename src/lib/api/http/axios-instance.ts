/**
 * The ONE axios instance every API call goes through.
 *
 * - baseURL comes from env (src/config/env.ts) — change the backend address in
 *   the env file only.
 * - Sends the httpOnly session cookies (withCredentials).
 * - Timeouts: reads fail fast (15s); writes, audits and AI calls get 120s.
 * - On 401 it silently renews the session once (POST /api/auth/refresh, shared
 *   by concurrent requests) and retries the original request.
 * - Errors are normalized to ApiError / NetworkError (see ./errors).
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios"

import { env } from "@/config/env"
import { normalizeError } from "./errors"

const READ_TIMEOUT_MS = 15_000
const WRITE_TIMEOUT_MS = 120_000

// Auth lifecycle endpoints: a 401 here is meaningful, never "refresh and retry".
const NON_REFRESHABLE = ["/api/auth/login", "/api/auth/register", "/api/auth/refresh", "/api/auth/logout"]

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

export const http = axios.create({
  baseURL: env.apiBaseUrl,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
})

// Per-method default timeout (an explicit `timeout` on a call still wins).
http.interceptors.request.use((config) => {
  if (!config.timeout) {
    config.timeout = (config.method ?? "get").toLowerCase() === "get" ? READ_TIMEOUT_MS : WRITE_TIMEOUT_MS
  }
  return config
})

// Many parallel 401s share one refresh call.
let refreshing: Promise<boolean> | null = null

function refreshSession(): Promise<boolean> {
  refreshing ??= http
    .post("/api/auth/refresh", null, { timeout: READ_TIMEOUT_MS, _retried: true } as RetriableConfig)
    .then(() => true)
    .catch((err: AxiosError) => (err.response?.status === 401 ? false : Promise.reject(err)))
    .finally(() => { refreshing = null })
  return refreshing
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const url = config?.url ?? ""
    if (
      error.response?.status === 401 && config && !config._retried
      && !NON_REFRESHABLE.some((p) => url.startsWith(p))
    ) {
      config._retried = true
      try {
        if (await refreshSession()) return http(config)
      } catch (refreshError) {
        return Promise.reject(normalizeError(refreshError))
      }
    }
    return Promise.reject(normalizeError(error))
  },
)
