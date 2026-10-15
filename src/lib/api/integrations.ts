/** Integration status for the Settings → Integrations panel. */
import { apiClient } from "./client"

export interface IntegrationsStatus {
  gsc_configured: boolean
  gsc_connected: boolean
  gsc_email: string | null
  psi_configured: boolean
  dataforseo_configured: boolean
  ollama_available: boolean
  ollama_model: string
  anthropic_configured: boolean
  stripe_configured: boolean
}

export const integrationsApi = {
  status: (wid: string) =>
    apiClient.get<IntegrationsStatus>(`/api/workspaces/${wid}/integrations`),
}
