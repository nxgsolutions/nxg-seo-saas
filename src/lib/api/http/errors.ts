/** Normalized API errors: components only ever see ApiError or NetworkError. */

import { isAxiosError, isCancel } from "axios"

/** A single field-level validation error (from FastAPI/Pydantic 422). */
export interface FieldError {
  field: string
  message: string
}

/** The server answered with an error status. */
export class ApiError extends Error {
  status: number
  fieldErrors: FieldError[]

  constructor(message: string, status: number, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

/** The request never got an answer (offline, DNS, CORS, timeout). */
export class NetworkError extends Error {
  constructor(message = "Unable to connect to the server. Please try again.") {
    super(message)
    this.name = "NetworkError"
  }
}

interface FastApiValidationItem {
  loc: (string | number)[]
  msg: string
  type: string
}

/** FastAPI error body -> ApiError. Handles 422 `{detail: [...]}` and `{detail: "msg"}`. */
export function apiErrorFromBody(status: number, body: unknown): ApiError {
  const detail = body && typeof body === "object" && "detail" in body ? (body as { detail: unknown }).detail : undefined
  if (Array.isArray(detail)) {
    const fieldErrors: FieldError[] = (detail as FastApiValidationItem[]).map((item) => ({
      // loc is like ["body", "email"] — the last segment is the field.
      field: String(item.loc[item.loc.length - 1] ?? ""),
      message: item.msg,
    }))
    return new ApiError("Validation failed", status, fieldErrors)
  }
  if (typeof detail === "string") return new ApiError(detail, status)
  return new ApiError("Something went wrong. Please try again.", status)
}

/**
 * Any thrown value from axios -> ApiError / NetworkError. Cancellations
 * (TanStack Query aborting a stale request) are re-thrown unchanged so the
 * query layer can ignore them.
 */
export function normalizeError(error: unknown): unknown {
  if (isCancel(error)) return error
  if (!isAxiosError(error)) return error
  if (error.response) return apiErrorFromBody(error.response.status, error.response.data)
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return new NetworkError("The server took too long to respond. Please try again.")
  }
  return new NetworkError()
}

/** User-facing message for any error (falls back to `fallback`). */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  return error instanceof ApiError || error instanceof NetworkError ? error.message : fallback
}
