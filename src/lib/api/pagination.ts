/**
 * Server-side pagination contract shared by every paged list endpoint:
 *   ?page=1&page_size=25&sort=<field>&order=desc&q=<search>  (+ endpoint filters)
 * Responses carry `rows` (one page) and `pagination`.
 */

export interface PageInfo {
  page: number
  page_size: number
  /** Rows matching the filters, across all pages. */
  total: number
  total_pages: number
}

export interface Paged<T> {
  rows: T[]
  pagination: PageInfo
}

export interface ListParams {
  page?: number
  pageSize?: number
  sort?: string | null
  order?: "asc" | "desc"
  q?: string
}

type Extra = Record<string, string | number | boolean | null | undefined>

/** ListParams (+ endpoint filters) -> axios `params` (empty values dropped). */
export function listParams(p: ListParams = {}, extra: Extra = {}): Record<string, string | number | boolean> {
  const all: Extra = {
    page: p.page ?? 1, page_size: p.pageSize ?? 25, sort: p.sort ?? undefined, order: p.order ?? "desc",
    q: p.q?.trim() || undefined, ...extra,
  }
  return Object.fromEntries(Object.entries(all).filter(([, v]) => v !== undefined && v !== null && v !== "")) as
    Record<string, string | number | boolean>
}

/** Fetch every page (for CSV export) — big pages, stops at the last one. */
export async function fetchAllPages<T>(fetchPage: (page: number, pageSize: number) => Promise<Paged<T>>, pageSize = 1000): Promise<T[]> {
  const out: T[] = []
  for (let page = 1; ; page++) {
    const { rows, pagination } = await fetchPage(page, pageSize)
    out.push(...rows)
    if (page >= pagination.total_pages) return out
  }
}
