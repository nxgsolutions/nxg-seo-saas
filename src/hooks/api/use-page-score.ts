"use client"

/** Overall Page Score (TanStack Query, per workspace): run a score and record it to page history. */

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { pageScoreApi, type PageScoreDetail } from "@/lib/api/page-score"
import { queryKeys } from "@/lib/query/keys"

export function useRunPageScore(wid: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (v: { url: string; keyword?: string | null; device: "desktop" | "mobile" }) =>
      pageScoreApi.run(wid!, v),
    onSuccess: (_res: PageScoreDetail) => {
      if (!wid) return
      // A score run records a new page-history snapshot.
      void qc.invalidateQueries({ queryKey: queryKeys.pages.all(wid) })
    },
  })
}
