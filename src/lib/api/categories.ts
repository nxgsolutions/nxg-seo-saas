/** Categories API surface. Mirrors the FastAPI /api/categories routes.
 * Categories are global, editable industry labels used to scope competitor
 * suggestions to a single industry. */
import { apiClient } from "./client"

export interface Category {
  id: string
  name: string
  slug: string
  created_at: string
}

export const categoriesApi = {
  list: () => apiClient.get<Category[]>("/api/categories"),

  create: (name: string) => apiClient.post<Category>("/api/categories", { name }),

  rename: (categoryId: string, name: string) =>
    apiClient.patch<Category>(`/api/categories/${categoryId}`, { name }),

  remove: (categoryId: string) => apiClient.del<null>(`/api/categories/${categoryId}`),
}
