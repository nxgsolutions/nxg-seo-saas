"use client"

/** Categories (TanStack Query). Global, not workspace-scoped. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { categoriesApi } from "@/lib/api/categories"

const categoriesKey = ["categories"] as const

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey,
    queryFn: () => categoriesApi.list(),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => categoriesApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoriesKey }),
  })
}
