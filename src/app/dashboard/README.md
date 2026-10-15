# Dashboard feature structure

Routes own their feature code. `page.tsx` is a small server-rendered entry point that composes a client screen; it contains no fetching, event handlers, or large UI sections.

```text
dashboard/
  layout.tsx                      Shared authenticated shell (+ QueryProvider)
  page.tsx                        Overview route entry
  _components/                    Overview panels and screen
  _hooks/                         Overview state and derived data
  _lib/                           Overview formatting helpers
  keyword-analysis/
    page.tsx
    _components/                  Screen, results, skeletons, search bar…
    _hooks/                       Page state (what's open, filters)
    _lib/                         Constants, types and formatting

src/
  config/env.ts                   Public env (API base URL) — the only place it's read
  lib/api/http/                   ONE axios instance: base URL, cookies, timeouts,
                                  session refresh, ApiError / NetworkError
  lib/api/<feature>.ts            Typed endpoints (paths + params only)
  lib/api/pagination.ts           Paging contract: listParams, PageInfo, fetchAllPages
  lib/query/                      QueryClient defaults + query-key factory (keys.ts)
  hooks/api/use-<feature>.ts      TanStack Query hooks (queries + mutations)
  components/ui/pager.tsx         Server-paged list footer
  components/ui/table-skeleton.tsx
```

## Data flow

`component → hooks/api (TanStack Query) → lib/api/<feature> → lib/api/http (axios) → backend`

- **Server address**: set `NEXT_PUBLIC_API_URL` in the env file only. In `next dev` requests use the `/api` proxy in `next.config.ts` so auth cookies stay same-origin.
- **Reading data**: use a `hooks/api` query. Keys come from `lib/query/keys.ts` and always start with `["ws", workspaceId, …]` (plus `"domain", domainId` for per-website data), so one workspace's cache never leaks into another.
- **Changing data**: use a mutation that updates or invalidates exactly the cached data it changes.
- **Lists**: paginate on the server (`page`, `page_size`, `sort`, `order`, `q` → `rows` + `pagination`). Use `placeholderData: keepPreviousData`, dim rows while the next page loads, show `TableSkeleton` only on the first load, and render `Pager` — the layout must not jump.
- **Workspace / website ids**: read them from `useDashboard()`; don't load extra resources just to get ids.
- **Paid APIs** (DataForSEO): only on an explicit click with the price shown — never in an effect or on page load.
- **Page history**: any feature that fetches a website page records a snapshot on the server (`page_history_service.record` / `safe_record`); on the client, invalidate `queryKeys.pages.all(wid)` after such a run so Page history stays current.

## Responsibilities

- **`_components`**: screens compose focused panels. Keep presentation here, and split sections when they have independent responsibilities.
- **`_hooks`**: page state and orchestration (what's selected, filters, derived values). Data loading lives in `src/hooks/api`.
- **`_lib`**: feature-only constants, types, and pure formatting/calculation helpers.
- **`src/components/dashboard`**: UI genuinely shared across routes, including `PageHeader`, `StatCard`, navigation, workspace context, and search performance.
- **`src/components/ui`**: reusable primitives (incl. `SegmentedTabs`, `Pager`, `TableSkeleton`). Dashboard visual tokens live under `.dashboard-shell` in `src/app/globals.css`.

Only create directories a feature needs. Private folders do not create URLs. Use relative imports within a feature and `@/` imports for shared modules. Keep existing URL paths stable.

## Checks

Run `npx tsc --noEmit`, `npm run build`, and `npm run lint` from `frontend`. For UI changes, check desktop and mobile, both themes, sidebar collapse, mobile dialog focus/close behavior, and affected tool controls. Do not trigger paid audits or searches just to test rendering.
