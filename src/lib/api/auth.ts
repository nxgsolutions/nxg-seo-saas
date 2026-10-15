/** Auth API surface. Mirrors the FastAPI /api/auth routes. */
import { apiClient } from "./client"

export interface RegisterPayload {
  first_name: string
  last_name: string
  email: string
  password: string
  plan_code?: string
}

export interface UserResponse {
  id: string
  email: string
  first_name: string
  last_name: string
  is_active: boolean
  is_verified: boolean
  is_onboarded: boolean
  created_at: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  user: UserResponse
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiClient.post<UserResponse>("/api/auth/register", payload),

  login: (payload: LoginPayload) =>
    apiClient.post<LoginResponse>("/api/auth/login", payload),

  logout: () => apiClient.post<null>("/api/auth/logout", {}),

  refresh: () => apiClient.post<LoginResponse>("/api/auth/refresh", {}),

  me: () => apiClient.get<UserResponse>("/api/auth/me"),

  completeOnboarding: () =>
    apiClient.post<UserResponse>("/api/onboarding/complete", {}),
}
